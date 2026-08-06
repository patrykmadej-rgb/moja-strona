-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
--
-- Wprowadza model semestru dla automatycznego statusu "Semestr opłacony" w
-- sekcji "Status przygotowań" (zjazd jest teraz opłacany semestralnie z
-- góry, nie pojedynczo per zjazd) oraz kolumnę lodging_not_needed dla
-- jedynej ręcznej decyzji dotyczącej noclegu ("Nocleg nie jest potrzebny").
--
-- W pełni addytywna: nowa tabela + nowe, nullable/domyślne kolumny na
-- school_sessions. Bez DROP TABLE/COLUMN, bez DELETE/TRUNCATE, bez zmiany
-- istniejących danych w session_tasks (stare pozycje "Rejestracja na
-- zjazd"/"Ubezpieczenie"/"Materiały i przygotowanie" zostają w bazie —
-- aplikacja po prostu przestaje je tworzyć i przestaje je pokazywać jako
-- "Status przygotowań").
--
-- school_sessions.semester_id jest NULLABLE (on delete set null) — sesje
-- bez przypisanego semestru po prostu pokazują status płatności "brak
-- danych", nic nie jest wymuszane wstecznie.
--
-- Idempotentna: "create table if not exists" / "add column if not exists" /
-- "drop policy if exists" przed ponownym założeniem — bezpieczna do
-- wielokrotnego uruchomienia.

create table if not exists public.school_semesters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date,
  payment_due_date date,
  amount numeric(10, 2),
  currency text default 'PLN' check (currency in ('DKK', 'PLN', 'EUR')),
  -- Te same wartości co school_payments.status/accommodations.payment_status
  -- (migracja 005) — celowo ten sam słownik, żeby nie mnożyć bytów.
  payment_status text not null default 'do_zaplaty'
    check (payment_status in ('do_zaplaty', 'oplacone', 'po_terminie', 'anulowane')),
  paid_at date,
  notes text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.school_semesters enable row level security;

drop policy if exists "school_semesters_all_authenticated" on public.school_semesters;
create policy "school_semesters_all_authenticated" on public.school_semesters for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table public.school_sessions
  add column if not exists semester_id uuid references public.school_semesters (id) on delete set null;

alter table public.school_sessions
  add column if not exists lodging_not_needed boolean not null default false;

create index if not exists school_sessions_semester_id_idx on public.school_sessions (semester_id);
create index if not exists school_semesters_start_date_idx on public.school_semesters (start_date);
