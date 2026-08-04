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
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas", "pdfjs-dist"],
};

export default withNextIntl(nextConfig);
