-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
-- ETAP 5 modułu Szkoła psychoterapii: skrzynka importu rezerwacji/dokumentów,
-- rozpoznawanie i wyciąganie danych, centrum alertów, rejestr automatyzacji.
--
-- W pełni addytywna. import_inbox_items i imported_reservations JUŻ ISTNIEJĄ
-- (migracja 005, bardzo wąski schemat po polsku, nigdy realnie nieużywany
-- przez żaden UI) — ta migracja je ROZBUDOWUJE, nie tworzy od nowa. Brak
-- DROP TABLE, DROP COLUMN, DELETE FROM, TRUNCATE.
--
-- ŚWIADOME DECYZJE NAZEWNICZE (jak w migracjach 007/009/010):
--   - Kolumna `source` na import_inbox_items pełni rolę "source_type" ze
--     specyfikacji (to dokładnie ten sam koncept) — poszerzony check
--     zamiast nowej, duplikującej kolumny.
--   - Kolumna `parsed_data` (jsonb) na imported_reservations pełni rolę
--     "extracted_data" ze specyfikacji — identyczne przeznaczenie.
--   - Stare polskie wartości status/reservation_type są PRZEMIANOWYWANE
--     (UPDATE) na nowe angielskie odpowiedniki PRZED zawężeniem/poszerzeniem
--     constraintów, żeby żaden ewentualny istniejący wiersz nie złamał
--     nowego CHECK (ten sam wzorzec bezpieczeństwa co w migracji 007).
--   - Rejestr synchronizacji kalendarza (school_calendar_sync_runs, migracja
--     009) zostaje osobno — nowa tabela school_automation_runs poniżej
--     dotyczy WYŁĄCZNIE nowego zadania dziennego (daily_checks), żeby nie
--     duplikować już istniejącego, działającego rejestru.

-- 1. import_inbox_items — migracja danych PRZED zawężeniem/poszerzeniem constraintów.
update public.import_inbox_items set status = 'new' where status = 'nowa';
update public.import_inbox_items set status = 'recognized' where status = 'rozpoznana';
update public.import_inbox_items set status = 'needs_review' where status = 'wymaga_sprawdzenia';
update public.import_inbox_items set status = 'assigned' where status = 'przypisana';
update public.import_inbox_items set status = 'rejected' where status = 'odrzucona';
update public.import_inbox_items set source = 'inbound_email' where source = 'email';

alter table public.import_inbox_items
  add column if not exists user_id uuid references auth.users (id) on delete cascade,
  add column if not exists sender_name text,
  add column if not exists raw_text text,
  add column if not exists mime_type text,
  add column if not exists file_size bigint,
  add column if not exists file_hash text,
  add column if not exists detected_type text,
  add column if not exists confidence_score numeric(4, 3),
  add column if not exists proposed_session_id uuid references public.school_sessions (id) on delete set null,
  add column if not exists processing_error text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.import_inbox_items alter column status set default 'new';

alter table public.import_inbox_items drop constraint if exists import_inbox_items_status_check;
alter table public.import_inbox_items
  add constraint import_inbox_items_status_check
  check (status in ('new', 'processing', 'recognized', 'needs_review', 'ready', 'assigned', 'rejected', 'error'));

alter table public.import_inbox_items drop constraint if exists import_inbox_items_source_check;
alter table public.import_inbox_items
  add constraint import_inbox_items_source_check
  check (source in ('upload', 'pasted_email', 'eml', 'inbound_email', 'manual'));

alter table public.import_inbox_items drop constraint if exists import_inbox_items_detected_type_check;
alter table public.import_inbox_items
  add constraint import_inbox_items_detected_type_check
  check (detected_type is null or detected_type in (
    'flight', 'train', 'bus', 'hotel', 'school_payment', 'invoice',
    'receipt', 'school_information', 'schedule', 'certificate', 'other'
  ));

create index if not exists import_inbox_items_user_id_idx on public.import_inbox_items (user_id);
create index if not exists import_inbox_items_status_idx on public.import_inbox_items (status);
create index if not exists import_inbox_items_detected_type_idx on public.import_inbox_items (detected_type);
create index if not exists import_inbox_items_proposed_session_id_idx on public.import_inbox_items (proposed_session_id);
create index if not exists import_inbox_items_file_hash_idx on public.import_inbox_items (file_hash);

-- 2. imported_reservations — analogicznie, dane PRZED constraintami.
update public.imported_reservations set reservation_type = 'flight' where reservation_type = 'lot';
update public.imported_reservations set reservation_type = 'train' where reservation_type = 'pociag';
update public.imported_reservations set reservation_type = 'invoice' where reservation_type = 'faktura';
update public.imported_reservations set reservation_type = 'school_payment' where reservation_type = 'platnosc';
update public.imported_reservations set reservation_type = 'other' where reservation_type = 'inne';

