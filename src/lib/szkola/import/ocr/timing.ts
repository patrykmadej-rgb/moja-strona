/**
 * Dokładne pomiary czasu poszczególnych etapów OCR — WYŁĄCZNIE bezpieczne
 * metadane (nazwa etapu + liczba milisekund), nigdy treść dokumentu ani
 * dane osobowe. Format: `[school-ocr] etap: XXXms` — osobny prefiks od
 * `[school-import]` (importLogging.ts), żeby w logach dało się od razu
 * odróżnić diagnostykę wydajności OCR od reszty pipeline'u importu.
 */
export function logStageTiming(stage: string, ms: number): void {
  console.log(`[school-ocr] ${stage}: ${Math.round(ms)}ms`);
}

export async function timeStage<T>(stage: string, fn: () => PromiseLike<T>): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    logStageTiming(stage, performance.now() - start);
  }
}
