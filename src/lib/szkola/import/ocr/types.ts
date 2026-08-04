/**
 * Warstwa abstrakcji OCR — reszta modułu importu zna tylko te typy, nie
 * konkretną bibliotekę (tesseract.js) ani sposób renderowania PDF-u (mupdf).
 * Podmiana silnika OCR w przyszłości = nowy plik implementujący OcrProvider,
 * bez dotykania actions.ts.
 */

export type OcrLanguage = "pol" | "eng" | "deu" | "dan";

/** Kolejność = priorytet przy łączeniu modeli w jednym workerze (patrz localOcrProvider.ts). */
export const OCR_LANGUAGES: OcrLanguage[] = ["pol", "eng", "deu", "dan"];

export type OcrResult = {
  text: string;
  /** 0-100, średnia pewność silnika OCR dla rozpoznanego tekstu (jeśli dostępna). */
  confidence?: number;
  pagesProcessed: number;
  warnings: string[];
};

export interface OcrProvider {
  recognizeImage(input: Buffer, mimeType: string): Promise<OcrResult>;
  recognizePdf?(input: Buffer): Promise<OcrResult>;
}

/** Wynik oceny, czy dokument w ogóle nadaje się do przekazania do OCR (patrz shouldUseOcr w index.ts). */
export type OcrDecision = {
  shouldRun: boolean;
  reason: "empty_text" | "too_short" | "low_quality_text" | "parse_error" | "manual_request" | "not_needed";
};
