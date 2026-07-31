-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
-- ETAP 2 modułu Szkoła psychoterapii: budżet zjazdu (planowany/wydany/pozostały).
--
-- Migracja jest w pełni addytywna i bezpieczna do wielokrotnego uruchomienia:
-- ADD COLUMN IF NOT EXISTS na istniejącej tabeli school_sessions, nie usuwa
-- ani nie modyfikuje żadnych innych kolumn ani wierszy. Nie dotyka modułu
-- artykułów ani tabeli trips.

alter table public.school_sessions
  add column if not exists planned_budget numeric(10, 2),
  add column if not exists planned_budget_currency text default 'PLN'
    check (planned_budget_currency in ('DKK', 'PLN', 'EUR'));
