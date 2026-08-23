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
  imageLinks?: { thumbnail?: string; smallThumbnail?: string };
};

type GoogleBooksVolume = { id?: string; volumeInfo?: GoogleBooksVolumeInfo };

export type BookCoverCandidate = {
  /** id tomu Google Books — używany wyłącznie jako klucz React / do rozróżniania kandydatów, nie zapisywany do bazy. */
  id: string;
  title: string | null;
  author: string | null;
  publisher: string | null;
  year: number | null;
  isbn: string | null;
  /** Zawsze HTTPS — patrz toHttpsUrl. */
  thumbnailUrl: string;
};

const REQUEST_TIMEOUT_MS = 6000;
const COVER_SEARCH_MAX_RESULTS = 8;
const COVER_SEARCH_MAX_CANDIDATES = 5;

function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[^0-9Xx]/g, "");
}

/** Sekcja 9 briefu: Google Books czasem zwraca miniatury po http:// — wymuszamy https, żeby nie blokowała ich przeglądarka (mixed content) ani next/image. */
function toHttpsUrl(url: string): string {
  return url.startsWith("http://") ? `https://${url.slice("http://".length)}` : url;
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

async function fetchGoogleBooksVolumes(query: string, maxResults: number): Promise<GoogleBooksVolume[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];

    const json = (await res.json()) as { items?: GoogleBooksVolume[] };
    return json.items ?? [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchGoogleBooksVolume(query: string): Promise<GoogleBooksVolumeInfo | null> {
  const [first] = await fetchGoogleBooksVolumes(query, 1);
  return first?.volumeInfo ?? null;
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

/**
 * Zakres 7 briefu ("automatyczne wyszukiwanie okładki"): rozszerza TĘ SAMĄ
 * integrację Google Books o kilku kandydatów zamiast jednego najlepszego
 * trafienia — potrzebne, gdy różne wydania tej samej książki mają różne
 * okładki i użytkownik ma wybrać właściwą (LibraryCoverPicker.tsx).
 *
 * Odfiltrowuje wyniki bez miniatury (wybór okładki nie ma sensu bez
 * obrazu) i usuwa oczywiste duplikaty (to samo wydanie zwrócone kilka
 * razy) po znormalizowanym tytule+wydawcy — NIE po ISBN, bo część
 * wyników z Google Books nie ma industryIdentifiers, a i tak chodzi o
 * odróżnienie WIZUALNIE różnych okładek, nie formalnie różnych wydań.
 */
export async function searchBookCovers(title: string, author: string | null): Promise<BookCoverCandidate[]> {
  const cleanTitle = title.trim();
  if (!cleanTitle) return [];

  const query = author?.trim() ? `intitle:${cleanTitle} inauthor:${author.trim()}` : `intitle:${cleanTitle}`;
  const volumes = await fetchGoogleBooksVolumes(query, COVER_SEARCH_MAX_RESULTS);

  const seen = new Set<string>();
  const candidates: BookCoverCandidate[] = [];

  for (const volume of volumes) {
    const info = volume.volumeInfo;
    const rawThumbnail = info?.imageLinks?.thumbnail ?? info?.imageLinks?.smallThumbnail;
    if (!info || !volume.id || !rawThumbnail) continue;

    const dedupeKey = `${(info.title ?? "").trim().toLowerCase()}|${(info.publisher ?? "").trim().toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const parsed = parseVolumeInfo(info);
    candidates.push({
      id: volume.id,
      title: parsed.title,
      author: parsed.author,
      publisher: parsed.publisher,
      year: parsed.year,
      isbn: parsed.isbn,
      thumbnailUrl: toHttpsUrl(rawThumbnail),
    });

    if (candidates.length >= COVER_SEARCH_MAX_CANDIDATES) break;
  }

  return candidates;
}
