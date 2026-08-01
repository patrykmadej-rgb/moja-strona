-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
-- ETAP 4 (zmiana kierunku): domyślny sposób połączenia kalendarza szkoły to
-- teraz prywatny link subskrypcji ICS (webcal://... / https://....ics),
-- a nie Google OAuth — szkoła nie udostępnia kalendarza przez konto Google,
-- tylko wysyła link w formacie iCalendar.
--
-- W pełni addytywna nadbudówka nad migracją 009. Wszystkie tabele z 009
-- (school_calendar_events, school_calendar_sync_runs, school_calendar_changes,
-- school_calendar_settings) są ŹRÓDŁOWO NIEZALEŻNE — reprezentują "wydarzenie
-- kalendarza" niezależnie od tego, czy pochodzi z Google Calendar API, czy
-- z parsowania pliku ICS — więc NIE WYMAGAJĄ ŻADNEJ ZMIANY. Jedyna tabela,
-- którą trzeba rozbudować, to school_calendar_connections (dochodzi nowy
-- wariant "skąd bierzemy dane" + pola specyficzne dla ICS).
--
-- Brak DROP TABLE, DROP COLUMN, DELETE FROM. Kod OAuth (kolumny
-- access_token_encrypted/refresh_token_encrypted/sync_token/calendar_id)
-- zostaje nietknięty — to teraz opcjonalny, drugi wariant połączenia
-- (connection_type = 'google_oauth'), nie usunięty.
--
-- ŚWIADOME DECYZJE NAZEWNICZE (żeby nie duplikować kolumn o tym samym
-- znaczeniu pod dwiema nazwami, tak jak w migracjach 007/009):
--   - Nazwa połączonego kalendarza nadal w istniejącej kolumnie
--     `calendar_name` (używanej wcześniej dla nazwy kalendarza Google) —
--     dla ICS trzyma po prostu nazwę nadaną przez użytkownika przy
--     wklejaniu linku. Nie dodajemy osobnej `source_name`.
--   - "Domyślna strefa czasowa" z formularza połączenia ICS zapisywana
--     jest do już istniejącej `school_calendar_settings.default_timezone`
--     (ten sam koncept co bufor czasowy — jedna strefa czasowa na
--     użytkownika), a nie do nowej kolumny na connections.

alter table public.school_calendar_connections
  add column if not exists connection_type text not null default 'ics_url',
  add column if not exists encrypted_ics_url text,
  add column if not exists masked_ics_url text,
  add column if not exists etag text,
  add column if not exists last_modified text,
  add column if not exists last_successful_fetch_at timestamptz,
  add column if not exists last_http_status int;

alter table public.school_calendar_connections
  drop constraint if exists school_calendar_connections_connection_type_check;
alter table public.school_calendar_connections
  add constraint school_calendar_connections_connection_type_check
  check (connection_type in ('ics_url', 'google_oauth'));

-- calendar_id/sync_token/access_token_encrypted/refresh_token_encrypted/
-- token_expires_at zostają nullable i nieużywane dla connection_type =
-- 'ics_url' (żaden z nich nie ma constraintu "not null", więc nic tu nie
-- trzeba zmieniać).
