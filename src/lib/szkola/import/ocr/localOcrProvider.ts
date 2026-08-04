import "server-only";
import path from "node:path";
import type { Worker } from "tesseract.js";
import { OCR_LANGUAGES, type OcrProvider, type OcrResult } from "./types";
import { getPdfInfo, renderPdfPageToImage } from "./pdfToImages";
import { preprocessImageForOcr } from "./imagePreprocessing";
import { hasEnoughSignalToStopEarly } from "./earlyExit";
import { logImportStage } from "../../importLogging";
import { timeStage, logStageTiming } from "./timing";

/**
 * Silnik OCR: tesseract.js (jądro WASM, `tesseract.js-core`) — czyste
 * WebAssembly, bez natywnych binarek per-platforma. Przetwarzanie w całości
 * po stronie serwera (Node.js), nigdy w przeglądarce użytkownika.
 *
 * Dane językowe (.traineddata) są SAMOHOSTOWANE w public/ocr-lang/ zamiast
 * pobierane w runtime z domyślnego CDN tesseract.js (jsdelivr) — samohostowanie
 * usuwa jakąkolwiek zależność od zewnętrznej sieci w runtime OCR i jest szybsze
 * (odczyt z dysku zamiast fetch).
 *
 * UPROSZCZONA ARCHITEKTURA (naprawa "OCR trwa bardzo długo mimo timeoutu"):
 * poprzednia wersja renderowała i próbowała rozpoznawać do 10 stron PDF-a
 * za każdym razem, z jednym, stosunkowo długim (75s) timeoutem — dla
 * dokumentu wielostronicowego to i tak było zbyt wolne w praktyce, nawet
 * jeśli w końcu się kończyło. Teraz:
 *  1. Renderujemy i rozpoznajemy TYLKO pierwszą stronę na start.
 *  2. Jeśli tekst z pierwszej strony zawiera wystarczające sygnały (data,
 *     godzina, przewoźnik, numer rezerwacji, trasa) — KOŃCZYMY od razu, bez
 *     dotykania kolejnych stron (patrz earlyExit.ts).
 *  3. W przeciwnym razie próbujemy jeszcze co najwyżej JEDNĄ kolejną stronę
 *     (twardy limit 2 stron dla automatycznego OCR biletu/rezerwacji).
 *  4. Jeden worker na CAŁY dokument (tworzony raz, zamykany raz).
 *  5. Twardy limit czasu 45s na całość — wyraźnie PONIŻEJ nawet
 *     najniższego typowego limitu funkcji serverless (Vercel Hobby: 60s),
 *     żeby to NASZ timeout zdążył zapisać czytelny stan w bazie, zanim
 *     platforma zabije proces z zewnątrz (co uniemożliwia jakikolwiek
 *     kod aplikacji, łącznie z try/catch/finally).
 */

const LANG_PATH = path.join(process.cwd(), "public", "ocr-lang");
const OVERALL_TIMEOUT_MS = 45_000;
const WORKER_CREATE_TIMEOUT_MS = 15_000;
const RECOGNIZE_TIMEOUT_MS = 20_000;
const TERMINATE_TIMEOUT_MS = 5_000;

/** Sekcja "maksymalnie 2 strony OCR dla dokumentów typu bilet/rezerwacja" — dotyczy automatycznego OCR w tym pipeline. */
export const AUTO_OCR_PAGE_CAP = 2;

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`OCR_TIMEOUT:${label}`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

/** Nigdy nie rzuca i nigdy nie blokuje odpowiedzi — najwyżej zostawia workera do posprzątania przez GC/koniec procesu. */
async function safeTerminate(worker: Worker): Promise<void> {
  const start = performance.now();
  try {
    await withTimeout(worker.terminate(), TERMINATE_TIMEOUT_MS, "terminate-worker");
    logStageTiming("worker-terminate", performance.now() - start);
  } catch {
    logImportStage("ocr-worker-terminate-failed");
  }
}

async function createTesseractWorker(): Promise<Worker> {
  const { createWorker } = await import("tesseract.js");
  return timeStage("worker-init", () =>
    withTimeout(
      createWorker(OCR_LANGUAGES, undefined, {
        langPath: LANG_PATH,
        cachePath: "/tmp/tesseract-cache",
        gzip: true,
        // Nigdy nie loguj treści/postępu OCR biblioteki wprost — logImportStage
        // poniżej loguje wyłącznie bezpieczne metadane (numer strony, długość).
        logger: () => {},
      }),
      WORKER_CREATE_TIMEOUT_MS,
      "create-worker",
    ),
  );
}

async function recognizeSinglePage(
  worker: Worker,
  png: Buffer,
  pageLabel: string,
): Promise<{ text: string; confidence: number }> {
  const { data } = await timeStage(`recognize-${pageLabel}`, () =>
    withTimeout(worker.recognize(png), RECOGNIZE_TIMEOUT_MS, "recognize-page"),
  );
  return { text: data.text ?? "", confidence: data.confidence ?? 0 };
}

