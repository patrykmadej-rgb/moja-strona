/**
 * Supabase Storage odrzuca klucze obiektów zawierające znaki spoza zbioru
 * [\w!\-.*'()  &$@=;:+,?] (walidacja po stronie Storage API) — czyli m.in.
 * polskie znaki diakrytyczne (ą, ę, ł...) w NAZWIE PLIKU powodują błąd
 * "Invalid key" przy uploadzie. Ta funkcja czyści fragment ścieżki
 * budowany z nazwy pliku, żeby klucz był zawsze bezpieczny — oryginalna
 * nazwa (do wyświetlania/pobierania) zostaje osobno w kolumnie DB.
 */
function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function sanitizeStorageFilename(filename: string): string {
  const withoutDiacritics = stripDiacritics(filename);
  const sanitized = withoutDiacritics
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return sanitized || "plik";
}
