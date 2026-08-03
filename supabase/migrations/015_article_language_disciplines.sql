-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
-- Język jako pojedynczy wybór (pl/en) i dyscypliny jako wybór wielokrotny
-- dla artykułów naukowych w module /lab.
--
-- W pełni addytywna: nowe kolumny obok istniejących `language`/`discipline`,
-- które ZOSTAJĄ NIETKNIĘTE (nie DROP COLUMN) — aplikacja przestaje ich
-- używać, ale dane pozostają w bazie do ewentualnego wglądu/rollbacku.
-- Bez DELETE FROM, bez TRUNCATE — żaden artykuł nie jest usuwany.
--
-- Stan realnych danych sprawdzony przed napisaniem tej migracji (REST API):
--
-- articles.language (21 wierszy): NULL (14), 'polski' (5), 'angielski' (2)
--   -> wszystko jednoznacznie mapowalne, zero nieznanych wartości.
--
-- articles.discipline (21 wierszy): NULL (15), 'nauki psychologiczne' (2),
--   'Nauki o polityce, Nauki o bezpieczeństwie' (2, wartość łączona —
--   rozbijana na dwa elementy tablicy), 'nauki o polityce' (1),
--   'Nauki o polityce' (1) -> wszystko jednoznacznie mapowalne.
--
-- Dla obu kolumn: NULL/puste pozostaje NULL/puste (nieustawione), nie
-- zgadujemy wartości domyślnej za użytkownika — wymóg "język wymagany"
-- obowiązuje w formularzu dla nowych zapisów, nie jest wymuszany wstecznie
-- na starych wierszach.

-- 1. Nowe kolumny.
alter table public.articles
  add column if not exists language_code text,
  add column if not exists disciplines text[] not null default '{}';

-- 2. Migracja language -> language_code (case-insensitive, po trim).
update public.articles
  set language_code = 'pl'
  where language_code is null
    and lower(trim(language)) in ('polski', 'pl');

update public.articles
  set language_code = 'en'
  where language_code is null
    and lower(trim(language)) in ('angielski', 'en', 'english');

-- 3. Migracja discipline -> disciplines (rozbicie wartości łączonych po
-- przecinku, mapowanie każdego fragmentu osobno, deduplikacja). Fragmenty,
-- których nie da się jednoznacznie zmapować, NIE są zgadywane — zostają
-- pominięte (artykuł zostaje z pustą tablicą disciplines, stara wartość
-- w `discipline` jest zachowana do ręcznego przejrzenia) i zalogowane
-- przez RAISE NOTICE w wyniku wykonania tego bloku.
do $$
declare
  rec record;
  fragment text;
  fragments text[];
  mapped text[];
begin
  for rec in
    select id, discipline from public.articles
    where discipline is not null and trim(discipline) <> ''
  loop
    fragments := string_to_array(rec.discipline, ',');
    mapped := '{}';
    foreach fragment in array fragments loop
      fragment := lower(trim(fragment));
      if fragment in ('nauki o polityce', 'nauki polityczne', 'politologia') then
        mapped := array_append(mapped, 'political_science');
      elsif fragment in ('nauki o bezpieczeństwie', 'bezpieczeństwo') then
        mapped := array_append(mapped, 'security_studies');
      elsif fragment in ('nauki psychologiczne', 'psychologia') then
        mapped := array_append(mapped, 'psychology');
      elsif fragment in ('nauki prawne', 'prawo') then
        mapped := array_append(mapped, 'legal_science');
      elsif fragment <> '' then
        raise notice 'Nierozpoznana dyscyplina dla artykułu % — pozostawiono bez zmian: %', rec.id, fragment;
      end if;
    end loop;

    if array_length(mapped, 1) > 0 then
      update public.articles
        set disciplines = (select array_agg(distinct x) from unnest(mapped) x)
        where id = rec.id;
    end if;
  end loop;
end $$;

-- 4. CHECK constrainty dla nowych kolumn.
alter table public.articles drop constraint if exists articles_language_code_check;
alter table public.articles
  add constraint articles_language_code_check
  check (language_code is null or language_code in ('pl', 'en'));

alter table public.articles drop constraint if exists articles_disciplines_check;
alter table public.articles
  add constraint articles_disciplines_check
  check (disciplines <@ array['political_science', 'security_studies', 'psychology', 'legal_science']::text[]);
