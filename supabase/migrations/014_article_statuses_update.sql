-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
-- Zmiana systemu statusów artykułów naukowych (public.articles.status).
--
-- articles.status to zwykła kolumna text z CHECK constraintem (nie enum
-- PostgreSQL) — zdefiniowana w migracji 001_lab_schema.sql:
--   status text not null default 'pomysl'
--     check (status in ('pomysl','pisanie','do_wyslania','w_redakcji',
--                        'recenzja','poprawki','przyjety','opublikowany'))
--
-- Stan realnych danych sprawdzony przed napisaniem tej migracji (REST API):
-- wyłącznie 'pomysl' (18 wierszy) i 'w_redakcji' (3 wiersze) — żadnych
-- innych/nieoczekiwanych wartości.
--
-- Kolejność jest tu istotna: najpierw usuwamy STARY constraint (żeby
-- poniższe UPDATE mogły zapisać nowe wartości, które nie mieszczą się w
-- starym zbiorze dozwolonych stringów), dopiero potem remapujemy dane,
-- na końcu zakładamy NOWY, węższy constraint. Zrobienie UPDATE przed
-- usunięciem starego constraintu skończyłoby się błędem walidacji przy
-- istniejących wierszach (w przeciwieństwie do migracji 011, gdzie
-- tabela była w praktyce pusta).
--
-- Mapowanie stary -> nowy (zgodnie ze specyfikacją):
--   pomysl        -> idea
--   pisanie       -> first_version
--   do_wyslania   -> ready_to_submit
--   w_redakcji    -> submitted
--   recenzja      -> post_review_revisions
--   poprawki      -> revisions
--   przyjety      -> in_publication
--   opublikowany  -> published
--
-- Bez DROP TABLE/COLUMN, bez DELETE/TRUNCATE — żaden artykuł nie jest usuwany.

-- 1. Usuń stary, teraz zbyt wąski constraint — znajdujemy go dynamicznie
-- po definicji (nie tylko po domyślnej nazwie articles_status_check), żeby
-- nie polegać na założeniu co do nazwy nadanej automatycznie przez Postgres.
do $$
declare
  found_constraint text;
begin
  select conname into found_constraint
  from pg_constraint
  where conrelid = 'public.articles'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status%';

  if found_constraint is not null then
    execute format('alter table public.articles drop constraint %I', found_constraint);
  end if;
end $$;

-- 2. Zremapuj istniejące wartości na nowy słownik.
update public.articles set status = 'idea' where status = 'pomysl';
update public.articles set status = 'first_version' where status = 'pisanie';
update public.articles set status = 'ready_to_submit' where status = 'do_wyslania';
update public.articles set status = 'submitted' where status = 'w_redakcji';
update public.articles set status = 'post_review_revisions' where status = 'recenzja';
update public.articles set status = 'revisions' where status = 'poprawki';
update public.articles set status = 'in_publication' where status = 'przyjety';
update public.articles set status = 'published' where status = 'opublikowany';

-- 3. Nowy, docelowy zestaw dozwolonych wartości.
alter table public.articles
  add constraint articles_status_check
  check (status in (
    'idea', 'first_version', 'revisions', 'final_version', 'ready_to_submit',
    'submitted', 'post_review_revisions', 'in_publication', 'published'
  ));

-- 4. Nowy domyślny status dla przyszłych artykułów.
alter table public.articles alter column status set default 'idea';
