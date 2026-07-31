-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
-- Rozszerzenie panelu /lab: wydarzenia/harmonogram artykułu (zakładka "Harmonogram").

create table if not exists public.article_events (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  title text not null,
  event_type text not null default 'milestone'
    check (event_type in ('milestone', 'deadline', 'spotkanie', 'przypomnienie', 'inne')),
  event_date date not null,
  is_completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.article_events enable row level security;

-- Na razie panel /lab jest jednoosobowy, więc każdy zalogowany
-- (auth.role() = 'authenticated') ma pełny dostęp do wszystkich operacji.
-- DO ROZBUDOWY: gdy dojdą kolejni użytkownicy, zawęzić do
-- auth.uid() = created_by (na wzór article_ideas/trips w schema.sql) —
-- wymagałoby to dodania kolumny created_by, tak jak w articles.

create policy "article_events_all_authenticated"
  on public.article_events for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
