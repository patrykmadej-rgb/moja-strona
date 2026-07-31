-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
-- Fundament panelu /lab: artykuły naukowe, ich wersje (pliki) i źródła.

-- 1. Tabela: artykuły
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  language text,
  target_journal text,
  discipline text,
  keywords text[] not null default '{}',
  abstract text,
  status text not null default 'pomysl'
    check (status in (
      'pomysl', 'pisanie', 'do_wyslania', 'w_redakcji',
      'recenzja', 'poprawki', 'przyjety', 'opublikowany'
    )),
  progress_percent int not null default 0
    check (progress_percent >= 0 and progress_percent <= 100),
  next_step text,
  deadline date,
  is_private boolean not null default true,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Tabela: wersje pliku artykułu
create table if not exists public.article_versions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  version_number int not null,
  file_path text,
  file_name text,
  file_size_bytes bigint,
  notes text,
  uploaded_by uuid references auth.users (id),
  uploaded_at timestamptz not null default now()
);

-- 3. Tabela: źródła / literatura do artykułu
create table if not exists public.article_sources (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  author text,
  title text,
  year int,
  publisher_or_journal text,
  doi text,
  url text,
  source_type text,
  reading_status text not null default 'do_przeczytania',
  notes text,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.articles enable row level security;
alter table public.article_versions enable row level security;
alter table public.article_sources enable row level security;

-- Polityki: na razie panel jest jednoosobowy, więc każdy zalogowany
-- (auth.role() = 'authenticated') ma pełny dostęp do wszystkich operacji.
-- DO ROZBUDOWY: gdy dojdą kolejni użytkownicy, zawęzić do
-- auth.uid() = created_by (na wzór article_ideas/trips w schema.sql).

create policy "articles_all_authenticated"
  on public.articles for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "article_versions_all_authenticated"
  on public.article_versions for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "article_sources_all_authenticated"
  on public.article_sources for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
