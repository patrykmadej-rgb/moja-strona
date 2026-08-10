// Kolejność ma znaczenie — to porządek pokazywany w dropdownach (nie sortować
// alfabetycznie), zgodnie z konwencją ARTICLE_STATUSES w lib/lab/types.ts.
export const CLIPBOARD_CATEGORIES = [
  "Biogram",
  "Dane osobowe",
  "Publikacje",
  "Afiliacja",
  "Kontakt",
  "Szablony wiadomości",
  "Inne",
] as const;

export type ClipboardCategory = (typeof CLIPBOARD_CATEGORIES)[number];

export const NO_CATEGORY_LABEL = "Bez kategorii";

export const CLIPBOARD_LANGUAGES = ["PL", "EN", "IT", "Inny"] as const;

export type ClipboardLanguage = (typeof CLIPBOARD_LANGUAGES)[number];

export const NO_LANGUAGE_LABEL = "Bez oznaczenia";

// Kategoria/język zapisywane jako wolny tekst (patrz migracja 021) — te typy
// dopuszczają też wartości spoza aktualnej listy (np. usuniętej w przyszłości
// kategorii z istniejących wpisów), żeby stare dane nadal się renderowały.
export type ClipboardItem = {
  id: string;
  user_id: string;
  title: string;
  category: string | null;
  language: string | null;
  content: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
