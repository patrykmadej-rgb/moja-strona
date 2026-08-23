-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
--
-- Fundament /lab/biblioteka: prywatna kolekcja książek psychologicznych i
-- psychoterapeutycznych (posiadanych oraz planowanych do zakupu) wraz z
-- historią wypożyczeń.
--
-- Wzorowana na migracji 021 (clipboard_items) — od razu ścisłe powiązanie
-- z auth.uid() ("clipboard_items_*_own"-style polityki RLS), bez
-- "auth.role() = 'authenticated'" znanego z migracji 001, bo to z definicji
-- prywatne, jednoosobowe dane.
--
-- Dwie tabele:
--   * public.library_books — pojedyncza książka, zawsze przypisana do usera.
--   * public.library_loans — historia wypożyczeń książki (0..N wierszy na
--     książkę), z ograniczeniem "tylko jedno aktywne wypożyczenie na
--     książkę" wymuszonym unikalnym indeksem częściowym (where returned_at
--     is null), a nie triggerem/CHECK (Postgres nie pozwala CHECK
--     odwoływać się do innych wierszy).
--
-- library_loans NIE ma własnej kolumny user_id — właściciela wypożyczenia
-- wyznacza wyłącznie właściciel powiązanej książki (join do
-- library_books), więc nie ma ryzyka rozjazdu dwóch kolumn user_id między
-- tabelami (żadnego dodatkowego mechanizmu spójności nie trzeba pilnować).
-- RLS dla library_loans sprawdza to przez EXISTS na library_books.
--
-- Kategoria i język są wolnym tekstem (bez tabeli słownikowej), tak jak
-- category/language w clipboard_items — dozwolone wartości pilnowane
-- wyłącznie w warstwie aplikacji (src/lib/lab/library-types.ts), żeby
-- dodanie nowej kategorii nie wymagało kolejnej migracji.
--
-- Idempotentna: "create table if not exists", "create index if not
-- exists", "drop policy if exists" przed ponownym założeniem — bezpieczna
-- do wielokrotnego uruchomienia. Bez DROP TABLE/DELETE/TRUNCATE.

create table if not exists public.library_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  author text not null,
  ownership_status text not null default 'wishlist'
    check (ownership_status in ('owned', 'wishlist')),
  reading_status text not null default 'unread'
    check (reading_status in ('unread', 'reading', 'read')),
  category text,
  language text,
  year integer
    check (year is null or (year >= 1400 and year <= extract(year from now())::int + 1)),
  isbn text,
  publisher text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Status czytania nie ma sensu dla książek jeszcze niekupionych — zamiast
  -- pilnować tego wyłącznie w UI, wymuszamy to też na poziomie bazy: książka
  -- na liście zakupowej zawsze ma reading_status = 'unread'.
  constraint library_books_wishlist_unread
    check (ownership_status = 'owned' or reading_status = 'unread')
);

create index if not exists library_books_user_id_idx on public.library_books (user_id);
create index if not exists library_books_isbn_idx on public.library_books (isbn) where isbn is not null;
create index if not exists library_books_ownership_status_idx on public.library_books (ownership_status);
create index if not exists library_books_reading_status_idx on public.library_books (reading_status);

alter table public.library_books enable row level security;

-- Brak automatycznego triggera na updated_at — spójnie z resztą projektu
-- (patrz komentarz w migracji 021), updated_at jest ustawiane ręcznie po
-- stronie aplikacji przy każdym update (src/lib/lab/library-service.ts).

drop policy if exists "library_books_select_own" on public.library_books;
create policy "library_books_select_own"
  on public.library_books for select
  using (auth.uid() = user_id);

drop policy if exists "library_books_insert_own" on public.library_books;
create policy "library_books_insert_own"
  on public.library_books for insert
  with check (auth.uid() = user_id);

drop policy if exists "library_books_update_own" on public.library_books;
create policy "library_books_update_own"
  on public.library_books for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "library_books_delete_own" on public.library_books;
create policy "library_books_delete_own"
  on public.library_books for delete
  using (auth.uid() = user_id);

create table if not exists public.library_loans (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.library_books (id) on delete cascade,
  borrower_name text not null,
  loaned_at date not null default current_date,
  returned_at date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint library_loans_returned_after_loaned
    check (returned_at is null or returned_at >= loaned_at)
);

create index if not exists library_loans_book_id_idx on public.library_loans (book_id);

-- Tylko jedno AKTYWNE (returned_at is null) wypożyczenie na książkę —
-- wymuszone na poziomie bazy unikalnym indeksem częściowym, nie tylko w
-- warstwie aplikacji. Zwrócone wypożyczenia (returned_at not null) mogą się
-- powtarzać dowolną liczbę razy, bo indeks częściowy ich nie obejmuje —
-- dzięki temu historia wypożyczeń tej samej książki różnym osobom jest
-- w pełni zachowana.
create unique index if not exists library_loans_one_active_per_book_idx
  on public.library_loans (book_id)
  where returned_at is null;

alter table public.library_loans enable row level security;

-- library_loans nie ma kolumny user_id — właściciela wyznacza właściciel
-- powiązanej książki, więc każda polityka sprawdza to przez EXISTS.
drop policy if exists "library_loans_select_own" on public.library_loans;
create policy "library_loans_select_own"
  on public.library_loans for select
  using (
    exists (
      select 1 from public.library_books b
      where b.id = library_loans.book_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "library_loans_insert_own" on public.library_loans;
create policy "library_loans_insert_own"
  on public.library_loans for insert
  with check (
    exists (
      select 1 from public.library_books b
      where b.id = library_loans.book_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "library_loans_update_own" on public.library_loans;
create policy "library_loans_update_own"
  on public.library_loans for update
  using (
    exists (
      select 1 from public.library_books b
      where b.id = library_loans.book_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.library_books b
      where b.id = library_loans.book_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "library_loans_delete_own" on public.library_loans;
create policy "library_loans_delete_own"
  on public.library_loans for delete
  using (
    exists (
      select 1 from public.library_books b
      where b.id = library_loans.book_id and b.user_id = auth.uid()
    )
  );
