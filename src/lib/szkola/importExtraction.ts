import "server-only";
import { simpleParser } from "mailparser";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

/**
 * Wyciąganie tekstu z przesłanych plików — czysto tekstowe/regułowe, bez AI
 * (patrz importClassifier.ts). Dla obrazów (JPG/PNG/WEBP) CELOWO brak
 * ekstrakcji — to wymagałoby OCR (np. Tesseract/Google Vision), którego ten
 * projekt nie ma skonfigurowanego. Zdjęcia paragonów/biletów da się przesłać
 * i podejrzeć, ale nie są automatycznie klasyfikowane na podstawie treści —
 * użytkownik uzupełnia dane ręcznie. To świadome ograniczenie, nie atrapa.
 */

export type ParsedEmailContent = {
  subject: string | null;
  senderName: string | null;
  senderEmail: string | null;
  sentAt: string | null;
  text: string;
  attachments: { filename: string; mimeType: string; size: number }[];
};

export async function extractFromEml(buffer: Buffer): Promise<ParsedEmailContent> {
  const parsed = await simpleParser(buffer);
  const fromAddress = parsed.from?.value?.[0];

  return {
    subject: parsed.subject ?? null,
    senderName: fromAddress?.name || null,
    senderEmail: fromAddress?.address || null,
    sentAt: parsed.date ? parsed.date.toISOString() : null,
    text: (parsed.text ?? "").trim(),
    attachments: (parsed.attachments ?? []).map((a) => ({
      filename: a.filename ?? "załącznik",
      mimeType: a.contentType,
      size: a.size ?? 0,
    })),
  };
}

export async function extractFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}

export async function extractFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

export function extractFromTxt(buffer: Buffer): string {
  return buffer.toString("utf8").trim();
}

const TEXT_EXTRACTABLE_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "message/rfc822",
]);

export function isTextExtractable(mimeType: string): boolean {
  return TEXT_EXTRACTABLE_MIME_TYPES.has(mimeType);
}

/**
 * Wspólny punkt wejścia do ekstrakcji tekstu z pliku uploadu (PDF/DOCX/TXT/EML).
 * Dla nieobsługiwanych typów (obrazy) zwraca null zamiast rzucać wyjątek —
 * wywołujący kod traktuje to jako "brak treści do klasyfikacji regułowej".
 */
export async function extractTextFromUpload(mimeType: string, buffer: Buffer): Promise<string | null> {
  try {
    if (mimeType === "application/pdf") return await extractFromPdf(buffer);
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      return await extractFromDocx(buffer);
    }
    if (mimeType === "text/plain") return extractFromTxt(buffer);
    if (mimeType === "message/rfc822") {
      const parsed = await extractFromEml(buffer);
      return parsed.text;
    }
    return null;
  } catch {
    // Uszkodzony/niestandardowy plik — brak treści, nie blokujemy uploadu.
    // Element trafia do "Wymaga sprawdzenia" zamiast zostać odrzucony.
    return null;
  }
}
