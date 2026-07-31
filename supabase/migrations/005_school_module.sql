-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
-- Nowy moduł panelu /lab: "Szkoła psychoterapii" — zjazdy, plan zajęć, podróże,
-- zakwaterowanie, płatności, koszty, materiały, dokumenty, godziny szkoleniowe,
-- synchronizacja Google Calendar, import rezerwacji z e-maila.
--
-- Migracja jest w pełni addytywna: nie zmienia i nie usuwa żadnych istniejących
-- tabel (articles, article_*, trips). Moduł "Zjazdy" pod /panel/zjazdy (tabela
-- `trips`) pozostaje nietknięty — to osobny, prostszy, wcześniejszy mechanizm;
-- ten moduł buduje nowy, bogatszy model danych pod /lab/szkola.
--
-- ETAP 1 (ten plik + kod aplikacji) używa aktywnie: school_sessions,
-- session_tasks. Pozostałe tabele są przygotowane pod kolejne etapy
-- (patrz opis w rozmowie) i na razie nie mają warstwy UI/akcji.

-- 1. Zjazd
create table if not exists public.school_sessions (
  id uuid primary key default gen_random_uuid(),
  session_number int,
  title text not null,
  topic text,
  city text,
  venue text,
  start_date date not null,
  end_date date,
  lead_trainer text,
  status text not null default 'do_zaplanowania'
    check (status in (
      'do_zaplanowania', 'planowanie', 'wymaga_dzialania',
      'czesciowo_przygotowany', 'kompletny', 'zakonczony', 'anulowany'
    )),
  training_year text,
  notes text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Plan zajęć
create table if not exists public.session_schedule_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.school_sessions (id) on delete cascade,
  item_date date not null,
  start_time time,
  end_time time,
  title text not null,
  activity_type text,
  trainer text,
  room text,
  location text,
  hours numeric(5, 2),
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 3. Podróż (kontener na odcinki)
create table if not exists public.travel_itineraries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.school_sessions (id) on delete cascade,
  notes text,
  created_at timestamptz not null default now()
);

-- 4. Odcinek podróży
create table if not exists public.travel_segments (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references public.travel_itineraries (id) on delete cascade,
  segment_type text not null default 'inne'
    check (segment_type in (
      'samolot', 'pociag', 'autobus', 'samochod', 'taxi',
      'komunikacja_miejska', 'pieszo', 'inne'
    )),
  direction text check (direction in ('tam', 'powrot')),
  departure_date date,
  departure_time time,
  arrival_date date,
  arrival_time time,
  departure_place text,
  arrival_place text,
  carrier text,
  transport_number text,
  reservation_number text,
  seat text,
  baggage text,
  price numeric(10, 2),
  currency text default 'PLN' check (currency in ('DKK', 'PLN', 'EUR')),
  status text not null default 'do_zakupu'
    check (status in (
      'do_zakupu', 'zarezerwowane', 'oplacone', 'odprawione',
      'wykorzystane', 'anulowane', 'do_zwrotu'
    )),
  link text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 5. Zakwaterowanie
create table if not exists public.accommodations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.school_sessions (id) on delete cascade,
  name text not null,
  address text,
  check_in date,
  check_out date,
  price numeric(10, 2),
  currency text default 'PLN' check (currency in ('DKK', 'PLN', 'EUR')),
  payment_status text not null default 'do_znalezienia'
    check (payment_status in (
      'do_znalezienia', 'zarezerwowane', 'oplacone',
      'wykorzystane', 'anulowane', 'oczekuje_na_zwrot'
    )),
  reservation_number text,
  cancellation_policy text,
  free_cancellation_until date,
  breakfast_included boolean not null default false,
  distance_to_venue text,
  travel_time_to_venue text,
  link text,
  created_at timestamptz not null default now()
);

