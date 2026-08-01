-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
-- ETAP 4 modułu Szkoła psychoterapii: integracja z Google Calendar
-- (odczyt wydarzeń, historia zmian, dopasowanie do zjazdów, ocena wpływu
-- na podróż) + konfigurowalne bufory czasowe.
--
-- W pełni addytywna. Żadna z tabel poniżej nie istniała wcześniej (nie ma
-- kolizji z migracjami 005-008), więc to głównie "create table if not
-- exists" + „alter table ... add column if not exists" na już istniejącej
-- session_schedule_items. Brak DROP TABLE, DROP COLUMN, DELETE FROM.
--
-- WAŻNA DECYZJA BEZPIECZEŃSTWA: school_calendar_connections przechowuje
-- zaszyfrowane tokeny OAuth (access/refresh). W odróżnieniu od reszty
-- tabel modułu Szkoła (RLS = "authenticated" ma pełny dostęp), ta tabela
-- ma RLS włączone, ale CELOWO bez żadnej polityki dla ról anon/authenticated
-- — więc żadne zapytanie z przeglądarki (nawet zalogowanego właściciela) nie
-- zwróci ani jednego wiersza. Jedyny dostęp: rola service_role (używana
-- WYŁĄCZNIE po stronie serwera, nigdy w kodzie klienckim) poprzez
-- src/lib/supabase/admin.ts. Tokeny są dodatkowo szyfrowane w aplikacji
-- (AES-256-GCM, klucz w zmiennej środowiskowej CALENDAR_TOKEN_ENCRYPTION_KEY)
-- zanim trafią do kolumn *_encrypted — więc nawet wyciek samej bazy danych
-- (np. z backupu) nie ujawnia tokenów w czytelnej postaci.

-- 1. Połączenie z Google Calendar (dane wrażliwe — patrz komentarz wyżej).
create table if not exists public.school_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'google' check (provider in ('google')),
  calendar_id text,
  calendar_name text,
  calendar_color text,
  scope text,
  sync_enabled boolean not null default true,
  sync_frequency text not null default 'weekly' check (sync_frequency in ('weekly', 'manual')),
  last_synced_at timestamptz,
  next_sync_at timestamptz,
  sync_token text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create index if not exists school_calendar_connections_user_id_idx
  on public.school_calendar_connections (user_id);

alter table public.school_calendar_connections enable row level security;
-- Celowo BRAK "create policy" dla anon/authenticated — patrz komentarz na
-- górze pliku. Dostęp tylko przez service_role (pomija RLS z definicji).

-- 2. Zaimportowane wydarzenia z Google Calendar (bez danych wrażliwych —
-- ten sam poziom dostępu co reszta modułu Szkoła).
create table if not exists public.school_calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  google_event_id text not null,
  ical_uid text,
  calendar_id text,
  session_id uuid references public.school_sessions (id) on delete set null,
  ignored boolean not null default false,
  title text,
  description text,
  location text,
  start_at timestamptz,
  end_at timestamptz,
  all_day boolean not null default false,
  timezone text,
  status text,
  organizer_email text,
  attendees jsonb,
  attachments jsonb,
  recurrence text[],
  recurring_event_id text,
  original_start_time timestamptz,
  google_updated_at timestamptz,
  raw_hash text,
  html_link text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, google_event_id)
);

create index if not exists school_calendar_events_user_id_idx
  on public.school_calendar_events (user_id);
create index if not exists school_calendar_events_session_id_idx
  on public.school_calendar_events (session_id);
create index if not exists school_calendar_events_status_idx
  on public.school_calendar_events (status);

