import "server-only";
import path from "node:path";
import type { Worker } from "tesseract.js";
import { OCR_LANGUAGES, type OcrProvider, type OcrResult } from "./types";
import { renderPdfPagesToImages, MAX_OCR_PAGES } from "./pdfToImages";
import { preprocessImageForOcr } from "./imagePreprocessing";
import { logImportStage } from "../../importLogging";

/**
 * Silnik OCR: tesseract.js (jądro WASM, `tesseract.js-core`) — czyste
 * WebAssembly, bez natywnych binarek per-platforma. Przetwarzanie w całości
 * po stronie serwera (Node.js), nigdy w przeglądarce użytkownika.
 *
 * Dane językowe (.traineddata) są SAMOHOSTOWANE w public/ocr-lang/ zamiast
 * pobierane w runtime z domyślnego CDN tesseract.js (jsdelivr) — dokument
 * użytkownika i tak nigdy tam nie trafia (to tylko generyczny, publiczny
 * model językowy, nie treść dokumentu), ale samohostowanie: (1) usuwa
 * jakąkolwiek zależność od zewnętrznej sieci w runtime OCR, (2) jest
 * szybsze (odczyt z dysku zamiast fetch), (3) jest w 100% zgodne z "preferuj
 * przetwarzanie lokalne". Zweryfikowane lokalnie: worker z 4 językami
 * ładuje się z tych plików w ~400ms, bez sięgania do sieci.
 *
 * BEZWZGLĘDNY TIMEOUT (naprawa "wisi w processing"): trzy warstwy timeoutów
 * zamiast jednej. Wcześniej JEDYNY timeout otaczał pojedyncze
 * worker.recognize() — jeśli zawiesiło się tworzenie workera
 * (createWorker) ALBO worker.terminate() w finally (typowe, gdy terminate
 * jest wywoływane na workerze, który wciąż coś liczy po tym, jak jego
 * recognize() już "przegrało" wyścig z timeoutem), CAŁA funkcja wisiała bez
 * końca — a Vercel bez jawnego maxDuration (patrz page.tsx) mógł zabić
 * proces jeszcze wcześniej, zanim jakikolwiek kod aplikacji (łącznie z tym
 * timeoutem) zdążył zareagować. Teraz: (1) OVERALL_TIMEOUT_MS otacza CAŁĄ
 * operację (tworzenie workera + wszystkie strony) i to on jest realnym
 * murem obronnym, (2) tworzenie workera ma własny limit, (3) terminate()
 * jest "best effort" z krótkim limitem i NIGDY nie blokuje zwrócenia
 * wyniku (fire-and-forget) — sprzątanie po przegranym wyścigu i tak nie
 * ma znaczenia dla użytkownika, bo proces serverless i tak zaraz się kończy.
 */

const LANG_PATH = path.join(process.cwd(), "public", "ocr-lang");
// Realny "mur obronny" — musi być wyraźnie MNIEJSZY niż maxDuration w
// page.tsx (90s), żeby to ten timeout zdążył zadziałać pierwszy i zapisać
// czytelny stan w bazie, zanim Vercel zabije proces z zewnątrz.
const OVERALL_TIMEOUT_MS = 75_000;
const WORKER_CREATE_TIMEOUT_MS = 20_000;
// Per strona — mniejszy niż budżet całości, żeby pętla stron zawsze zdążyła
// sprawdzić deadline między stronami zamiast utknąć w jednej.
const RECOGNIZE_TIMEOUT_MS = 30_000;
const TERMINATE_TIMEOUT_MS = 5_000;

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
  try {
    await withTimeout(worker.terminate(), TERMINATE_TIMEOUT_MS, "terminate-worker");
  } catch {
    logImportStage("ocr-worker-terminate-failed");
  }
}

async function createTesseractWorker(): Promise<Worker> {
  const { createWorker } = await import("tesseract.js");
  return withTimeout(
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
  );
}

async function recognizeSinglePage(worker: Worker, png: Buffer): Promise<{ text: string; confidence: number }> {
  const { data } = await withTimeout(worker.recognize(png), RECOGNIZE_TIMEOUT_MS, "recognize-page");
  return { text: data.text ?? "", confidence: data.confidence ?? 0 };
}

