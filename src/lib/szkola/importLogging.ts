import "server-only";

/**
 * Logowanie etapów pipeline'u importu — WYŁĄCZNIE bezpieczne metadane
 * (nazwa etapu, długość tekstu, mime type, identyfikator rekordu). Nigdy:
 * treść dokumentu/e-maila, tokeny, service role key, signed URL, dane
 * osobowe z biletu/rezerwacji. Dzięki temu logi Vercela pozwalają ustalić,
 * na którym DOKŁADNIE etapie coś się wysypało, bez ryzyka wycieku danych.
 */
export type ImportLogMeta = Record<string, string | number | boolean | null | undefined>;

export function logImportStage(stage: string, meta?: ImportLogMeta): void {
  if (meta) {
    console.log(`[school-import] ${stage}`, meta);
  } else {
    console.log(`[school-import] ${stage}`);
  }
}

/** Bezpieczna wersja komunikatu błędu do zapisania w processing_error / pokazania użytkownikowi — nigdy surowy stack trace. */
export function safeErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message && err.message.length < 300) return err.message;
  return fallback;
}
