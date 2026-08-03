// Kolejność ma znaczenie — to porządek pokazywany w dropdownach (nie sortować alfabetycznie).
export const ARTICLE_STATUSES = [
  "idea",
  "first_version",
  "revisions",
  "final_version",
  "ready_to_submit",
  "submitted",
  "post_review_revisions",
  "in_publication",
  "published",
] as const;

export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  idea: "Pomysł",
  first_version: "Wygenerowana pierwsza wersja",
  revisions: "Poprawki",
  final_version: "Wersja ostateczna",
  ready_to_submit: "Do wysłania",
  submitted: "Wysłane",
  post_review_revisions: "Poprawki po recenzji",
  in_publication: "W publikacji",
  published: "Opublikowano",
};

// Priorytet jest NIEZALEŻNY od statusu (ARTICLE_STATUSES powyżej) — służy
// wyłącznie do porządkowania kolejności pracy, nie do śledzenia postępu.
// Kolejność w tej tablicy to kolejność w dropdownach/formularzach (nie
// sortować alfabetycznie) — kolejność SORTOWANIA listy artykułów jest inna,
// patrz ARTICLE_PRIORITY_SORT_ORDER.
export const ARTICLE_PRIORITIES = ["top", "medium", "low", "on_hold"] as const;
export type ArticlePriorityValue = (typeof ARTICLE_PRIORITIES)[number];
export type ArticlePriority = ArticlePriorityValue | null;

export const ARTICLE_PRIORITY_LABELS: Record<ArticlePriorityValue, string> = {
  top: "Top Priority",
  medium: "Medium Priority",
  low: "Low Priority",
  on_hold: "On hold",
};

export const NO_PRIORITY_LABEL = "Bez priorytetu";

/**
 * Kolejność sortowania listy po priorytecie (nie kolejność w dropdownach —
 * ta jest w ARTICLE_PRIORITIES powyżej). "Bez priorytetu" ląduje przed
 * "On hold": artykuły wstrzymane są świadomie odłożone, więc trafiają na
 * sam koniec, za artykułami bez ustalonego priorytetu.
 */
export const ARTICLE_PRIORITY_SORT_ORDER: ArticlePriority[] = ["top", "medium", "low", null, "on_hold"];

export const LANGUAGES = ["pl", "en"] as const;
export type LanguageCode = (typeof LANGUAGES)[number];
export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  pl: "Polski",
  en: "Angielski",
};

export const DISCIPLINES = ["political_science", "security_studies", "psychology", "legal_science"] as const;
export type Discipline = (typeof DISCIPLINES)[number];
export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  political_science: "Nauki o polityce",
  security_studies: "Nauki o bezpieczeństwie",
  psychology: "Nauki psychologiczne",
  legal_science: "Nauki prawne",
};

export type Article = {
  id: string;
  title: string;
  language_code: LanguageCode | null;
  target_journal: string | null;
  disciplines: Discipline[];
  keywords: string[];
  abstract: string | null;
  status: ArticleStatus;
  priority: ArticlePriority;
  progress_percent: number;
  deadline: string | null;
  is_private: boolean;
  chatgpt_link: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ArticleVersion = {
  id: string;
  article_id: string;
  version_number: number;
  file_path: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  notes: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
};

export type LatestArticleVersion = {
  version_number: number;
  file_path: string | null;
  file_name: string | null;
  signed_url: string | null;
};

export const READING_STATUSES = [
  "do_przeczytania",
  "w_trakcie",
  "przeczytane",
] as const;

export type ReadingStatus = (typeof READING_STATUSES)[number];

export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  do_przeczytania: "Do przeczytania",
  w_trakcie: "W trakcie",
  przeczytane: "Przeczytane",
};

export type ArticleSource = {
  id: string;
  article_id: string;
  author: string | null;
  title: string | null;
  year: number | null;
  publisher_or_journal: string | null;
  doi: string | null;
  url: string | null;
  source_type: string | null;
  reading_status: ReadingStatus;
  notes: string | null;
  created_at: string;
};

export const EVENT_TYPES = [
  "milestone",
  "deadline",
  "spotkanie",
  "przypomnienie",
  "inne",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  milestone: "Kamień milowy",
  deadline: "Deadline",
  spotkanie: "Spotkanie",
  przypomnienie: "Przypomnienie",
  inne: "Inne",
};

export const EVENT_TITLE_SUGGESTIONS = [
  "Rozpoczęcie pracy",
  "Zakończenie konspektu",
  "Pierwsza wersja",
  "Wysłanie do redakcji",
  "Otrzymana recenzja",
  "Złożone poprawki",
  "Przyjęcie",
  "Publikacja",
];

export type ArticleEvent = {
  id: string;
  article_id: string;
  title: string;
  event_type: EventType;
  event_date: string;
  is_completed: boolean;
  notes: string | null;
  created_at: string;
};

export type ArticleNote = {
  id: string;
  article_id: string;
  content: string;
  is_pinned: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
