-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".

-- 1. Tabela: pomysły na artykuły
create table if not exists public.article_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  tags text[] not null default '{}',
  pdf_path text,
  created_at timestamptz not null default now()
);

alter table public.article_ideas enable row level security;

create policy "article_ideas_select_own"
  on public.article_ideas for select
  using (auth.uid() = user_id);

create policy "article_ideas_insert_own"
  on public.article_ideas for insert
  with check (auth.uid() = user_id);

create policy "article_ideas_update_own"
  on public.article_ideas for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "article_ideas_delete_own"
  on public.article_ideas for delete
  using (auth.uid() = user_id);

-- 2. Tabela: zjazdy
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_date date not null,
  ticket_reservation_number text,
  ticket_pdf_path text,
  accommodation text,
  address text,
  cost numeric(10, 2),
  paid boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.trips enable row level security;

create policy "trips_select_own"
  on public.trips for select
  using (auth.uid() = user_id);

create policy "trips_insert_own"
  on public.trips for insert
  with check (auth.uid() = user_id);

create policy "trips_update_own"
  on public.trips for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "trips_delete_own"
  on public.trips for delete
  using (auth.uid() = user_id);

-- 3. Storage: prywatny bucket na pliki PDF (pomysły + bilety)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Pliki trzymane są pod ścieżką "{user_id}/...", więc pierwszy segment ścieżki
-- musi być równy auth.uid() właściciela.
create policy "documents_select_own"
  on storage.objects for select
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "documents_insert_own"
  on storage.objects for insert
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "documents_update_own"
  on storage.objects for update
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "documents_delete_own"
  on storage.objects for delete
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
