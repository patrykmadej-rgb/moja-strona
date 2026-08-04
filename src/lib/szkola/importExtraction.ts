import "server-only";
import { simpleParser } from "mailparser";
import mammoth from "mammoth";
import { logImportStage } from "./importLogging";

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

/**
 * Import DYNAMICZNY (nie statyczny top-level) celowo: pdf-parse ciągnie za
 * sobą pdfjs-dist + @napi-rs/canvas (natywny dodatek NAPI, prebuild
 * per-platforma). Gdyby ten import był statyczny na górze pliku, a natywna
 * binarka nie załadowała się poprawnie w danym środowisku (znany problem
 * przy bundlowaniu natywnych zależności na Vercelu), całe module load tego
 * pliku (a przez to i actions.ts, które go importuje) padłoby PRZED
 * wejściem do jakiegokolwiek try/catch — dokładnie tak wyglądałaby awaria
 * całego Server Component/Action bez czytelnego komunikatu. Dynamiczny
 * import() zwraca odrzuconą obietnicę zamiast rzucać przy load module,
 * więc błąd łapiemy tutaj, w miejscu użycia.
 */
export async function extractFromPdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
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
  logImportStage("text-extraction-start", { mimeType, bufferBytes: buffer.length });
  try {
    let text: string | null;
    if (mimeType === "application/pdf") text = await extractFromPdf(buffer);
    else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      text = await extractFromDocx(buffer);
    } else if (mimeType === "text/plain") text = extractFromTxt(buffer);
    else if (mimeType === "message/rfc822") text = (await extractFromEml(buffer)).text;
    else text = null;

    logImportStage("text-extraction-done", { mimeType, textLength: text?.length ?? 0 });
    return text;
  } catch (err) {
    // Uszkodzony/niestandardowy/zaszyfrowany plik ALBO błąd samego parsera
    // (np. brakująca natywna zależność w danym środowisku) — brak treści,
    // nie blokujemy uploadu. Element trafia do "Wymaga sprawdzenia" zamiast
    // zostać odrzucony albo — gorzej — wywalić cały Server Action.
    logImportStage("text-extraction-failed", {
      mimeType,
      errorName: err instanceof Error ? err.name : typeof err,
    });
    return null;
  }
}
