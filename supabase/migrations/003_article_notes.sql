-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
-- Rozszerzenie panelu /lab: luźne notatki artykułu (zakładka "Notatki").

create table if not exists public.article_notes (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  content text not null,
  is_pinned boolean not null default false,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.article_notes enable row level security;

-- Na razie panel /lab jest jednoosobowy, więc każdy zalogowany
-- (auth.role() = 'authenticated') ma pełny dostęp do wszystkich operacji.
-- DO ROZBUDOWY: gdy dojdą kolejni użytkownicy, zawęzić do
-- auth.uid() = created_by (na wzór article_ideas/trips w schema.sql).

create policy "article_notes_all_authenticated"
  on public.article_notes for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
