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
 */

const LANG_PATH = path.join(process.cwd(), "public", "ocr-lang");
// Per strona — żeby jeden pojedynczy dokument nigdy nie zawiesił procesu bez
// informacji (sekcja 16 briefu: timeout obsłużony jako partial/failed).
const RECOGNIZE_TIMEOUT_MS = 45_000;

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Przekroczono limit czasu OCR (${label}).`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

async function createTesseractWorker(): Promise<Worker> {
  const { createWorker } = await import("tesseract.js");
  return createWorker(OCR_LANGUAGES, undefined, {
    langPath: LANG_PATH,
    cachePath: "/tmp/tesseract-cache",
    gzip: true,
    // Nigdy nie loguj treści/postępu OCR biblioteki wprost — logImportStage
    // poniżej loguje wyłącznie bezpieczne metadane (numer strony, długość).
    logger: () => {},
  });
}

async function recognizeSinglePage(worker: Worker, png: Buffer): Promise<{ text: string; confidence: number }> {
  const { data } = await withTimeout(worker.recognize(png), RECOGNIZE_TIMEOUT_MS, "recognize-page");
  return { text: data.text ?? "", confidence: data.confidence ?? 0 };
}

class LocalOcrProvider implements OcrProvider {
  async recognizeImage(input: Buffer, mimeType: string): Promise<OcrResult> {
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
      await worker.terminate();
    }
  }

  async recognizePdf(input: Buffer): Promise<OcrResult> {
    logImportStage("ocr-pdf-start", { inputBytes: input.length });
    const { pages, totalPages, truncated, encrypted } = await renderPdfPagesToImages(input, MAX_OCR_PAGES);

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
    if (truncated) {
      warnings.push(
        `Dokument ma ${totalPages} stron — automatycznie przetworzono pierwsze ${pages.length}. Pełne przetworzenie można uruchomić ręcznie.`,
      );
    }

    const worker = await createTesseractWorker();
    try {
      const texts: string[] = [];
      const confidences: number[] = [];
      for (const page of pages) {
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

      const avgConfidence = confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : undefined;
      logImportStage("ocr-pdf-done", { pagesProcessed: texts.length, avgConfidence });
      return { text: texts.join("\n\n"), confidence: avgConfidence, pagesProcessed: texts.length, warnings };
    } finally {
      await worker.terminate();
    }
  }
}

export function createLocalOcrProvider(): OcrProvider {
  return new LocalOcrProvider();
}
