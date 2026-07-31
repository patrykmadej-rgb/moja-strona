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
  planned_budget: number | null;
  planned_budget_currency: Currency | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const CURRENCIES = ["PLN", "DKK", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const SEGMENT_TYPES = [
  "samolot",
  "pociag",
  "autobus",
  "samochod",
  "taxi",
  "komunikacja_miejska",
  "pieszo",
  "inne",
] as const;
export type SegmentType = (typeof SEGMENT_TYPES)[number];
export const SEGMENT_TYPE_LABELS: Record<SegmentType, string> = {
  samolot: "Samolot",
  pociag: "Pociąg",
  autobus: "Autobus",
  samochod: "Samochód",
  taxi: "Taxi",
  komunikacja_miejska: "Komunikacja miejska",
  pieszo: "Pieszo",
  inne: "Inne",
};

export const SEGMENT_DIRECTIONS = ["tam", "powrot"] as const;
export type SegmentDirection = (typeof SEGMENT_DIRECTIONS)[number];
export const SEGMENT_DIRECTION_LABELS: Record<SegmentDirection, string> = {
  tam: "Tam",
  powrot: "Powrót",
};

export const SEGMENT_STATUSES = [
  "do_zakupu",
  "zarezerwowane",
  "oplacone",
  "odprawione",
  "wykorzystane",
  "anulowane",
  "do_zwrotu",
] as const;
export type SegmentStatus = (typeof SEGMENT_STATUSES)[number];
export const SEGMENT_STATUS_LABELS: Record<SegmentStatus, string> = {
  do_zakupu: "Do zakupu",
  zarezerwowane: "Zarezerwowane",
  oplacone: "Opłacone",
  odprawione: "Odprawione",
  wykorzystane: "Wykorzystane",
  anulowane: "Anulowane",
  do_zwrotu: "Do zwrotu",
};

export type TravelItinerary = {
  id: string;
  session_id: string;
  notes: string | null;
  created_at: string;
};

export type TravelSegment = {
  id: string;
  itinerary_id: string;
  segment_type: SegmentType;
  direction: SegmentDirection | null;
  departure_date: string | null;
  departure_time: string | null;
  arrival_date: string | null;
  arrival_time: string | null;
  departure_place: string | null;
  arrival_place: string | null;
  carrier: string | null;
  transport_number: string | null;
  reservation_number: string | null;
  seat: string | null;
  baggage: string | null;
  price: number | null;
  currency: Currency | null;
  status: SegmentStatus;
  link: string | null;
  sort_order: number;
  created_at: string;
};

export const ACCOMMODATION_STATUSES = [
  "do_znalezienia",
  "zarezerwowane",
  "oplacone",
  "wykorzystane",
  "anulowane",
  "oczekuje_na_zwrot",
] as const;
export type AccommodationStatus = (typeof ACCOMMODATION_STATUSES)[number];
export const ACCOMMODATION_STATUS_LABELS: Record<AccommodationStatus, string> = {
  do_znalezienia: "Do znalezienia",
  zarezerwowane: "Zarezerwowane",
  oplacone: "Opłacone",
  wykorzystane: "Wykorzystane",
  anulowane: "Anulowane",
  oczekuje_na_zwrot: "Oczekuje na zwrot",
};

export type Accommodation = {
  id: string;
  session_id: string;
  name: string;
  address: string | null;
  check_in: string | null;
  check_out: string | null;
  price: number | null;
  currency: Currency | null;
  payment_status: AccommodationStatus;
  reservation_number: string | null;
  cancellation_policy: string | null;
  free_cancellation_until: string | null;
  breakfast_included: boolean;
  distance_to_venue: string | null;
  travel_time_to_venue: string | null;
  link: string | null;
  created_at: string;
};

export const PAYMENT_CATEGORIES = [
  "oplata_za_zjazd",
  "rata",
  "superwizja",
  "terapia_wlasna",
  "dodatkowy_warsztat",
  "materialy",
  "inne",
] as const;
export type PaymentCategory = (typeof PAYMENT_CATEGORIES)[number];
export const PAYMENT_CATEGORY_LABELS: Record<PaymentCategory, string> = {
  oplata_za_zjazd: "Opłata za zjazd",
  rata: "Rata",
  superwizja: "Superwizja",
  terapia_wlasna: "Terapia własna",
  dodatkowy_warsztat: "Dodatkowy warsztat",
  materialy: "Materiały",
  inne: "Inne",
};

export const PAYMENT_STATUSES = ["do_zaplaty", "oplacone", "po_terminie", "anulowane"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  do_zaplaty: "Do zapłaty",
  oplacone: "Opłacone",
  po_terminie: "Po terminie",
  anulowane: "Anulowane",
};

export type SchoolPayment = {
  id: string;
  session_id: string | null;
  category: PaymentCategory;
  amount: number;
  currency: Currency | null;
  due_date: string | null;
  paid_date: string | null;
  status: PaymentStatus;
  payment_method: string | null;
  document_number: string | null;
  notes: string | null;
  created_at: string;
};

export const EXPENSE_CATEGORIES = [
  "lot",
  "pociag",
  "nocleg",
  "taxi",
  "parking",
  "jedzenie",
  "bagaz",
  "inne",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  lot: "Lot",
  pociag: "Pociąg",
  nocleg: "Nocleg",
  taxi: "Taxi",
  parking: "Parking",
  jedzenie: "Jedzenie",
  bagaz: "Bagaż",
  inne: "Inne",
};

export const EXPENSE_STATUSES = ["zaplanowany", "oplacony", "do_zwrotu", "zwrocony"] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];
export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  zaplanowany: "Zaplanowany",
  oplacony: "Opłacony",
  do_zwrotu: "Do zwrotu",
  zwrocony: "Zwrócony",
};

export type Expense = {
  id: string;
  session_id: string | null;
  name: string;
  category: ExpenseCategory;
  amount: number;
  currency: Currency | null;
  expense_date: string | null;
  status: ExpenseStatus;
  payment_method: string | null;
  document_number: string | null;
  has_invoice: boolean;
  notes: string | null;
  created_at: string;
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
