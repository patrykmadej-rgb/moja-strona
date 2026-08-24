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

type OpenLibraryDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  publisher?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_i?: number;
};

function openLibraryCoverUrl(coverId: number, size: "S" | "M" | "L" = "M"): string {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

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
    // GOOGLE_BOOKS_API_KEY jest w pełni opcjonalny (brak = działa jak dotąd,
    // bezkluczowo) — patrz komentarz przy lookupBookByIsbn. Zweryfikowano
    // ręcznie 2026-08-24: zapytania BEZ klucza z tego środowiska zwracały
    // HTTP 429 "quota_limit_value: 0" (anonimowy limit Google Books API
    // był wyczerpany/wyzerowany), co było rzeczywistą przyczyną, dla której
    // istniejące książki (np. "Leżąc na kozetce") nigdy nie dostawały
    // okładki — searchBookCovers cicho zwracało pustą listę. Darmowy klucz
    // (Google Cloud Console, bez włączonego billingu) usuwa ten limit;
    // dopóki go nie ma, `searchOpenLibraryCovers` niżej działa jako
    // bezkluczowy fallback.
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}${apiKey ? `&key=${encodeURIComponent(apiKey)}` : ""}`;
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
 * Fallback, gdy Google Books nic nie znajdzie (albo — zweryfikowany
 * przypadek — odrzuci zapytanie limitem). Open Library jest w pełni
 * bezkluczowe, bez limitu wymagającego klucza, i ma dobre pokrycie
 * anglojęzycznych/oryginalnych wydań — dla wielu polskich tłumaczeń wciąż
 * brakuje mu polskojęzycznej okładki (sprawdzone ręcznie dla obu książek z
 * przykładu w briefie: Open Library nie ma edycji "Psychoza"/"Leżąc na
 * kozetce" pod polskim tytułem), ale zwraca oryginalną okładkę — to wciąż
 * "rozsądny bezpłatny fallback" (sekcja 5 briefu): realna okładka jest
 * lepsza niż trwały placeholder, a użytkownik zawsze może zmienić okładkę
 * ręcznie (Zakres 6 briefu).
 */
async function fetchOpenLibraryDocs(query: string, limit: number): Promise<OpenLibraryDoc[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}&fields=title,author_name,publisher,first_publish_year,isbn,cover_i`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];

    const json = (await res.json()) as { docs?: OpenLibraryDoc[] };
    return json.docs ?? [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Google Books API (volumes:list, q=isbn:...) — publiczny endpoint (sekcja 6
 * briefu: "jeśli da się dodać... bez nieuzasadnionej komplikacji, uwzględnij
 * ją"), opcjonalnie wzmocniony darmowym GOOGLE_BOOKS_API_KEY (patrz
 * fetchGoogleBooksVolumes). Jeśli Google nic nie zwróci — Open Library jako
 * bezkluczowy fallback (sekcja 5 briefu).
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
  if (info) return parseVolumeInfo(info);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`, { signal: controller.signal });
    if (!res.ok) return null;
    const json = (await res.json()) as Record<
      string,
      { title?: string; authors?: { name?: string }[]; publishers?: { name?: string }[]; publish_date?: string; cover?: { medium?: string } }
    >;
    const entry = json[`ISBN:${isbn}`];
    if (!entry) return null;
    const yearMatch = entry.publish_date?.match(/\d{4}/);
    return {
      title: entry.title?.trim() || null,
      author: entry.authors && entry.authors.length > 0 ? entry.authors.map((a) => a.name).filter(Boolean).join(", ") : null,
      publisher: entry.publishers?.[0]?.name?.trim() || null,
      year: yearMatch ? Number.parseInt(yearMatch[0], 10) : null,
      isbn,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
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

  const cleanAuthor = author?.trim() || null;
  const query = cleanAuthor ? `intitle:${cleanTitle} inauthor:${cleanAuthor}` : `intitle:${cleanTitle}`;
  const info = await fetchGoogleBooksVolume(query);
  if (info) return parseVolumeInfo(info);

  const [doc] = await fetchOpenLibraryDocs(cleanAuthor ? `${cleanTitle} ${cleanAuthor}` : cleanTitle, 1);
  if (!doc) return null;
  return {
    title: doc.title?.trim() || null,
    author: doc.author_name && doc.author_name.length > 0 ? doc.author_name.join(", ") : null,
    publisher: doc.publisher?.[0]?.trim() || null,
    year: doc.first_publish_year ?? null,
    isbn: doc.isbn?.[0] ?? null,
  };
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

  const cleanAuthor = author?.trim() || null;
  const query = cleanAuthor ? `intitle:${cleanTitle} inauthor:${cleanAuthor}` : `intitle:${cleanTitle}`;
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

  // Fallback (sekcja 5 briefu): zweryfikowana przyczyna, dla której istniejące
  // książki nigdy nie dostawały okładki — Google Books bez klucza potrafi
  // zwrócić HTTP 429 (limit=0), co fetchGoogleBooksVolumes ciicho zamienia
  // w pustą listę. Open Library nie ma tego limitu.
  if (candidates.length > 0) return candidates;

  const docs = await fetchOpenLibraryDocs(cleanAuthor ? `${cleanTitle} ${cleanAuthor}` : cleanTitle, COVER_SEARCH_MAX_RESULTS);
  const olSeen = new Set<string>();

  for (const doc of docs) {
    if (!doc.cover_i || !doc.key) continue;
    const dedupeKey = `${(doc.title ?? "").trim().toLowerCase()}|${(doc.publisher?.[0] ?? "").trim().toLowerCase()}`;
    if (olSeen.has(dedupeKey)) continue;
    olSeen.add(dedupeKey);

    candidates.push({
      id: doc.key,
      title: doc.title?.trim() || null,
      author: doc.author_name && doc.author_name.length > 0 ? doc.author_name.join(", ") : null,
      publisher: doc.publisher?.[0]?.trim() || null,
      year: doc.first_publish_year ?? null,
      isbn: doc.isbn?.[0] ?? null,
      thumbnailUrl: openLibraryCoverUrl(doc.cover_i),
    });

    if (candidates.length >= COVER_SEARCH_MAX_CANDIDATES) break;
  }

  return candidates;
}
