// Kolejność ma znaczenie — porządek pokazywany w dropdownach/wyborach (nie
// sortować alfabetycznie), zgodnie z konwencją ARTICLE_STATUSES w
// lib/lab/types.ts i CLIPBOARD_CATEGORIES w lib/lab/clipboard-types.ts.

export const OWNERSHIP_STATUSES = ["owned", "wishlist"] as const;
export type OwnershipStatus = (typeof OWNERSHIP_STATUSES)[number];

export const OWNERSHIP_STATUS_LABELS: Record<OwnershipStatus, string> = {
  owned: "Posiadana",
  wishlist: "Chcę kupić",
};

export const READING_STATUSES = ["unread", "reading", "read"] as const;
export type ReadingStatus = (typeof READING_STATUSES)[number];

export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  unread: "Do przeczytania",
  reading: "W trakcie czytania",
  read: "Przeczytana",
};

/** Status pokazywany zamiast statusu czytania, gdy książka ma aktywne wypożyczenie — wyłącznie prezentacyjne, nie zapisywane w bazie (patrz LibraryBookCard.tsx). */
export const LOANED_STATUS_LABEL = "Wypożyczona";
export const LOANED_STATUS_COLORS = { bg: "#fdf1de", text: "#8a5a12" };

// Kolory w stylu STATUS_COLORS z components/lab/StatusTag.tsx (ta sama
// paleta: fiolety/złoto/zielenie panelu /lab).
export const OWNERSHIP_STATUS_COLORS: Record<OwnershipStatus, { bg: string; text: string }> = {
  owned: { bg: "#eef6e9", text: "#3d6b2f" },
  wishlist: { bg: "#fff2d9", text: "#a76616" },
};

export const READING_STATUS_COLORS: Record<ReadingStatus, { bg: string; text: string }> = {
  unread: { bg: "#f1eef2", text: "#5c5460" },
  reading: { bg: "#eef2fd", text: "#4551b5" },
  read: { bg: "#e5f6eb", text: "#2f7a4c" },
};

// Kategoria zapisywana jako wolny tekst (patrz migracja 022) — ta lista to
// tylko podpowiedzi w polu formularza (datalist), nie ograniczenie CHECK w
// bazie, żeby dodanie nowego obszaru terapeutycznego nie wymagało migracji.
export const LIBRARY_CATEGORIES = [
  "Psychoterapia psychodynamiczna",
  "Psychoterapia systemowa",
  "Psychoterapia poznawczo-behawioralna",
  "Psychoterapia humanistyczno-egzystencjalna",
  "Trauma",
  "Psychoza",
  "Zaburzenia osobowości",
  "Diagnoza i psychopatologia",
  "Teoria i historia psychoterapii",
  "Inne",
] as const;

export const NO_CATEGORY_LABEL = "Bez kategorii";

// Tak samo jak kategoria — wolny tekst z podpowiedziami, nie enum w bazie.
export const LIBRARY_LANGUAGES = ["PL", "EN", "DE", "Inny"] as const;

export const NO_LANGUAGE_LABEL = "Bez oznaczenia";

export type LibraryBook = {
  id: string;
  user_id: string;
  title: string;
  author: string;
  ownership_status: OwnershipStatus;
  reading_status: ReadingStatus;
  category: string | null;
  language: string | null;
  year: number | null;
  isbn: string | null;
  publisher: string | null;
  notes: string | null;
  /** Migracja 023 — miniatura z Google Books (wymuszone HTTPS) albo ręczny wybór. */
  cover_url: string | null;
  created_at: string;
  updated_at: string;
};

export type LibraryLoan = {
  id: string;
  book_id: string;
  borrower_name: string;
  loaned_at: string;
  returned_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

/** Książka wzbogacona o aktywne wypożyczenie (jeśli jest) i pełną historię — złożone po stronie klienta z osobno pobranych library_books/library_loans. */
export type LibraryBookWithLoans = LibraryBook & {
  activeLoan: LibraryLoan | null;
  loanHistory: LibraryLoan[];
};
