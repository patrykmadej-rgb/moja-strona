import "server-only";

export type IsbnLookupResult = {
  title: string | null;
  author: string | null;
  publisher: string | null;
  year: number | null;
};

const REQUEST_TIMEOUT_MS = 6000;

function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[^0-9Xx]/g, "");
}

/**
 * Google Books API (volumes:list, q=isbn:...) — publiczny, bezkluczowy
 * endpoint (sekcja 6 briefu: "jeśli da się dodać... bez nieuzasadnionej
 * komplikacji, uwzględnij ją"). Działa bez klucza API, ale z niższym,
 * dzielonym limitem zapytań — opcjonalny GOOGLE_BOOKS_API_KEY (dopisany
 * jako `&key=` niżej) podniósłby limit, dziś nieużywany, bo podstawowa
 * funkcjonalność działa i bez niego.
 *
 * Zawsze best-effort: każdy błąd (timeout, brak wyników, sieć) zwraca
 * null, nigdy nie rzuca — wywołujący (recognize/isbn-lookup route) ma
 * wtedy po prostu pusty/częściowy formularz do ręcznego uzupełnienia,
 * zgodnie z zasadą "nigdy nie zapisuj bez weryfikacji".
 */
export async function lookupBookByIsbn(rawIsbn: string): Promise<IsbnLookupResult | null> {
  const isbn = normalizeIsbn(rawIsbn);
  if (isbn.length !== 10 && isbn.length !== 13) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}&maxResults=1`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      items?: { volumeInfo?: { title?: string; authors?: string[]; publisher?: string; publishedDate?: string } }[];
    };
    const info = json.items?.[0]?.volumeInfo;
    if (!info) return null;

    const yearMatch = info.publishedDate?.match(/\d{4}/);

    return {
      title: info.title?.trim() || null,
      author: info.authors && info.authors.length > 0 ? info.authors.join(", ") : null,
      publisher: info.publisher?.trim() || null,
      year: yearMatch ? Number.parseInt(yearMatch[0], 10) : null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
