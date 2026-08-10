-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
--
-- Fundament /lab/schowek: prywatna biblioteka fragmentów tekstu (biogramy,
-- dane kontaktowe, szablony wiadomości itp.), które użytkownik często musi
-- kopiować do formularzy, zgłoszeń i publikacji.
--
-- W odróżnieniu od migracji 001 (articles/article_versions/article_sources,
-- gdzie panel jest jednoosobowy i polityki RLS celowo dopuszczają każdego
-- zalogowanego — "auth.role() = 'authenticated'") ta tabela od razu ma
-- poprawne, ścisłe powiązanie z auth.uid() (wzorzec z schema.sql:
-- article_ideas/trips) — każdy wpis należy do konkretnego użytkownika i
-- tylko on może go odczytać/zmienić/usunąć, nawet jeśli dziś panel ma
-- jednego administratora.
--
-- Kategoria i język są wolnym tekstem (bez osobnej tabeli słownikowej) —
-- dozwolone wartości pilnowane wyłącznie w warstwie aplikacji
-- (src/lib/lab/clipboard-types.ts), nie przez CHECK w bazie, żeby dodanie
-- nowej kategorii w przyszłości nie wymagało kolejnej migracji.
--
-- Idempotentna: "create table if not exists", "create index if not exists",
-- "drop policy if exists" przed ponownym założeniem — bezpieczna do
-- wielokrotnego uruchomienia. Bez DROP TABLE/DELETE/TRUNCATE.

create table if not exists public.clipboard_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text,
  language text,
  content text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clipboard_items_user_id_idx on public.clipboard_items (user_id);
create index if not exists clipboard_items_sort_order_idx on public.clipboard_items (sort_order);

alter table public.clipboard_items enable row level security;

-- Brak automatycznego triggera na updated_at — w tym projekcie nie istnieje
-- ogólny mechanizm tego typu (sprawdzone: articles.updated_at też jest
-- ustawiane ręcznie w server actions, np. src/app/lab/artykuly/[id]/actions.ts),
-- więc dla spójności updated_at jest ustawiane po stronie aplikacji przy
-- każdym update (src/app/lab/schowek/actions.ts), tak jak wszędzie indziej.

drop policy if exists "clipboard_items_select_own" on public.clipboard_items;
create policy "clipboard_items_select_own"
  on public.clipboard_items for select
  using (auth.uid() = user_id);

drop policy if exists "clipboard_items_insert_own" on public.clipboard_items;
create policy "clipboard_items_insert_own"
  on public.clipboard_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "clipboard_items_update_own" on public.clipboard_items;
create policy "clipboard_items_update_own"
  on public.clipboard_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "clipboard_items_delete_own" on public.clipboard_items;
create policy "clipboard_items_delete_own"
  on public.clipboard_items for delete
  using (auth.uid() = user_id);
