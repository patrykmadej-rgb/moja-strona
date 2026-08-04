import "server-only";
import { createLocalOcrProvider } from "./localOcrProvider";
import type { OcrDecision, OcrProvider, OcrResult } from "./types";

export type { OcrDecision, OcrLanguage, OcrProvider, OcrResult } from "./types";
export { OCR_LANGUAGES } from "./types";
export { createLocalOcrProvider } from "./localOcrProvider";
export { renderPdfPagesToImages, MAX_OCR_PAGES } from "./pdfToImages";
export { preprocessImageForOcr } from "./imagePreprocessing";

const MIN_MEANINGFUL_CHARS = 60; // środek zakresu 40-80 z briefu

/**
 * Decyduje, czy dla danego tekstu (już wyciągniętego zwykłym parserem) warto
 * w ogóle uruchamiać OCR — sekcja 2 briefu. Liczy "sensowne" znaki
 * (litery+cyfry), nie długość surowego stringa, żeby krótki, ale poprawny
 * tekst (np. sam numer rezerwacji na malutkim bilecie) nie był fałszywie
 * oceniony jako błędny. Sprawdza też proporcję "słów zawierających literę"
 * — typowy objaw źle zdekodowanej warstwy tekstowej PDF-a to ciąg symboli/
 * bajtów-śmieci, gdzie prawie żadne "słowo" nie zawiera żadnej litery.
 */
export function shouldUseOcr(extractedText: string | null, parseError?: unknown): OcrDecision {
  if (parseError) return { shouldRun: true, reason: "parse_error" };

  const text = (extractedText ?? "").trim();
  if (text.length === 0) return { shouldRun: true, reason: "empty_text" };

  const meaningfulChars = (text.match(/[\p{L}\p{N}]/gu) ?? []).length;
  if (meaningfulChars < MIN_MEANINGFUL_CHARS) {
    return { shouldRun: true, reason: "too_short" };
  }

  const words = text.split(/\s+/).filter(Boolean);
  const wordsWithLetters = words.filter((w) => /\p{L}/u.test(w)).length;
  const letterWordRatio = words.length > 0 ? wordsWithLetters / words.length : 0;
  if (words.length >= 5 && letterWordRatio < 0.3) {
    return { shouldRun: true, reason: "low_quality_text" };
  }

  return { shouldRun: false, reason: "not_needed" };
}

export type OcrQuality = "good" | "partial" | "failed";

/**
 * Ocena jakości WYNIKU OCR (sekcja 13) — po to, żeby nie polegać wyłącznie
 * na `confidence` zwróconym przez bibliotekę (który bywa myląco wysoki dla
 * spójnego, ale bezsensownego tekstu, i odwrotnie). Szuka strukturalnych
 * sygnałów typowych dla biletu/rezerwacji: data, godzina, kwota.
 */
export function assessOcrQuality(result: OcrResult): { quality: OcrQuality; warning: string | null } {
  const text = result.text.trim();
  const meaningfulChars = (text.match(/[\p{L}\p{N}]/gu) ?? []).length;

  if (meaningfulChars === 0) {
    return { quality: "failed", warning: null };
  }

  const hasStructuralSignal =
    /\b\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}\b/.test(text) ||
    /\b20\d{2}-\d{2}-\d{2}\b/.test(text) ||
    /\b\d{1,2}:\d{2}\b/.test(text) ||
    /\b\d+[.,]\d{2}\s?(PLN|EUR|DKK|USD|zł|kr)\b/i.test(text);

  if (meaningfulChars >= 40 && hasStructuralSignal) {
    return { quality: "good", warning: null };
  }
  if (meaningfulChars >= 20) {
    return { quality: "partial", warning: "Rozpoznano część treści, ale wynik może zawierać błędy." };
  }
  return { quality: "failed", warning: null };
}

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isOcrEligibleMimeType(mimeType: string | null): boolean {
  if (!mimeType) return false;
  return mimeType === "application/pdf" || IMAGE_MIME_TYPES.has(mimeType);
}

/**
 * Wspólny punkt wejścia do OCR używany przez actions.ts — nie zna różnicy
 * między "providerem lokalnym" a jakimkolwiek innym, tylko interfejs
 * OcrProvider (sekcja 4: reszta modułu nie ma być mocno sprzężona z
 * konkretną biblioteką).
 */
export async function runOcr(
  input: { buffer: Buffer; mimeType: string },
  provider: OcrProvider = createLocalOcrProvider(),
): Promise<OcrResult> {
  if (input.mimeType === "application/pdf" && provider.recognizePdf) {
    return provider.recognizePdf(input.buffer);
  }
  return provider.recognizeImage(input.buffer, input.mimeType);
}
