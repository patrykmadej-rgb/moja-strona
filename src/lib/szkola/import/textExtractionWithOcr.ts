import "server-only";
import { extractFromEml, extractTextFromUpload } from "@/lib/szkola/importExtraction";
import { shouldUseOcr, runOcr, assessOcrQuality } from "@/lib/szkola/import/ocr";
import { logImportStage, safeErrorMessage } from "@/lib/szkola/importLogging";
import type { ExtractionMethod, OcrStatus, ProcessingStage } from "@/lib/szkola/types";

/**
 * Jeden punkt wejścia do "daj mi tekst z tego pliku, użyj OCR jeśli trzeba" —
 * używany przez upload, "Przetwórz ponownie" i "Spróbuj OCR" (sekcja 14
 * briefu: jedna logika klasyfikacji ma obsługiwać tekst z warstwy PDF-a,
 * OCR-u, wklejonego e-maila i EML — a to zaczyna się od tego, że wszystkie
 * one przechodzą przez ten sam punkt ekstrakcji tekstu).
 */
export type ExtractionOutcome = {
  text: string;
  senderName: string | null;
  subject: string | null;
  receivedAt: string | null;
  extractionMethod: ExtractionMethod;
  ocrStatus: OcrStatus;
  ocrConfidence: number | null;
  ocrPagesProcessed: number | null;
  ocrWarnings: string[];
  processingStage: ProcessingStage;
};

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type OcrOutcome = Pick<
  ExtractionOutcome,
  "text" | "extractionMethod" | "ocrStatus" | "ocrConfidence" | "ocrPagesProcessed" | "ocrWarnings" | "processingStage"
>;

async function runOcrStep(buffer: Buffer, mimeType: string): Promise<OcrOutcome> {
  logImportStage("ocr-preparing", { mimeType });
  try {
    const result = await runOcr({ buffer, mimeType });
    const { quality, warning } = assessOcrQuality(result);
    const warnings = warning ? [...result.warnings, warning] : result.warnings;
    logImportStage("ocr-analysis-done", { quality, pagesProcessed: result.pagesProcessed });
    return {
      text: result.text,
      extractionMethod: quality === "failed" ? "none" : "ocr",
      ocrStatus: quality === "failed" ? "failed" : quality === "partial" ? "partial" : "completed",
      ocrConfidence: result.confidence ?? null,
      ocrPagesProcessed: result.pagesProcessed,
      ocrWarnings: warnings,
      processingStage: quality === "failed" ? "needs_manual_review" : "analyzing",
    };
  } catch (err) {
    // Błąd OCR nie może wywalić całej strony (sekcja 12) — plik i rekord
    // zostają, użytkownik dostaje jasny komunikat i może uzupełnić ręcznie
    // albo ponowić OCR. Timeout (mur obronny w localOcrProvider.ts) ma
    // osobny, konkretniejszy komunikat niż generyczny błąd OCR.
    const isTimeout = err instanceof Error && err.message.startsWith("OCR_TIMEOUT");
    logImportStage(isTimeout ? "ocr-timeout" : "ocr-error");
    return {
      text: "",
      extractionMethod: "none",
      ocrStatus: "failed",
      ocrConfidence: null,
      ocrPagesProcessed: null,
      ocrWarnings: [
        isTimeout
          ? "Automatyczne odczytywanie dokumentu trwało zbyt długo i zostało przerwane. Możesz spróbować ponownie lub uzupełnić dane ręcznie."
          : safeErrorMessage(
              err,
              "Nie udało się odczytać dokumentu automatycznie. Plik został bezpiecznie zapisany. Możesz uzupełnić dane ręcznie lub ponowić OCR.",
            ),
      ],
      processingStage: "ocr_error",
    };
  }
}

/** forceOcr=true pomija shouldUseOcr — dla akcji "Spróbuj OCR" (sekcja 11), gdzie użytkownik świadomie prosi o OCR niezależnie od automatycznej oceny. */
export async function extractTextWithOcrFallback(
  mimeType: string,
  buffer: Buffer,
  options: { forceOcr?: boolean } = {},
): Promise<ExtractionOutcome> {
  if (mimeType === "message/rfc822") {
    const parsed = await extractFromEml(buffer);
    const hasText = parsed.text.trim().length > 0;
    return {
      text: parsed.text,
      senderName: parsed.senderName,
      subject: parsed.subject,
      receivedAt: parsed.sentAt,
      extractionMethod: hasText ? "text_layer" : "none",
      ocrStatus: "not_needed",
      ocrConfidence: null,
      ocrPagesProcessed: null,
      ocrWarnings: [],
      processingStage: hasText ? "analyzing" : "needs_manual_review",
    };
  }

  if (IMAGE_MIME_TYPES.has(mimeType)) {
    // Sekcja 1: dla JPG/PNG/WEBP OCR jest jedyną drogą do tekstu, nie ma
    // "warstwy tekstowej" do sprawdzenia najpierw.
    logImportStage("ocr-fallback-triggered", { mimeType, reason: "image_mime_type" });
    const ocrOutcome = await runOcrStep(buffer, mimeType);
    return { ...ocrOutcome, senderName: null, subject: null, receivedAt: null };
  }

  if (mimeType === "application/pdf") {
    logImportStage("reading-pdf");
    const text = (await extractTextFromUpload(mimeType, buffer)) ?? "";
    const decision = options.forceOcr ? { shouldRun: true, reason: "manual_request" as const } : shouldUseOcr(text);

    if (!decision.shouldRun) {
      return {
        text,
        senderName: null,
        subject: null,
        receivedAt: null,
        extractionMethod: "text_layer",
        ocrStatus: "not_needed",
        ocrConfidence: null,
        ocrPagesProcessed: null,
        ocrWarnings: [],
        processingStage: "analyzing",
      };
    }

    logImportStage("ocr-fallback-triggered", { mimeType, reason: decision.reason });
    const ocrOutcome = await runOcrStep(buffer, mimeType);
    return { ...ocrOutcome, senderName: null, subject: null, receivedAt: null };
  }

  // DOCX/TXT — istniejąca ścieżka, bez koncepcji OCR (nie skanowane dokumenty).
  const text = (await extractTextFromUpload(mimeType, buffer)) ?? "";
  const hasText = text.trim().length > 0;
  return {
    text,
    senderName: null,
    subject: null,
    receivedAt: null,
    extractionMethod: hasText ? "text_layer" : "none",
    ocrStatus: "not_needed",
    ocrConfidence: null,
    ocrPagesProcessed: null,
    ocrWarnings: [],
    processingStage: hasText ? "analyzing" : "needs_manual_review",
  };
}

/**
 * Ostateczny, bezpieczny komunikat pokazywany użytkownikowi (kolumna
 * processing_error) — ostrzeżenia z OCR mają pierwszeństwo (bardziej
 * konkretne: "część treści", "dokument zaszyfrowany" itd.), a pusty tekst
 * bez żadnych ostrzeżeń (np. sparsowany EML bez treści) dostaje ogólny
 * fallback z sekcji 2 briefu.
 */
export function buildProcessingNote(outcome: ExtractionOutcome, hasSourceFile: boolean): string | null {
  if (outcome.ocrWarnings.length > 0) return outcome.ocrWarnings.join(" ");
  if (hasSourceFile && outcome.text.trim().length === 0) {
    return "Plik został zapisany, ale nie udało się automatycznie odczytać jego treści. Możesz uzupełnić dane ręcznie lub spróbować ponownie.";
  }
  return null;
}
