-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
-- ETAP 6 modułu Szkoła psychoterapii: automatyczne grupowanie wydarzeń
-- kalendarza w zjazdy weekendowe (piątek-niedziela) i automatyczne
-- tworzenie/dopasowywanie zjazdów na tej podstawie.
--
-- W pełni addytywna. Brak DROP TABLE, DROP COLUMN, DELETE FROM.
--
-- ŚWIADOMA DECYZJA — czego NIE dodajemy:
-- "weekendStart", "grouping_status" i "auto_group_confidence" dla
-- pojedynczego wydarzenia (school_calendar_events) dają się w 100% policzyć
-- w locie z (start_at, end_at, all_day) + strefy czasowej użytkownika —
-- patrz czysta funkcja groupCalendarEventsIntoWeekends w
-- src/lib/szkola/calendarWeekendGrouping.ts. Przechowywanie ich jako kolumn
-- oznaczałoby zduplikowany, mogący się rozjechać stan (np. po ręcznej
-- zmianie strefy czasowej w ustawieniach) bez żadnej korzyści — więc
-- zgodnie z zasadą "nie dodawaj pól, które da się bezpiecznie wyliczyć
-- dynamicznie" (sekcja 15 specyfikacji), school_calendar_events zostaje
-- BEZ ZMIAN w tej migracji.
--
-- Podobnie pomijamy "school_sessions.calendar_weekend_start" i
-- "source_connection_id" — wykrywanie, czy istniejący zjazd obejmuje dany
-- weekend, opiera się wyłącznie na już istniejących start_date/end_date
-- (patrz findExistingSessionForWeekend), a każdy użytkownik ma dziś co
-- najwyżej jedno połączenie kalendarza (unique (user_id, provider) z
-- migracji 009), więc "to samo połączenie kalendarza" jest już zapewnione
-- przez samo user_id — osobna kolumna nic by tu nie dodała.
--
-- Dwa pola, które NIE dają się wyliczyć (to decyzje/preferencje użytkownika,
-- a nie pochodna istniejących danych), faktycznie dochodzą:
--   1) school_calendar_settings.auto_create_sessions — przełącznik "Automatycznie
--      twórz zjazdy z weekendów szkoleniowych" (sekcja 10). Domyślnie
--      wyłączony; włącza się sam po pierwszym ręcznie zatwierdzonym imporcie
--      wsadowym (patrz createAllConfidentWeekendSessionsAction).
--   2) school_sessions.created_from_calendar — czy istnienie tego zjazdu
--      zostało zdecydowane przez automatyzację grupowania weekendów, a nie
--      ręcznie przez użytkownika (formularz "Nowy zjazd") ani przez starszy
--      przepływ "Utwórz nowy zjazd" z pojedynczego wydarzenia. Nie da się
--      tego wywnioskować z innych kolumn (obecność session_schedule_items
--      ze source='google_calendar' nie wystarcza — takie punkty planu można
--      dodać też do ręcznie utworzonego zjazdu).

alter table public.school_calendar_settings
  add column if not exists auto_create_sessions boolean not null default false;

alter table public.school_sessions
  add column if not exists created_from_calendar boolean not null default false;

create index if not exists school_sessions_created_from_calendar_idx
  on public.school_sessions (created_from_calendar)
  where created_from_calendar;
