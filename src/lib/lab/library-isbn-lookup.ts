import "server-only";

export type IsbnLookupResult = {
  title: string | null;
  author: string | null;
  publisher: string | null;
  year: number | null;
  /** Wypełnione też przy wyszukiwaniu po tytule/autorze (lookupBookByTitleAuthor) — katalog często zna ISBN, którego OCR nie odczytał (np. bo jest na tylnej okładce, niewidocznej na zdjęciu). */
  isbn: string | null;
};

type GoogleBooksVolumeInfo = {
  title?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  industryIdentifiers?: { type?: string; identifier?: string }[];
};

const REQUEST_TIMEOUT_MS = 6000;

function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[^0-9Xx]/g, "");
}

function parseVolumeInfo(info: GoogleBooksVolumeInfo): IsbnLookupResult {
  const yearMatch = info.publishedDate?.match(/\d{4}/);
  const identifiers = info.industryIdentifiers ?? [];
  const isbn13 = identifiers.find((i) => i.type === "ISBN_13")?.identifier;
  const isbn10 = identifiers.find((i) => i.type === "ISBN_10")?.identifier;

  return {
    title: info.title?.trim() || null,
    author: info.authors && info.authors.length > 0 ? info.authors.join(", ") : null,
    publisher: info.publisher?.trim() || null,
    year: yearMatch ? Number.parseInt(yearMatch[0], 10) : null,
    isbn: isbn13 ?? isbn10 ?? null,
  };
}

async function fetchGoogleBooksVolume(query: string): Promise<GoogleBooksVolumeInfo | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;

    const json = (await res.json()) as { items?: { volumeInfo?: GoogleBooksVolumeInfo }[] };
    return json.items?.[0]?.volumeInfo ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
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

  const info = await fetchGoogleBooksVolume(`isbn:${isbn}`);
  return info ? parseVolumeInfo(info) : null;
}

/**
 * Sekcja 4 briefu ("Dodaj ze zdjęcia"): okładki książek najczęściej NIE mają
 * czytelnego ISBN-u na PRZEDNIEJ stronie (leży na tylnej okładce albo
 * stronie redakcyjnej, których zdjęcie zwykle nie obejmuje) — bez tego
 * fallbacku rozpoznawanie działałoby tylko dla zdjęć tylnej okładki/strony
 * z kodem kreskowym. Google Books `intitle:`/`inauthor:` to zwykłe
 * wyszukiwanie pełnotekstowe (nie wymaga dokładnego dopasowania), więc ma
 * sensowną szansę trafić nawet z niedoskonałym odczytem OCR — użytkownik
 * i tak zawsze widzi i zatwierdza wynik w formularzu przed zapisem.
 */
export async function lookupBookByTitleAuthor(title: string, author: string | null): Promise<IsbnLookupResult | null> {
  const cleanTitle = title.trim();
  if (!cleanTitle) return null;

  const query = author?.trim() ? `intitle:${cleanTitle} inauthor:${author.trim()}` : `intitle:${cleanTitle}`;
  const info = await fetchGoogleBooksVolume(query);
  return info ? parseVolumeInfo(info) : null;
}
