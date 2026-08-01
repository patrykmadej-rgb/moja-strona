-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
-- ETAP 3 modułu Szkoła psychoterapii: plan zajęć, materiały, dokumenty,
-- godziny szkoleniowe + konfigurowalne wymagania godzinowe.
--
-- W pełni addytywna i bezpieczna do wielokrotnego uruchomienia. Tabele
-- session_schedule_items, session_materials, session_documents i
-- training_hours_entries JUŻ ISTNIEJĄ (migracja 005) — ta migracja
-- tylko dokłada brakujące kolumny/indeksy/constrainty przez
-- ADD COLUMN IF NOT EXISTS, nie tworzy ich od nowa i nie usuwa
-- żadnych istniejących kolumn ani danych.
--
-- Świadome decyzje nazewnicze (żeby nie duplikować kolumn o tym samym
-- znaczeniu pod dwiema nazwami):
--   - "prowadzący" wszędzie jako `trainer` (spójnie z lead_trainer
--     w school_sessions i już istniejącym training_hours_entries.trainer),
--     nie `instructor`.
--   - session_materials.name pełni rolę nazwy pliku (file_name),
--     .file_type = mime_type, .external_link = external_url,
--     .author = "kto dostarczył materiał", .related_schedule_item_id
--     = powiązanie z punktem planu, .created_at = added_at.
--   - session_documents.name = tytuł/nazwa pliku, .doc_type =
--     document_type, .document_date = issue_date, .created_at =
--     uploaded_at. Nowy generyczny related_entity_type/related_entity_id
--     zastępuje/uzupełnia dawne wąskie travel_segment_id/
--     accommodation_id/payment_id (te zostają nietknięte, tylko
--     nieużywane przez nowy kod).

-- 1. Plan zajęć — brakujące kolumny + walidacja typu zajęć.
alter table public.session_schedule_items
  add column if not exists updated_at timestamptz not null default now();

alter table public.session_schedule_items
  drop constraint if exists session_schedule_items_activity_type_check;
alter table public.session_schedule_items
  add constraint session_schedule_items_activity_type_check
  check (activity_type is null or activity_type in (
    'teoria', 'doswiadczenie_wlasne', 'superwizja', 'warsztat',
    'praktyka', 'wyklad', 'cwiczenia', 'seminarium', 'inne'
  ));

create index if not exists session_schedule_items_session_id_idx
  on public.session_schedule_items (session_id);

-- 2. Materiały ze zjazdu — brakujące kolumny + kategorie + typ materiału.
alter table public.session_materials
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists material_type text not null default 'plik',
  add column if not exists added_by uuid references auth.users (id),
  add column if not exists sort_order int not null default 0,
  add column if not exists updated_at timestamptz not null default now();

alter table public.session_materials
  drop constraint if exists session_materials_category_check;
alter table public.session_materials
  add constraint session_materials_category_check
  check (category is null or category in (
    'program_zjazdu', 'prezentacje', 'literatura', 'zdjecia_tablicy',
    'zadania', 'notatki_wlasne', 'materialy_prowadzacego', 'inne'
  ));

alter table public.session_materials
  drop constraint if exists session_materials_material_type_check;
alter table public.session_materials
  add constraint session_materials_material_type_check
  check (material_type in ('plik', 'link', 'notatka'));

create index if not exists session_materials_session_id_idx
  on public.session_materials (session_id);
create index if not exists session_materials_category_idx
  on public.session_materials (category);

-- 3. Dokumenty — brakujące kolumny + generyczne powiązanie z dowolnym
-- powiązanym rekordem (podróż/nocleg/płatność/wydatek/plan/zjazd/inne).
alter table public.session_documents
  add column if not exists title text,
  add column if not exists mime_type text,
  add column if not exists related_entity_type text,
  add column if not exists related_entity_id uuid,
  add column if not exists uploaded_by uuid references auth.users (id),
  add column if not exists updated_at timestamptz not null default now();

alter table public.session_documents
  drop constraint if exists session_documents_related_entity_type_check;
alter table public.session_documents
  add constraint session_documents_related_entity_type_check
  check (related_entity_type is null or related_entity_type in (
    'travel_segment', 'accommodation', 'school_payment', 'expense',
    'schedule_item', 'session', 'other'
  ));

-- doc_type poszerzony o formalne typy z ETAPU 3 (umowa, paragon).
alter table public.session_documents
  drop constraint if exists session_documents_doc_type_check;
alter table public.session_documents
  add constraint session_documents_doc_type_check
  check (doc_type in (
    'bilet', 'rezerwacja', 'faktura', 'paragon', 'potwierdzenie_platnosci',
    'harmonogram', 'zaswiadczenie', 'certyfikat', 'zgoda', 'umowa', 'inne'
  ));

create index if not exists session_documents_session_id_idx
  on public.session_documents (session_id);

-- 4. Godziny szkoleniowe — brakująca data wpisu i powiązanie z planem.
alter table public.training_hours_entries
  add column if not exists entry_date date,
  add column if not exists schedule_item_id uuid
    references public.session_schedule_items (id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

-- Migracja danych PRZED zaostrzeniem constraintu: stara wartość 'praktyka'
-- (dozwolona w migracji 005) jest tu przemianowywana na 'praktyka_kliniczna'
-- (nowa nazwa kategorii w ETAPIE 3). Bez tego kroku istniejące wiersze z
-- category = 'praktyka' złamałyby poniższy, zawężony constraint. Idempotentne
-- — przy ponownym uruchomieniu nie dotyczy już żadnego wiersza.
update public.training_hours_entries
  set category = 'praktyka_kliniczna'
  where category = 'praktyka';

alter table public.training_hours_entries
  drop constraint if exists training_hours_entries_category_check;
alter table public.training_hours_entries
  add constraint training_hours_entries_category_check
  check (category in (
    'teoria', 'doswiadczenie_wlasne', 'superwizja', 'praktyka_kliniczna',
    'warsztat', 'terapia_wlasna', 'inne'
  ));

create index if not exists training_hours_entries_session_id_idx
  on public.training_hours_entries (session_id);
create index if not exists training_hours_entries_category_idx
  on public.training_hours_entries (category);

-- 5. Konfigurowalne wymagania godzinowe (nowa tabela) — zamiast
-- twardo wpisanych limitów w kodzie aplikacji.
create table if not exists public.training_hour_requirements (
  id uuid primary key default gen_random_uuid(),
  category text not null unique
    check (category in (
      'teoria', 'doswiadczenie_wlasne', 'superwizja', 'praktyka_kliniczna',
      'warsztat', 'terapia_wlasna', 'inne'
    )),
  required_hours numeric(7, 2) not null default 0,
  label text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Startowe rekordy z required_hours = 0 — użytkownik uzupełnia realne
-- wymagania w UI, nic nie jest zgadywane ani zapisane na stałe w kodzie.
insert into public.training_hour_requirements (category, required_hours, label, sort_order)
values
  ('teoria', 0, 'Teoria', 1),
  ('doswiadczenie_wlasne', 0, 'Doświadczenie własne', 2),
  ('superwizja', 0, 'Superwizja', 3),
  ('praktyka_kliniczna', 0, 'Praktyka kliniczna', 4),
  ('warsztat', 0, 'Warsztat', 5),
  ('terapia_wlasna', 0, 'Terapia własna', 6),
  ('inne', 0, 'Inne', 7)
on conflict (category) do nothing;

alter table public.training_hour_requirements enable row level security;
drop policy if exists "training_hour_requirements_all_authenticated" on public.training_hour_requirements;
create policy "training_hour_requirements_all_authenticated" on public.training_hour_requirements for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