-- 6. Płatności za szkołę (opłata za zjazd, rata, superwizja, ...)
create table if not exists public.school_payments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.school_sessions (id) on delete cascade,
  category text not null default 'oplata_za_zjazd'
    check (category in (
      'oplata_za_zjazd', 'rata', 'superwizja', 'terapia_wlasna',
      'dodatkowy_warsztat', 'materialy', 'inne'
    )),
  amount numeric(10, 2) not null,
  currency text default 'PLN' check (currency in ('DKK', 'PLN', 'EUR')),
  due_date date,
  paid_date date,
  status text not null default 'do_zaplaty'
    check (status in ('do_zaplaty', 'oplacone', 'po_terminie', 'anulowane')),
  payment_method text,
  document_number text,
  notes text,
  created_at timestamptz not null default now()
);

-- 7. Wydatki podróżne i inne
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.school_sessions (id) on delete cascade,
  name text not null,
  category text not null default 'inne'
    check (category in (
      'lot', 'pociag', 'nocleg', 'taxi', 'parking', 'jedzenie', 'bagaz', 'inne'
    )),
  amount numeric(10, 2) not null,
  currency text default 'PLN' check (currency in ('DKK', 'PLN', 'EUR')),
  expense_date date,
  status text not null default 'zaplanowany'
    check (status in ('zaplanowany', 'oplacony', 'do_zwrotu', 'zwrocony')),
  payment_method text,
  document_number text,
  has_invoice boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

