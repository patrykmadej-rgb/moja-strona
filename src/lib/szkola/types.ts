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
  /** Czy ten zjazd powstał automatycznie z grupowania weekendów kalendarza (patrz calendarWeekendAutomation.ts). */
  created_from_calendar: boolean;
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

export type ScheduleItemSource = "manual" | "google_calendar";

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
  source: ScheduleItemSource;
  google_event_id: string | null;
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

// ---------------------------------------------------------------------------
// ETAP 4 — integracja z Google Calendar.
// Uwaga: school_calendar_connections zawiera zaszyfrowane tokeny OAuth i
// NIE ma odpowiednika typu tutaj celowo — ten plik jest importowany także
// przez komponenty klienckie, a tokeny nigdy nie powinny nawet przejść
// przez typ używany po stronie przeglądarki. Server-only kod (routes/
// server actions) używa własnego, węższego typu wewnątrz googleCalendar.ts.
// ---------------------------------------------------------------------------

export type CalendarSyncFrequency = "weekly" | "manual";
export const CALENDAR_CONNECTION_TYPES = ["ics_url", "google_oauth"] as const;
export type CalendarConnectionType = (typeof CALENDAR_CONNECTION_TYPES)[number];

/**
 * Bezpieczny (bez tokenów/URL-i) widok połączenia kalendarza dla UI.
 * Celowo BEZ encrypted_ics_url/etag/last_modified/access_token_encrypted/
 * refresh_token_encrypted/sync_token — to pola serwerowe, nigdy nie
 * powinny trafić do komponentu klienckiego, nawet w postaci zaszyfrowanej.
 */
export type CalendarConnectionSummary = {
  id: string;
  connection_type: CalendarConnectionType;
  calendar_id: string | null;
  calendar_name: string | null;
  calendar_color: string | null;
  masked_ics_url: string | null;
  sync_enabled: boolean;
  sync_frequency: CalendarSyncFrequency;
  last_synced_at: string | null;
  next_sync_at: string | null;
  last_successful_fetch_at: string | null;
  last_http_status: number | null;
  last_error: string | null;
  created_at: string;
};

export const CALENDAR_SYNC_TYPES = ["manual", "scheduled", "initial"] as const;
export type CalendarSyncType = (typeof CALENDAR_SYNC_TYPES)[number];

export type SchoolCalendarSyncRun = {
  id: string;
  user_id: string;
  connection_id: string | null;
  started_at: string;
  completed_at: string | null;
  status: "running" | "success" | "error";
  events_received: number;
  events_created: number;
  events_updated: number;
  events_deleted: number;
  error_message: string | null;
  sync_type: CalendarSyncType;
  created_at: string;
};

/**
 * Znormalizowany kształt wydarzenia kalendarza, wspólny dla obu źródeł
 * (Google Calendar API i sparsowany feed ICS) — `google_event_id` i
 * `google_updated_at` to nazwy z czasów, gdy istniało tylko OAuth; teraz
 * służą jako generyczny "identyfikator wydarzenia u źródła" (dla ICS: UID,
 * a dla wystąpień cyklicznych UID+data/RECURRENCE-ID) i "znacznik czasu
 * ostatniej aktualizacji u źródła" niezależnie od pochodzenia. Nie
 * zmieniamy nazw, żeby uniknąć duplikowania kolumn o tym samym znaczeniu
 * (patrz decyzje nazewnicze w migracjach 007/009/010).
 */
export type NormalizedCalendarEvent = {
  google_event_id: string;
  ical_uid: string | null;
  title: string | null;
  description: string | null;
  location: string | null;
  start_at: string | null;
  end_at: string | null;
  all_day: boolean;
  timezone: string | null;
  status: string | null;
  organizer_email: string | null;
  attendees: { email?: string; responseStatus?: string }[] | null;
  attachments: { title?: string; fileUrl?: string; mimeType?: string }[] | null;
  recurrence: string[] | null;
  recurring_event_id: string | null;
  original_start_time: string | null;
  google_updated_at: string | null;
  html_link: string | null;
  raw_hash: string;
};

