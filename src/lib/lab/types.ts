export const ARTICLE_STATUSES = [
  "pomysl",
  "pisanie",
  "do_wyslania",
  "w_redakcji",
  "recenzja",
  "poprawki",
  "przyjety",
  "opublikowany",
] as const;

export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  pomysl: "Pomysł",
  pisanie: "Piszę",
  do_wyslania: "Do wysłania",
  w_redakcji: "W redakcji",
  recenzja: "Recenzja",
  poprawki: "Poprawki",
  przyjety: "Przyjęty",
  opublikowany: "Opublikowany",
};

export type Article = {
  id: string;
  title: string;
  language: string | null;
  target_journal: string | null;
  discipline: string | null;
  keywords: string[];
  abstract: string | null;
  status: ArticleStatus;
  progress_percent: number;
  next_step: string | null;
  deadline: string | null;
  is_private: boolean;
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