update public.imported_reservations set status = 'new' where status = 'nowa';
update public.imported_reservations set status = 'recognized' where status = 'rozpoznana';
update public.imported_reservations set status = 'needs_review' where status = 'wymaga_sprawdzenia';
update public.imported_reservations set status = 'assigned' where status = 'przypisana';
update public.imported_reservations set status = 'rejected' where status = 'odrzucona';

alter table public.imported_reservations
  add column if not exists user_id uuid references auth.users (id) on delete cascade,
  add column if not exists provider text,
  add column if not exists booking_reference text,
  add column if not exists origin text,
  add column if not exists destination text,
  add column if not exists start_at timestamptz,
  add column if not exists end_at timestamptz,
  add column if not exists check_in date,
  add column if not exists check_out date,
  add column if not exists amount numeric(10, 2),
  add column if not exists currency text,
  add column if not exists payment_status text,
  add column if not exists passenger_name text,
  add column if not exists baggage text,
  add column if not exists seat text,
  add column if not exists cancellation_deadline timestamptz,
  add column if not exists confidence_score numeric(4, 3),
  add column if not exists approved_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.imported_reservations alter column status set default 'new';

alter table public.imported_reservations drop constraint if exists imported_reservations_reservation_type_check;
alter table public.imported_reservations
  add constraint imported_reservations_reservation_type_check
  check (reservation_type in (
    'flight', 'train', 'bus', 'hotel', 'school_payment', 'invoice',
    'receipt', 'school_information', 'schedule', 'certificate', 'other'
  ));

alter table public.imported_reservations drop constraint if exists imported_reservations_status_check;
alter table public.imported_reservations
  add constraint imported_reservations_status_check
  check (status in ('new', 'processing', 'recognized', 'needs_review', 'ready', 'assigned', 'rejected', 'error'));

create index if not exists imported_reservations_user_id_idx on public.imported_reservations (user_id);
create index if not exists imported_reservations_session_id_idx on public.imported_reservations (session_id);
create index if not exists imported_reservations_status_idx on public.imported_reservations (status);
create index if not exists imported_reservations_reservation_type_idx on public.imported_reservations (reservation_type);
create index if not exists imported_reservations_inbox_item_id_idx on public.imported_reservations (inbox_item_id);

-- 3. Centrum alertów — nowa tabela.
create table if not exists public.school_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (category in (
    'podroz', 'zakwaterowanie', 'platnosc', 'kalendarz', 'materialy', 'dokumenty', 'godziny', 'import'
  )),
  priority text not null check (priority in ('informacja', 'uwaga', 'pilne')),
  title text not null,
  description text,
  session_id uuid references public.school_sessions (id) on delete cascade,
  source text,
  source_id uuid,
  action_label text,
  action_href text,
  status text not null default 'new' check (status in ('new', 'seen', 'resolved', 'ignored')),
  dedupe_key text,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists school_alerts_user_id_idx on public.school_alerts (user_id);
create index if not exists school_alerts_status_idx on public.school_alerts (status);
create index if not exists school_alerts_category_idx on public.school_alerts (category);
create index if not exists school_alerts_priority_idx on public.school_alerts (priority);
create index if not exists school_alerts_session_id_idx on public.school_alerts (session_id);

-- Zapobiega duplikatom tego samego alertu, dopóki jest aktywny (new/seen).
-- Po rozwiązaniu/zignorowaniu (resolved/ignored) ten sam dedupe_key może
-- ponownie utworzyć nowy alert, jeśli warunek znów wystąpi.
create unique index if not exists school_alerts_dedupe_active_idx
  on public.school_alerts (user_id, dedupe_key)
  where status in ('new', 'seen') and dedupe_key is not null;

alter table public.school_alerts enable row level security;
drop policy if exists "school_alerts_all_authenticated" on public.school_alerts;
create policy "school_alerts_all_authenticated" on public.school_alerts for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 4. Rejestr uruchomień nowego zadania automatycznego (sprawdzenia dzienne).
-- Cotygodniowa synchronizacja kalendarza ma już własny rejestr
-- (school_calendar_sync_runs, migracja 009) — celowo nieduplikowany tutaj.
create table if not exists public.school_automation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_type text not null check (task_type in ('daily_checks')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running' check (status in ('running', 'success', 'partial', 'failed')),
  records_processed int not null default 0,
  alerts_created int not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists school_automation_runs_user_id_idx on public.school_automation_runs (user_id);
create index if not exists school_automation_runs_task_type_idx on public.school_automation_runs (task_type);
create index if not exists school_automation_runs_started_at_idx on public.school_automation_runs (started_at);

alter table public.school_automation_runs enable row level security;
drop policy if exists "school_automation_runs_all_authenticated" on public.school_automation_runs;
create policy "school_automation_runs_all_authenticated" on public.school_automation_runs for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
