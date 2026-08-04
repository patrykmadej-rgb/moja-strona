import "server-only";

/**
 * PDF -> obrazy stron, do dalszego OCR. Silnik: mupdf (oficjalny pakiet
 * Artifexu), czyste WebAssembly — bez natywnych binarek per-platforma
 * (sprawdzone: paczka zawiera wyłącznie mupdf-wasm.wasm, zero plików .node).
 * To świadomy wybór ZAMIAST pdfjs-dist + @napi-rs/canvas — ta druga
 * kombinacja to dokładnie ta sama klasa natywnej zależności, która
 * spowodowała wcześniejszą awarię modułu importu na Vercelu.
 *
 * Import DYNAMICZNY z tego samego powodu co pdf-parse w importExtraction.ts:
 * błąd ładowania modułu (jakikolwiek) ma zostać złapany w miejscu użycia,
 * nie wywalić całego pliku przy starcie.
 */

export const MAX_OCR_PAGES = 10;
const OCR_RENDER_DPI = 150; // wystarczające do OCR, bez przesadnego zużycia pamięci/czasu

export type PdfPageImage = { pageIndex: number; png: Buffer };

export type PdfToImagesResult = {
  pages: PdfPageImage[];
  totalPages: number;
  /** true, jeśli dokument ma więcej stron niż maxPages i część została pominięta. */
  truncated: boolean;
  /** true, jeśli PDF wymaga hasła — renderowanie nie było w ogóle możliwe. */
  encrypted: boolean;
};

export async function renderPdfPagesToImages(
  buffer: Buffer,
  maxPages: number = MAX_OCR_PAGES,
): Promise<PdfToImagesResult> {
  const mupdf = await import("mupdf");
  const doc = mupdf.Document.openDocument(buffer, "application/pdf");
  try {
    if (doc.needsPassword()) {
      return { pages: [], totalPages: 0, truncated: false, encrypted: true };
    }

    const totalPages = doc.countPages();
    const pagesToRender = Math.max(0, Math.min(totalPages, maxPages));
    const truncated = totalPages > pagesToRender;
    const scale = OCR_RENDER_DPI / 72;
    const matrix = mupdf.Matrix.scale(scale, scale);

    const pages: PdfPageImage[] = [];
    for (let index = 0; index < pagesToRender; index += 1) {
      const page = doc.loadPage(index);
      try {
        const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
        try {
          pages.push({ pageIndex: index, png: Buffer.from(pixmap.asPNG()) });
        } finally {
          pixmap.destroy();
        }
      } finally {
        page.destroy();
      }
    }

    return { pages, totalPages, truncated, encrypted: false };
  } finally {
    doc.destroy();
  }
}
