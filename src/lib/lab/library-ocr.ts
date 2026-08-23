import "server-only";
import { createLocalOcrProvider } from "@/lib/szkola/import/ocr/localOcrProvider";
import { lookupBookByIsbn } from "@/lib/lab/library-isbn-lookup";

/**
 * Rozpoznawanie okładki książki ze zdjęcia (sekcja 6 briefu). Reużywa
 * DOSŁOWNIE tę samą infrastrukturę OCR co import dokumentów szkoły
 * (createLocalOcrProvider — tesseract.js, w pełni po stronie serwera,
 * samohostowane dane językowe w public/ocr-lang, zero kluczy API) —
 * projekt nie ma żadnej integracji AI/Vision do analizy obrazów, więc
 * to jest jedyne REALNIE działające rozpoznawanie tekstu dostępne dziś.
 *
 * Ekstrakcja tytułu/autora z rozpoznanego tekstu jest CELOWO prostą
 * heurystyką (najdłuższa z pierwszych linii = tytuł, linia w kształcie
 * "Imię Nazwisko" = autor) — tesseract.js nie zwraca tu informacji o
 * rozmiarze czcionki (tylko płaski tekst), więc nie da się rozpoznawać
 * "po wielkości liter na okładce" bez zmiany dzielonej z importem szkoły
 * warstwy OCR. To jest uczciwie ograniczone rozpoznawanie, nie sztuczna
 * inteligencja — dlatego wynik ZAWSZE trafia do edytowalnego formularza
 * (LibraryPhotoAddModal.tsx) przed zapisem, nigdy nie zapisuje się sam.
 *
 * Jeśli w tekście znajdzie się wiarygodny ISBN, wynik jest dodatkowo
 * wzbogacany/nadpisywany danymi z Google Books (lookupBookByIsbn) — to
 * znacznie podnosi trafność tytułu/autora/wydawcy, bo nie polega już na
 * samym OCR.
 *
 * Przyszłe podłączenie lepszego dostawcy (np. GPT-4/5 Vision albo Google
 * Cloud Vision) wymagałoby: nowego klucza API (np. OPENAI_API_KEY z
 * uprawnieniem do modelu z obsługą obrazów, albo GOOGLE_CLOUD_VISION_KEY),
 * nowej funkcji zgodnej z tym samym kształtem BookRecognitionResult, i
 * podmiany wywołania w recognizeBookFromImage — reszta pipeline'u
 * (upload, endpoint, formularz weryfikacji, zapis przez createLibraryBook)
 * zostałaby bez zmian.
 */
export type BookRecognitionResult = {
  title: string | null;
  author: string | null;
  isbn: string | null;
  publisher: string | null;
  year: number | null;
  /** 0-100 z silnika OCR, jeśli dostępne — pomaga UI pokazać "słabe rozpoznanie, sprawdź uważnie". */
  confidence: number | null;
  rawTextPreview: string;
  source: "ocr" | "ocr+isbn_lookup";
};

const ISBN_CANDIDATE_REGEX = /(?:97[89][-\s]?)?(?:\d[-\s]?){9}[\dXx]/g;

function extractIsbn(text: string): string | null {
  const candidates = text.match(ISBN_CANDIDATE_REGEX) ?? [];
  const normalized = candidates.map((c) => c.replace(/[^0-9Xx]/g, ""));
  // Prefiks 978/979 (Bookland) na 13 cyfrach to dużo bardziej wiarygodny
  // sygnał niż dowolne 10 cyfr — wolimy go, jeśli jest choć jeden taki
  // kandydat, zamiast brać "pierwszy z brzegu" 10-cyfrowy ciąg (który może
  // być czymkolwiek innym wydrukowanym na okładce).
  const isbn13 = normalized.find((d) => d.length === 13 && (d.startsWith("978") || d.startsWith("979")));
  if (isbn13) return isbn13;
  return normalized.find((d) => d.length === 10) ?? null;
}

const AUTHOR_LINE_REGEX = /^\p{Lu}[\p{L}.'-]+(?:\s+\p{Lu}[\p{L}.'-]+){1,3}$/u;
const NOISE_SUBSTRINGS = ["isbn", "wydanie", "www.", "http", "copyright", "©", "all rights"];

function isNoiseLine(line: string): boolean {
  if (line.length < 2) return true;
  if (/^[\d\s.,-]+$/.test(line)) return true;
  const lower = line.toLowerCase();
  return NOISE_SUBSTRINGS.some((needle) => lower.includes(needle));
}

function extractTitleAndAuthor(rawText: string, isbn: string | null): { title: string | null; author: string | null; publisher: string | null } {
  const lines = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !isNoiseLine(line))
    .filter((line) => !(isbn && line.replace(/[^0-9Xx]/g, "") === isbn));

  if (lines.length === 0) return { title: null, author: null, publisher: null };

  // Tytuł: najdłuższa linia wśród pierwszych ~8 rozpoznanych — okładki
  // rzadko mają najdłuższy fragment tekstu poza tytułem, a OCR zwykle
  // czyta z grubsza od góry obrazu w dół.
  const topLines = lines.slice(0, 8);
  const titleLine = topLines.reduce((longest, line) => (line.length > longest.length ? line : longest), topLines[0]);

  const remaining = lines.filter((line) => line !== titleLine);
  const authorLine = remaining.find((line) => AUTHOR_LINE_REGEX.test(line)) ?? null;
  const publisherLine = remaining.find((line) => /wydawnictwo|publishing|press|editions|verlag/i.test(line)) ?? null;

  return { title: titleLine, author: authorLine, publisher: publisherLine };
}

export async function recognizeBookFromImage(buffer: Buffer, mimeType: string): Promise<BookRecognitionResult> {
  const provider = createLocalOcrProvider();
  const { text, confidence } = await provider.recognizeImage(buffer, mimeType);

  const isbn = extractIsbn(text);
  const { title, author, publisher } = extractTitleAndAuthor(text, isbn);

  const base: BookRecognitionResult = {
    title,
    author,
    isbn,
    publisher,
    year: null,
    confidence: confidence ?? null,
    rawTextPreview: text.slice(0, 400),
    source: "ocr",
  };

  if (!isbn) return base;

  const lookup = await lookupBookByIsbn(isbn);
  if (!lookup) return base;

  return {
    ...base,
    title: lookup.title ?? base.title,
    author: lookup.author ?? base.author,
    publisher: lookup.publisher ?? base.publisher,
    year: lookup.year,
    source: "ocr+isbn_lookup",
  };
}