class LocalOcrProvider implements OcrProvider {
  async recognizeImage(input: Buffer, mimeType: string): Promise<OcrResult> {
    return withTimeout(this.recognizeImageInner(input, mimeType), OVERALL_TIMEOUT_MS, "recognize-image-overall");
  }

  private async recognizeImageInner(input: Buffer, mimeType: string): Promise<OcrResult> {
    const warnings: string[] = [];
    logImportStage("ocr-image-start", { mimeType, inputBytes: input.length });

    const worker = await createTesseractWorker();
    try {
      const preprocessed = await preprocessImageForOcr(input).catch(() => {
        warnings.push("Wstępne przetwarzanie obrazu nie powiodło się — użyto oryginału.");
        return input;
      });
      const { text, confidence } = await recognizeSinglePage(worker, preprocessed);
      logImportStage("ocr-image-done", { textLength: text.length, confidence });
      return { text, confidence, pagesProcessed: 1, warnings };
    } finally {
      void safeTerminate(worker);
    }
  }

  async recognizePdf(input: Buffer): Promise<OcrResult> {
    return withTimeout(this.recognizePdfInner(input), OVERALL_TIMEOUT_MS, "recognize-pdf-overall");
  }

  private async recognizePdfInner(input: Buffer): Promise<OcrResult> {
    // Zapas 5s na worker.terminate()/domknięcie odpowiedzi w ramach
    // OVERALL_TIMEOUT_MS — pętla stron kończy się WCZEŚNIEJ niż zewnętrzny
    // Promise.race, więc wynik częściowy (już rozpoznane strony) ma szansę
    // wrócić jako "partial" zamiast zostać ucięty surowym odrzuceniem.
    const deadline = Date.now() + OVERALL_TIMEOUT_MS - 5_000;
    logImportStage("ocr-pdf-start", { inputBytes: input.length });
    const { pages, totalPages, truncated: pageLimitTruncated, encrypted } = await renderPdfPagesToImages(input, MAX_OCR_PAGES);

    if (encrypted) {
      logImportStage("ocr-pdf-encrypted");
      return {
        text: "",
        pagesProcessed: 0,
        warnings: ["Dokument PDF jest zaszyfrowany/chroniony hasłem — automatyczny odczyt nie jest możliwy."],
      };
    }
    if (pages.length === 0) {
      logImportStage("ocr-pdf-no-pages", { totalPages });
      return { text: "", pagesProcessed: 0, warnings: ["Nie udało się wyrenderować żadnej strony dokumentu."] };
    }

    const warnings: string[] = [];
    if (pageLimitTruncated) {
      warnings.push(
        `Dokument ma ${totalPages} stron — automatycznie przetworzono pierwsze ${pages.length}. Pełne przetworzenie można uruchomić ręcznie.`,
      );
    }

    const worker = await createTesseractWorker();
    try {
      const texts: string[] = [];
      const confidences: number[] = [];
      let timeBudgetExceeded = false;

      for (const page of pages) {
        if (Date.now() >= deadline) {
          timeBudgetExceeded = true;
          break;
        }
        logImportStage("ocr-page-progress", { page: page.pageIndex + 1, total: pages.length });
        try {
          const preprocessed = await preprocessImageForOcr(page.png).catch(() => page.png);
          const { text, confidence } = await recognizeSinglePage(worker, preprocessed);
          texts.push(text);
          confidences.push(confidence);
        } catch {
          warnings.push(`Nie udało się rozpoznać strony ${page.pageIndex + 1}.`);
        }
      }

      if (timeBudgetExceeded) {
        warnings.push(`Przekroczono limit czasu — rozpoznano ${texts.length} z ${pages.length} przygotowanych stron.`);
      }

      const avgConfidence = confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : undefined;
      logImportStage("ocr-pdf-done", { pagesProcessed: texts.length, avgConfidence, timeBudgetExceeded });
      return { text: texts.join("\n\n"), confidence: avgConfidence, pagesProcessed: texts.length, warnings };
    } finally {
      void safeTerminate(worker);
    }
  }
}

export function createLocalOcrProvider(): OcrProvider {
  return new LocalOcrProvider();
}
