create table if not exists article_files (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  file_size bigint,
  file_type text,
  created_at timestamptz not null default now()
);

alter table article_files enable row level security;

create policy "authenticated full access to article_files"
on article_files
for all
to authenticated
using (true)
with check (true);
