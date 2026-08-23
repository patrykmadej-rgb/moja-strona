import type { MetadataRoute } from "next";

/**
 * Next.js Metadata File convention — manifest.ts MUSI leżeć w prawdziwym
 * korzeniu app/ (nie w src/app/lab/), inaczej Next go w ogóle nie generuje
 * jako trasy (sprawdzone: umieszczony w src/app/lab/manifest.ts nie
 * pojawiał się w zbudowanym app-paths-manifest.json). Generuje jeden plik
 * pod /manifest.webmanifest, niezależnie od tego, że dotyczy tylko /lab.
 *
 * Zakres instalacji mimo to jest ograniczony do /lab (prywatny panel), nie
 * do całej domeny: scope/start_url wskazują /lab, więc "Dodaj do ekranu
 * głównego" instaluje panel, a nie publiczną stronę. Link do tego pliku
 * jest dodany WYŁĄCZNIE w metadata src/app/lab/layout.tsx — publiczna
 * (site)/layout.tsx świadomie go nie referencuje, więc strona publiczna
 * nie oferuje instalacji jako PWA.
 *
 * Ikony to istniejące favicon-192/512 z public/ — ta sama identyfikacja
 * wizualna co reszta serwisu, bez tworzenia nowego brandingu.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Patryk Madej — Lab",
    short_name: "Lab",
    description: "Prywatny panel administracyjny: biblioteka, szkoła psychoterapii, schowek i notatki.",
    start_url: "/lab",
    scope: "/lab",
    display: "standalone",
    background_color: "#F5F1EC",
    theme_color: "#251332",
    icons: [
      { src: "/favicon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/favicon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