async function preprocessForPage(png: Buffer, pageLabel: string): Promise<Buffer> {
  return timeStage(`preprocessing-${pageLabel}`, () => preprocessImageForOcr(png).catch(() => png));
}

class LocalOcrProvider implements OcrProvider {
  async recognizeImage(input: Buffer, mimeType: string): Promise<OcrResult> {
    return withTimeout(this.recognizeImageInner(input, mimeType), OVERALL_TIMEOUT_MS, "recognize-image-overall");
  }

  private async recognizeImageInner(input: Buffer, mimeType: string): Promise<OcrResult> {
    const totalStart = performance.now();
    logImportStage("ocr-image-start", { mimeType, inputBytes: input.length });

    const worker = await createTesseractWorker();
    try {
      const preprocessed = await preprocessForPage(input, "page-1");
      const { text, confidence } = await recognizeSinglePage(worker, preprocessed, "page-1");
      logImportStage("ocr-image-done", { textLength: text.length, confidence });
      logStageTiming("total", performance.now() - totalStart);
      return { text, confidence, pagesProcessed: 1, warnings: [] };
    } finally {
      void safeTerminate(worker);
    }
  }

  async recognizePdf(input: Buffer): Promise<OcrResult> {
    return withTimeout(this.recognizePdfInner(input), OVERALL_TIMEOUT_MS, "recognize-pdf-overall");
  }

  private async recognizePdfInner(input: Buffer): Promise<OcrResult> {
    const totalStart = performance.now();
    logImportStage("ocr-pdf-start", { inputBytes: input.length });

    const { totalPages, encrypted } = await getPdfInfo(input);
    if (encrypted) {
      logImportStage("ocr-pdf-encrypted");
      return {
        text: "",
        pagesProcessed: 0,
        warnings: ["Dokument PDF jest zaszyfrowany/chroniony hasłem — automatyczny odczyt nie jest możliwy."],
      };
    }
    if (totalPages === 0) {
      logImportStage("ocr-pdf-no-pages");
      return { text: "", pagesProcessed: 0, warnings: ["Nie udało się odczytać liczby stron dokumentu."] };
    }

    const pagesToTry = Math.min(totalPages, AUTO_OCR_PAGE_CAP);
    const warnings: string[] = [];

    const worker = await createTesseractWorker();
    try {
      const texts: string[] = [];
      const confidences: number[] = [];
      let stoppedEarly = false;

      for (let index = 0; index < pagesToTry; index += 1) {
        const pageLabel = `page-${index + 1}`;
        logImportStage("ocr-page-progress", { page: index + 1, total: pagesToTry });
        try {
          const png = await timeStage(`pdf-render-${pageLabel}`, () => renderPdfPageToImage(input, index));
          const preprocessed = await preprocessForPage(png, pageLabel);
          const { text, confidence } = await recognizeSinglePage(worker, preprocessed, pageLabel);
          texts.push(text);
          confidences.push(confidence);

          // Sekcja "jeżeli pierwsza strona daje wystarczający tekst, nie
          // przetwarzaj kolejnych" — sprawdzane po KAŻDEJ stronie, nie tylko
          // pierwszej, żeby też zatrzymać się po stronie 2, gdyby kiedyś
          // AUTO_OCR_PAGE_CAP było wyższe niż 2.
          if (hasEnoughSignalToStopEarly(text)) {
            logImportStage("ocr-early-exit", { afterPage: index + 1 });
            stoppedEarly = true;
            break;
          }
        } catch {
          warnings.push(`Nie udało się rozpoznać strony ${index + 1}.`);
        }
      }

      // Ostrzeżenie o obcięciu tylko wtedy, gdy NIE zatrzymaliśmy się wcześniej
      // z powodu wystarczających danych — jeśli strona 1 wystarczyła, fakt, że
      // dokument miał więcej stron, nie jest już istotny dla użytkownika.
      if (!stoppedEarly && totalPages > texts.length) {
        warnings.push(
          `Dokument ma ${totalPages} stron — automatycznie przetworzono pierwsze ${texts.length}. Pełne przetworzenie można uruchomić ręcznie.`,
        );
      }

      const avgConfidence = confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : undefined;
      logImportStage("ocr-pdf-done", { pagesProcessed: texts.length, avgConfidence, stoppedEarly });
      logStageTiming("total", performance.now() - totalStart);
      return { text: texts.join("\n\n"), confidence: avgConfidence, pagesProcessed: texts.length, warnings };
    } finally {
      void safeTerminate(worker);
    }
  }
}

export function createLocalOcrProvider(): OcrProvider {
  return new LocalOcrProvider();
}
