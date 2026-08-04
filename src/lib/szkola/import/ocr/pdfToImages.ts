import "server-only";

/**
 * PDF -> obraz JEDNEJ strony, do dalszego OCR. Silnik: mupdf (oficjalny
 * pakiet Artifexu), czyste WebAssembly — bez natywnych binarek per-platforma
 * (sprawdzone: paczka zawiera wyłącznie mupdf-wasm.wasm, zero plików .node).
 * To świadomy wybór ZAMIAST pdfjs-dist + @napi-rs/canvas — ta druga
 * kombinacja to dokładnie ta sama klasa natywnej zależności, która
 * spowodowała wcześniejszą awarię modułu importu na Vercelu.
 *
 * ŚWIADOMIE renderujemy TYLKO jedną stronę na wywołanie (dokument otwierany
 * i zamykany za każdym razem), zamiast renderować wszystkie strony z góry —
 * pomiar na realnym pliku produkcyjnym pokazał, że pojedyncze otwarcie
 * dokumentu + render strony to ~100ms, więc koszt otwarcia dokumentu
 * ponownie dla ewentualnej drugiej strony jest pomijalny, a dzięki temu
 * NIGDY nie renderujemy stron, których i tak nie użyjemy (patrz heurystyka
 * wczesnego zakończenia w localOcrProvider.ts — w większości przypadków
 * strona 2+ w ogóle nie jest renderowana).
 *
 * Import DYNAMICZNY z tego samego powodu co pdf-parse w importExtraction.ts:
 * błąd ładowania modułu (jakikolwiek) ma zostać złapany w miejscu użycia,
 * nie wywalić całego pliku przy starcie.
 */

// 150 DPI: wystarczające do OCR, w środku zalecanego zakresu 150-180.
const OCR_RENDER_DPI = 150;

export type PdfInfo = {
  totalPages: number;
  /** true, jeśli PDF wymaga hasła — renderowanie nie jest w ogóle możliwe. */
  encrypted: boolean;
};

export async function getPdfInfo(buffer: Buffer): Promise<PdfInfo> {
  const mupdf = await import("mupdf");
  const doc = mupdf.Document.openDocument(buffer, "application/pdf");
  try {
    if (doc.needsPassword()) return { totalPages: 0, encrypted: true };
    return { totalPages: doc.countPages(), encrypted: false };
  } finally {
    doc.destroy();
  }
}

export async function renderPdfPageToImage(buffer: Buffer, pageIndex: number): Promise<Buffer> {
  const mupdf = await import("mupdf");
  const doc = mupdf.Document.openDocument(buffer, "application/pdf");
  try {
    const scale = OCR_RENDER_DPI / 72;
    const matrix = mupdf.Matrix.scale(scale, scale);
    const page = doc.loadPage(pageIndex);
    try {
      const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
      try {
        return Buffer.from(pixmap.asPNG());
      } finally {
        pixmap.destroy();
      }
    } finally {
      page.destroy();
    }
  } finally {
    doc.destroy();
  }
}
