export const SESSION_STATUSES = [
  "do_zaplanowania",
  "planowanie",
  "wymaga_dzialania",
  "czesciowo_przygotowany",
  "kompletny",
  "zakonczony",
  "anulowany",
] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  do_zaplanowania: "Do zaplanowania",
  planowanie: "Planowanie",
  wymaga_dzialania: "Wymaga działania",
  czesciowo_przygotowany: "Częściowo przygotowany",
  kompletny: "Kompletny",
  zakonczony: "Zakończony",
  anulowany: "Anulowany",
};

export type SchoolSession = {
  id: string;
  session_number: number | null;
  title: string;
  topic: string | null;
  city: string | null;
  venue: string | null;
  start_date: string;
  end_date: string | null;
  lead_trainer: string | null;
  status: SessionStatus;
  training_year: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const TASK_PRIORITIES = ["niski", "normalny", "wysoki"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  niski: "Niski",
  normalny: "Normalny",
  wysoki: "Wysoki",
};

export type SessionTask = {
  id: string;
  session_id: string;
  title: string;
  is_done: boolean;
  due_date: string | null;
  priority: TaskPriority;
  reminder_date: string | null;
  sort_order: number;
  created_at: string;
};

export const DEFAULT_SESSION_CHECKLIST: string[] = [
  "Rejestracja na zjazd",
  "Bilet w jedną stronę",
  "Bilet powrotny",
  "Zakwaterowanie",
  "Opłata za zjazd",
  "Transport z lotniska lub dworca",
  "Transport powrotny",
  "Urlop w pracy",
  "Ubezpieczenie podróży",
  "Materiały i przygotowanie",
  "Odprawa lotnicza",
  "Dokumenty podróżne",
];