export type SchoolCalendarEvent = {
  id: string;
  user_id: string;
  google_event_id: string;
  ical_uid: string | null;
  calendar_id: string | null;
  session_id: string | null;
  ignored: boolean;
  title: string | null;
  description: string | null;
  location: string | null;
  start_at: string | null;
  end_at: string | null;
  all_day: boolean;
  timezone: string | null;
  status: string | null;
  organizer_email: string | null;
  attendees: unknown | null;
  attachments: unknown | null;
  recurrence: string[] | null;
  recurring_event_id: string | null;
  original_start_time: string | null;
  google_updated_at: string | null;
  raw_hash: string | null;
  html_link: string | null;
  first_seen_at: string;
  last_seen_at: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export const CALENDAR_CHANGE_TYPES = ["created", "updated", "deleted", "moved", "cancelled"] as const;
export type CalendarChangeType = (typeof CALENDAR_CHANGE_TYPES)[number];
export const CALENDAR_CHANGE_TYPE_LABELS: Record<CalendarChangeType, string> = {
  created: "Nowe wydarzenie",
  updated: "Zmiana",
  deleted: "Wydarzenie usunięte",
  moved: "Przeniesiono termin",
  cancelled: "Zjazd anulowany",
};

export const CALENDAR_CHANGE_STATUSES = ["new", "reviewed", "accepted", "ignored"] as const;
export type CalendarChangeStatus = (typeof CALENDAR_CHANGE_STATUSES)[number];
export const CALENDAR_CHANGE_STATUS_LABELS: Record<CalendarChangeStatus, string> = {
  new: "Nowa",
  reviewed: "Przejrzana",
  accepted: "Zaakceptowana",
  ignored: "Zignorowana",
};

export const CALENDAR_IMPACT_LEVELS = ["none", "information", "warning", "conflict"] as const;
export type CalendarImpactLevel = (typeof CALENDAR_IMPACT_LEVELS)[number];
export const CALENDAR_IMPACT_LEVEL_LABELS: Record<CalendarImpactLevel, string> = {
  none: "Brak wpływu",
  information: "Informacja",
  warning: "Ostrzeżenie",
  conflict: "Konflikt",
};

export const CALENDAR_CHANGE_FIELD_LABELS: Record<string, string> = {
  title: "Tytuł",
  description: "Opis",
  location: "Lokalizacja",
  start_at: "Data/godzina rozpoczęcia",
  end_at: "Data/godzina zakończenia",
  timezone: "Strefa czasowa",
  status: "Status",
  organizer_email: "Organizator",
  attachments: "Załączniki",
  recurrence: "Cykliczność",
};

export type SchoolCalendarChange = {
  id: string;
  user_id: string;
  calendar_event_id: string | null;
  session_id: string | null;
  sync_run_id: string | null;
  change_type: CalendarChangeType;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  detected_at: string;
  reviewed_at: string | null;
  status: CalendarChangeStatus;
  impact_level: CalendarImpactLevel;
  impact_summary: string | null;
  created_at: string;
};

export type SchoolCalendarSettings = {
  id: string;
  user_id: string;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  flight_buffer_minutes: number;
  train_buffer_minutes: number;
  default_timezone: string;
  /**
   * Tryb automatyczny grupowania weekendów (sekcja 10 specyfikacji ETAP 6):
   * gdy włączone, nowy weekend z >=2 wydarzeniami i bez dwuznaczności może
   * automatycznie utworzyć/dopasować zjazd podczas synchronizacji, bez
   * czekania na ręczne kliknięcie. Domyślnie wyłączone — włącza się samo
   * dopiero po pierwszym ręcznie zatwierdzonym imporcie wsadowym.
   */
  auto_create_sessions: boolean;
  created_at: string;
  updated_at: string;
};

export const DEFAULT_CALENDAR_SETTINGS: Omit<SchoolCalendarSettings, "id" | "user_id" | "created_at" | "updated_at"> = {
  buffer_before_minutes: 60,
  buffer_after_minutes: 60,
  flight_buffer_minutes: 120,
  train_buffer_minutes: 30,
  default_timezone: "Europe/Warsaw",
  auto_create_sessions: false,
};

// ---------------------------------------------------------------------------
// ETAP 5 — skrzynka importu rezerwacji/dokumentów, centrum alertów, automatyzacje.
// ---------------------------------------------------------------------------

export const IMPORT_STATUSES = [
  "new",
  "processing",
  "recognized",
  "needs_review",
  "ready",
  "assigned",
  "rejected",
  "error",
] as const;
export type ImportStatus = (typeof IMPORT_STATUSES)[number];
export const IMPORT_STATUS_LABELS: Record<ImportStatus, string> = {
  new: "Nowe",
  processing: "Przetwarzanie",
  recognized: "Rozpoznane",
  needs_review: "Wymaga sprawdzenia",
  ready: "Gotowe do zatwierdzenia",
  assigned: "Przypisane",
  rejected: "Odrzucone",
  error: "Błąd",
};

export const IMPORT_SOURCE_TYPES = ["upload", "pasted_email", "eml", "inbound_email", "manual"] as const;
export type ImportSourceType = (typeof IMPORT_SOURCE_TYPES)[number];
export const IMPORT_SOURCE_TYPE_LABELS: Record<ImportSourceType, string> = {
  upload: "Przesłany plik",
  pasted_email: "Wklejona wiadomość",
  eml: "Plik EML",
  inbound_email: "Przekazany e-mail",
  manual: "Ręczne",
};

/**
 * Wspólne słownictwo dla wykrytego typu dokumentu (import_inbox_items.detected_type)
 * i typu rezerwacji (imported_reservations.reservation_type) — to ten sam koncept
 * w dwóch miejscach cyklu życia jednego importu, patrz migracja 011.
 */
export const IMPORT_DETECTED_TYPES = [
  "flight",
  "train",
  "bus",
  "hotel",
  "school_payment",
  "invoice",
  "receipt",
  "school_information",
  "schedule",
  "certificate",
  "other",
] as const;
export type ImportDetectedType = (typeof IMPORT_DETECTED_TYPES)[number];
export const IMPORT_DETECTED_TYPE_LABELS: Record<ImportDetectedType, string> = {
  flight: "Lot",
  train: "Pociąg",
  bus: "Autobus",
  hotel: "Hotel",
  school_payment: "Płatność za szkołę",
  invoice: "Faktura",
  receipt: "Paragon",
  school_information: "Wiadomość organizacyjna",
  schedule: "Harmonogram",
  certificate: "Certyfikat",
  other: "Inne",
};

export type ImportInboxItem = {
  id: string;
  user_id: string | null;
  source: ImportSourceType;
  original_filename: string | null;
  storage_path: string | null;
  raw_email_subject: string | null;
  raw_email_from: string | null;
  sender_name: string | null;
  raw_text: string | null;
  mime_type: string | null;
  file_size: number | null;
  file_hash: string | null;
  received_at: string;
  status: ImportStatus;
  detected_type: ImportDetectedType | null;
  confidence_score: number | null;
  proposed_session_id: string | null;
  processing_error: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Luźno otypowane pola wyciągnięte z dokumentu — różny podzbiór jest
 * wypełniony w zależności od detected_type. Przechowywane jako jsonb
 * w imported_reservations.parsed_data (patrz decyzja nazewnicza w
 * migracji 011: parsed_data pełni rolę "extracted_data").
 */
export type ImportExtractedData = {
  carrier?: string;
  transport_number?: string;
  origin?: string;
  destination?: string;
  date?: string;
  time?: string;
  seat?: string;
  baggage?: string;
  hotel_name?: string;
  address?: string;
  nights?: number;
  breakfast_included?: boolean;
  free_cancellation_until?: string;
  payment_type?: string;
  recipient?: string;
  payment_title?: string;
  document_number?: string;
  location?: string;
  trainer?: string;
  room?: string;
  tasks?: string[];
  passenger_name?: string;
};

export type ImportedReservation = {
  id: string;
  user_id: string | null;
  inbox_item_id: string | null;
  session_id: string | null;
  reservation_type: ImportDetectedType;
  provider: string | null;
  booking_reference: string | null;
  origin: string | null;
  destination: string | null;
  start_at: string | null;
  end_at: string | null;
  check_in: string | null;
  check_out: string | null;
  amount: number | null;
  currency: Currency | null;
  payment_status: string | null;
  passenger_name: string | null;
  baggage: string | null;
  seat: string | null;
  cancellation_deadline: string | null;
  parsed_data: ImportExtractedData;
  confidence_score: number | null;
  status: ImportStatus;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export const ALERT_CATEGORIES = [
  "podroz",
  "zakwaterowanie",
  "platnosc",
  "kalendarz",
  "materialy",
  "dokumenty",
  "godziny",
  "import",
] as const;
export type AlertCategory = (typeof ALERT_CATEGORIES)[number];
export const ALERT_CATEGORY_LABELS: Record<AlertCategory, string> = {
  podroz: "Podróż",
  zakwaterowanie: "Zakwaterowanie",
  platnosc: "Płatność",
  kalendarz: "Kalendarz",
  materialy: "Materiały",
  dokumenty: "Dokumenty",
  godziny: "Godziny",
  import: "Import",
};

export const ALERT_PRIORITIES = ["informacja", "uwaga", "pilne"] as const;
export type AlertPriority = (typeof ALERT_PRIORITIES)[number];
export const ALERT_PRIORITY_LABELS: Record<AlertPriority, string> = {
  informacja: "Informacja",
  uwaga: "Uwaga",
  pilne: "Pilne",
};

export const ALERT_STATUSES = ["new", "seen", "resolved", "ignored"] as const;
export type AlertStatus = (typeof ALERT_STATUSES)[number];
export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  new: "Nowy",
  seen: "Zobaczony",
  resolved: "Rozwiązany",
  ignored: "Zignorowany",
};

export type SchoolAlert = {
  id: string;
  user_id: string;
  category: AlertCategory;
  priority: AlertPriority;
  title: string;
  description: string | null;
  session_id: string | null;
  source: string | null;
  source_id: string | null;
  action_label: string | null;
  action_href: string | null;
  status: AlertStatus;
  dedupe_key: string | null;
  detected_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SchoolAutomationRun = {
  id: string;
  user_id: string;
  task_type: "daily_checks";
  started_at: string;
  completed_at: string | null;
  status: "running" | "success" | "partial" | "failed";
  records_processed: number;
  alerts_created: number;
  error_message: string | null;
  created_at: string;
};
