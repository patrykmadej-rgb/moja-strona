import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // pdf-parse pociąga pdfjs-dist + @napi-rs/canvas (natywny dodatek NAPI z
  // prebuildami per-platforma). Domyślny bundler Next.js (webpack/Turbopack)
  // próbuje wciągnąć te pakiety do bundla serverless function przez
  // statyczną analizę/tracing, co dla natywnych binarek .node często się
  // nie udaje (require() do platform-specific binarki jest obliczany w
  // runtime, nie da się go w pełni prześledzić statycznie) — znany,
  // udokumentowany problem przy PDF/canvas na Vercelu. serverExternalPackages
  // wyłącza bundlowanie tych pakietów: zostają zwykłym require() z
  // node_modules w runtime, tak jak działają lokalnie.
  // mupdf (renderowanie PDF -> obraz, PDF OCR) i tesseract.js (OCR) — obie
  // paczki noszą binarki WASM; ta sama zasada co wyżej: zostają jako zwykły
  // require()/import() w runtime zamiast być bundlowane.
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas", "pdfjs-dist", "mupdf", "tesseract.js"],
  // Trained data języków OCR (public/ocr-lang/*.traineddata.gz) są czytane z
  // dysku w runtime (path.join(process.cwd(), "public/ocr-lang")) przez
  // localOcrProvider.ts — pliki spod /public NIE są domyślnie śledzone do
  // bundla serverless function (są traktowane jako statyczne assety CDN, nie
  // pliki do odczytu przez fs w kodzie serwera), więc trzeba je jawnie
  // dołączyć, inaczej fs.readFile w produkcji dostanie ENOENT mimo że pliki
  // realnie leżą w repo.
  outputFileTracingIncludes: {
    "/lab/szkola/import": ["./public/ocr-lang/**/*"],
    "/lab/szkola/import/[id]": ["./public/ocr-lang/**/*"],
  },
};

export default withNextIntl(nextConfig);