-- 8. Checklista przygotowań do zjazdu
create table if not exists public.session_tasks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.school_sessions (id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  due_date date,
  priority text not null default 'normalny'
    check (priority in ('niski', 'normalny', 'wysoki')),
  reminder_date date,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 9. Materiały ze zjazdu (foldery: Program zjazdu, Prezentacje, Zdjęcia tablicy, ...)
create table if not exists public.session_materials (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.school_sessions (id) on delete cascade,
  folder text,
  name text not null,
  file_type text,
  storage_path text,
  external_link text,
  tags text[] not null default '{}',
  author text,
  related_schedule_item_id uuid references public.session_schedule_items (id) on delete set null,
  file_size bigint,
  created_at timestamptz not null default now()
);

-- 10. Dokumenty (bilety, rezerwacje, faktury, zaświadczenia, ...)
create table if not exists public.session_documents (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.school_sessions (id) on delete cascade,
  name text not null,
  doc_type text not null default 'inne'
    check (doc_type in (
      'bilet', 'rezerwacja', 'faktura', 'potwierdzenie_platnosci',
      'harmonogram', 'zaswiadczenie', 'zgoda', 'certyfikat', 'inne'
    )),
  document_date date,
  travel_segment_id uuid references public.travel_segments (id) on delete set null,
  accommodation_id uuid references public.accommodations (id) on delete set null,
  payment_id uuid references public.school_payments (id) on delete set null,
  storage_path text,
  file_size bigint,
  notes text,
  created_at timestamptz not null default now()
);

-- 11. Godziny szkoleniowe
create table if not exists public.training_hours_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.school_sessions (id) on delete cascade,
  category text not null default 'teoria'
    check (category in (
      'teoria', 'doswiadczenie_wlasne', 'superwizja', 'praktyka', 'warsztat', 'inne'
    )),
  hours numeric(6, 2) not null,
  attended boolean not null default true,
  trainer text,
  certificate_document_id uuid references public.session_documents (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- 12. Migawka synchronizacji Google Calendar
create table if not exists public.calendar_sync_snapshots (
  id uuid primary key default gen_random_uuid(),
  synced_at timestamptz not null default now(),
  event_count int not null default 0,
  raw_snapshot jsonb,
  triggered_by text not null default 'manual' check (triggered_by in ('manual', 'cron')),
  status text not null default 'ok' check (status in ('ok', 'error')),
  error_message text
);

-- 13. Wykryte zmiany w Google Calendar
create table if not exists public.calendar_changes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.school_sessions (id) on delete set null,
  snapshot_id uuid references public.calendar_sync_snapshots (id) on delete cascade,
  field_name text not null,
  old_value text,
  new_value text,
  detected_at timestamptz not null default now(),
  impact_note text,
  acknowledged boolean not null default false
);

-- 14. Skrzynka importu (upload PDF / e-mail jako punkt wejścia)
create table if not exists public.import_inbox_items (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'upload' check (source in ('upload', 'email')),
  original_filename text,
  storage_path text,
  raw_email_subject text,
  raw_email_from text,
  received_at timestamptz not null default now(),
  status text not null default 'nowa'
    check (status in ('nowa', 'rozpoznana', 'wymaga_sprawdzenia', 'przypisana', 'odrzucona')),
  notes text,
  created_at timestamptz not null default now()
);

-- 15. Rozpoznana rezerwacja z importu, przed zatwierdzeniem
create table if not exists public.imported_reservations (
  id uuid primary key default gen_random_uuid(),
  inbox_item_id uuid references public.import_inbox_items (id) on delete cascade,
  session_id uuid references public.school_sessions (id) on delete set null,
  reservation_type text not null default 'inne'
    check (reservation_type in ('lot', 'hotel', 'pociag', 'faktura', 'platnosc', 'inne')),
  parsed_data jsonb not null default '{}',
  status text not null default 'nowa'
    check (status in ('nowa', 'rozpoznana', 'wymaga_sprawdzenia', 'przypisana', 'odrzucona')),
  created_at timestamptz not null default now()
);

-- Row Level Security — ten sam wzorzec co reszta /lab: panel jednoosobowy,
-- każdy zalogowany (auth.role() = 'authenticated') ma pełny dostęp.
-- DO ROZBUDOWY: gdy dojdą kolejni użytkownicy, zawęzić do auth.uid() = created_by.

alter table public.school_sessions enable row level security;
alter table public.session_schedule_items enable row level security;
alter table public.travel_itineraries enable row level security;
alter table public.travel_segments enable row level security;
alter table public.accommodations enable row level security;
alter table public.school_payments enable row level security;
alter table public.expenses enable row level security;
alter table public.session_tasks enable row level security;
alter table public.session_materials enable row level security;
alter table public.session_documents enable row level security;
alter table public.training_hours_entries enable row level security;
alter table public.calendar_sync_snapshots enable row level security;
alter table public.calendar_changes enable row level security;
alter table public.import_inbox_items enable row level security;
alter table public.imported_reservations enable row level security;

drop policy if exists "school_sessions_all_authenticated" on public.school_sessions;
create policy "school_sessions_all_authenticated" on public.school_sessions for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "session_schedule_items_all_authenticated" on public.session_schedule_items;
create policy "session_schedule_items_all_authenticated" on public.session_schedule_items for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "travel_itineraries_all_authenticated" on public.travel_itineraries;
create policy "travel_itineraries_all_authenticated" on public.travel_itineraries for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "travel_segments_all_authenticated" on public.travel_segments;
create policy "travel_segments_all_authenticated" on public.travel_segments for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "accommodations_all_authenticated" on public.accommodations;
create policy "accommodations_all_authenticated" on public.accommodations for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "school_payments_all_authenticated" on public.school_payments;
create policy "school_payments_all_authenticated" on public.school_payments for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "expenses_all_authenticated" on public.expenses;
create policy "expenses_all_authenticated" on public.expenses for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "session_tasks_all_authenticated" on public.session_tasks;
create policy "session_tasks_all_authenticated" on public.session_tasks for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "session_materials_all_authenticated" on public.session_materials;
create policy "session_materials_all_authenticated" on public.session_materials for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "session_documents_all_authenticated" on public.session_documents;
create policy "session_documents_all_authenticated" on public.session_documents for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "training_hours_entries_all_authenticated" on public.training_hours_entries;
create policy "training_hours_entries_all_authenticated" on public.training_hours_entries for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "calendar_sync_snapshots_all_authenticated" on public.calendar_sync_snapshots;
create policy "calendar_sync_snapshots_all_authenticated" on public.calendar_sync_snapshots for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "calendar_changes_all_authenticated" on public.calendar_changes;
create policy "calendar_changes_all_authenticated" on public.calendar_changes for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "import_inbox_items_all_authenticated" on public.import_inbox_items;
create policy "import_inbox_items_all_authenticated" on public.import_inbox_items for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "imported_reservations_all_authenticated" on public.imported_reservations;
create policy "imported_reservations_all_authenticated" on public.imported_reservations for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
