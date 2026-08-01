import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // "server-only" zawsze rzuca błąd poza bundlerem Next.js (który go
      // wycisza tylko dla warunku exports "react-server"). Pod vitest/Node
      // ten warunek nie jest ustawiony, więc aliasujemy na nieszkodliwy
      // "empty.js" z tego samego pakietu — wyłącznie na potrzeby testów,
      // produkcyjny build Next.js nadal dostaje prawdziwe wymuszenie.
      "server-only": path.resolve(import.meta.dirname, "node_modules/server-only/empty.js"),
    },
  },
});
