-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
-- Dodaje "Priorytet" dla artykułów naukowych — wymiar NIEZALEŻNY od
-- systemu statusów (public.articles.status, patrz migracja 014), służący
-- wyłącznie do porządkowania kolejności pracy.
--
-- W pełni addytywna: nowa, opcjonalna kolumna text z osobnym CHECK
-- constraintem. Bez DROP TABLE/COLUMN, bez DELETE/TRUNCATE, bez zmiany
-- istniejących statusów, bez domyślnej wartości — istniejące artykuły
-- zostają z priority = NULL ("Bez priorytetu"), nikomu nic nie jest
-- automatycznie przypisywane.
--
-- Idempotentna: "add column if not exists" + "drop constraint if exists"
-- przed ponownym założeniem constraintu, więc bezpieczna do wielokrotnego
-- uruchomienia i nie tworzy duplikatu kolumny/constraintu.

alter table public.articles
  add column if not exists priority text null;

alter table public.articles drop constraint if exists articles_priority_check;
alter table public.articles
  add constraint articles_priority_check
  check (priority is null or priority in ('top', 'medium', 'low', 'on_hold'));