alter table public.school_calendar_events enable row level security;
drop policy if exists "school_calendar_events_all_authenticated" on public.school_calendar_events;
create policy "school_calendar_events_all_authenticated" on public.school_calendar_events for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 3. Historia uruchomień synchronizacji.
create table if not exists public.school_calendar_sync_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  connection_id uuid references public.school_calendar_connections (id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running' check (status in ('running', 'success', 'error')),
  events_received int not null default 0,
  events_created int not null default 0,
  events_updated int not null default 0,
  events_deleted int not null default 0,
  error_message text,
  sync_type text not null check (sync_type in ('manual', 'scheduled', 'initial')),
  created_at timestamptz not null default now()
);

create index if not exists school_calendar_sync_runs_user_id_idx
  on public.school_calendar_sync_runs (user_id);
create index if not exists school_calendar_sync_runs_connection_id_idx
  on public.school_calendar_sync_runs (connection_id);

alter table public.school_calendar_sync_runs enable row level security;
drop policy if exists "school_calendar_sync_runs_all_authenticated" on public.school_calendar_sync_runs;
create policy "school_calendar_sync_runs_all_authenticated" on public.school_calendar_sync_runs for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 4. Zmiany wykryte przy porównywaniu wydarzeń (jedna zmiana = jedno pole).
create table if not exists public.school_calendar_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  calendar_event_id uuid references public.school_calendar_events (id) on delete cascade,
  session_id uuid references public.school_sessions (id) on delete set null,
  sync_run_id uuid references public.school_calendar_sync_runs (id) on delete set null,
  change_type text not null check (change_type in ('created', 'updated', 'deleted', 'moved', 'cancelled')),
  field_name text,
  old_value text,
  new_value text,
  detected_at timestamptz not null default now(),
  reviewed_at timestamptz,
  status text not null default 'new' check (status in ('new', 'reviewed', 'accepted', 'ignored')),
  impact_level text not null default 'none' check (impact_level in ('none', 'information', 'warning', 'conflict')),
  impact_summary text,
  created_at timestamptz not null default now()
);

create index if not exists school_calendar_changes_user_id_idx
  on public.school_calendar_changes (user_id);
create index if not exists school_calendar_changes_session_id_idx
  on public.school_calendar_changes (session_id);
create index if not exists school_calendar_changes_status_idx
  on public.school_calendar_changes (status);
create index if not exists school_calendar_changes_impact_level_idx
  on public.school_calendar_changes (impact_level);
create index if not exists school_calendar_changes_calendar_event_id_idx
  on public.school_calendar_changes (calendar_event_id);

alter table public.school_calendar_changes enable row level security;
drop policy if exists "school_calendar_changes_all_authenticated" on public.school_calendar_changes;
create policy "school_calendar_changes_all_authenticated" on public.school_calendar_changes for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 5. Konfigurowalne bufory czasowe (ocena kolizji z podróżą) — jeden
-- wiersz per użytkownik, tworzony "na żądanie" (upsert) przy pierwszym
-- otwarciu ustawień, bez sztywnych stałych w kodzie aplikacji.
create table if not exists public.school_calendar_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  buffer_before_minutes int not null default 60,
  buffer_after_minutes int not null default 60,
  flight_buffer_minutes int not null default 120,
  train_buffer_minutes int not null default 30,
  default_timezone text not null default 'Europe/Warsaw',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.school_calendar_settings enable row level security;
drop policy if exists "school_calendar_settings_all_authenticated" on public.school_calendar_settings;
create policy "school_calendar_settings_all_authenticated" on public.school_calendar_settings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 6. Import punktów planu zajęć z Google Calendar — brakujące kolumny na
-- już istniejącej (migracja 005/007) tabeli session_schedule_items.
alter table public.session_schedule_items
  add column if not exists source text not null default 'manual',
  add column if not exists google_event_id text;

alter table public.session_schedule_items
  drop constraint if exists session_schedule_items_source_check;
alter table public.session_schedule_items
  add constraint session_schedule_items_source_check
  check (source in ('manual', 'google_calendar'));

create index if not exists session_schedule_items_google_event_id_idx
  on public.session_schedule_items (google_event_id);
