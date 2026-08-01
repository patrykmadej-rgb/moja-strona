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

export const ACTIVITY_TYPES = [
  "teoria",
  "doswiadczenie_wlasne",
  "superwizja",
  "warsztat",
  "praktyka",
  "wyklad",
  "cwiczenia",
  "seminarium",
  "inne",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  teoria: "Teoria",
  doswiadczenie_wlasne: "Doświadczenie własne",
  superwizja: "Superwizja",
  warsztat: "Warsztat",
  praktyka: "Praktyka",
  wyklad: "Wykład",
  cwiczenia: "Ćwiczenia",
  seminarium: "Seminarium",
  inne: "Inne",
};

export type SessionScheduleItem = {
  id: string;
  session_id: string;
  item_date: string;
  start_time: string | null;
  end_time: string | null;
  title: string;
  activity_type: ActivityType | null;
  trainer: string | null;
  room: string | null;
  location: string | null;
  hours: number | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export const MATERIAL_CATEGORIES = [
  "program_zjazdu",
  "prezentacje",
  "literatura",
  "zdjecia_tablicy",
  "zadania",
  "notatki_wlasne",
  "materialy_prowadzacego",
  "inne",
] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];
export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  program_zjazdu: "Program zjazdu",
  prezentacje: "Prezentacje",
  literatura: "Literatura",
  zdjecia_tablicy: "Zdjęcia tablicy",
  zadania: "Zadania",
  notatki_wlasne: "Notatki własne",
  materialy_prowadzacego: "Materiały prowadzącego",
  inne: "Inne",
};

export const MATERIAL_TYPES = ["plik", "link", "notatka"] as const;
export type MaterialType = (typeof MATERIAL_TYPES)[number];
export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  plik: "Plik",
  link: "Link",
  notatka: "Notatka",
};

export type SessionMaterial = {
  id: string;
  session_id: string;
  folder: string | null;
  name: string;
  file_type: string | null;
  storage_path: string | null;
  external_link: string | null;
  tags: string[];
  author: string | null;
  related_schedule_item_id: string | null;
  file_size: number | null;
  title: string | null;
  description: string | null;
  category: MaterialCategory | null;
  material_type: MaterialType;
  added_by: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export const DOCUMENT_TYPES = [
  "bilet",
  "rezerwacja",
  "faktura",
  "paragon",
  "potwierdzenie_platnosci",
  "harmonogram",
  "zaswiadczenie",
  "certyfikat",
  "zgoda",
  "umowa",
  "inne",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  bilet: "Bilet",
  rezerwacja: "Rezerwacja",
  faktura: "Faktura",
  paragon: "Paragon",
  potwierdzenie_platnosci: "Potwierdzenie płatności",
  harmonogram: "Harmonogram",
  zaswiadczenie: "Zaświadczenie",
  certyfikat: "Certyfikat",
  zgoda: "Zgoda",
  umowa: "Umowa",
  inne: "Inne",
};

export const RELATED_ENTITY_TYPES = [
  "travel_segment",
  "accommodation",
  "school_payment",
  "expense",
  "schedule_item",
  "session",
  "other",
] as const;
export type RelatedEntityType = (typeof RELATED_ENTITY_TYPES)[number];
export const RELATED_ENTITY_TYPE_LABELS: Record<RelatedEntityType, string> = {
  travel_segment: "Odcinek podróży",
  accommodation: "Zakwaterowanie",
  school_payment: "Płatność za szkołę",
  expense: "Wydatek",
  schedule_item: "Punkt planu zajęć",
  session: "Zjazd",
  other: "Inne",
};

export type SessionDocument = {
  id: string;
  session_id: string;
  name: string;
  doc_type: DocumentType;
  document_date: string | null;
  travel_segment_id: string | null;
  accommodation_id: string | null;
  payment_id: string | null;
  storage_path: string | null;
  file_size: number | null;
  notes: string | null;
  title: string | null;
  mime_type: string | null;
  related_entity_type: RelatedEntityType | null;
  related_entity_id: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

export const TRAINING_HOUR_CATEGORIES = [
  "teoria",
  "doswiadczenie_wlasne",
  "superwizja",
  "praktyka_kliniczna",
  "warsztat",
  "terapia_wlasna",
  "inne",
] as const;
export type TrainingHourCategory = (typeof TRAINING_HOUR_CATEGORIES)[number];
export const TRAINING_HOUR_CATEGORY_LABELS: Record<TrainingHourCategory, string> = {
  teoria: "Teoria",
  doswiadczenie_wlasne: "Doświadczenie własne",
  superwizja: "Superwizja",
  praktyka_kliniczna: "Praktyka kliniczna",
  warsztat: "Warsztat",
  terapia_wlasna: "Terapia własna",
  inne: "Inne",
};

export type TrainingHoursEntry = {
  id: string;
  session_id: string | null;
  category: TrainingHourCategory;
  hours: number;
  entry_date: string | null;
  attended: boolean;
  trainer: string | null;
  certificate_document_id: string | null;
  schedule_item_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const ACTIVITY_TO_HOUR_CATEGORY: Partial<Record<ActivityType, TrainingHourCategory>> = {
  teoria: "teoria",
  doswiadczenie_wlasne: "doswiadczenie_wlasne",
  superwizja: "superwizja",
  warsztat: "warsztat",
  praktyka: "praktyka_kliniczna",
};

export type TrainingHourRequirement = {
  id: string;
  category: TrainingHourCategory;
  required_hours: number;
  label: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
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
