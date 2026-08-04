-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
-- Dodaje wsparcie dla OCR skanowanych PDF-ów/obrazów w skrzynce importu
-- (public.import_inbox_items, migracje 005 + 011) — fallback, gdy zwykły
-- parser PDF nie znajdzie warstwy tekstowej.
--
-- W pełni addytywna: same nowe, opcjonalne kolumny z osobnymi CHECK
-- constraintami. Bez DROP TABLE/COLUMN, bez DELETE/TRUNCATE, bez zmiany
-- istniejących wartości/constraintów status/detected_type z migracji 011.
-- RLS bez zmian — nowe kolumny dziedziczą istniejącą politykę na poziomie
-- tabeli (import_inbox_items_all_authenticated, migracja 005).
--
-- Nie duplikujemy `raw_text` — tekst z OCR (tak samo jak z warstwy PDF-a)
-- ląduje w tym samym istniejącym polu; `extraction_method` mówi tylko,
-- SKĄD ten tekst pochodzi.
--
-- Idempotentna: "add column if not exists" + "drop constraint if exists"
-- przed ponownym założeniem, bezpieczna do wielokrotnego uruchomienia.

alter table public.import_inbox_items
  add column if not exists extraction_method text,
  add column if not exists ocr_status text,
  add column if not exists ocr_confidence numeric(5, 2),
  add column if not exists ocr_pages_processed integer,
  add column if not exists ocr_warnings jsonb not null default '[]'::jsonb,
  add column if not exists processing_stage text,
  add column if not exists processed_at timestamptz;

alter table public.import_inbox_items drop constraint if exists import_inbox_items_extraction_method_check;
alter table public.import_inbox_items
  add constraint import_inbox_items_extraction_method_check
  check (extraction_method is null or extraction_method in ('text_layer', 'ocr', 'manual', 'none'));

alter table public.import_inbox_items drop constraint if exists import_inbox_items_ocr_status_check;
alter table public.import_inbox_items
  add constraint import_inbox_items_ocr_status_check
  check (ocr_status is null or ocr_status in ('not_needed', 'pending', 'processing', 'completed', 'partial', 'failed'));

create index if not exists import_inbox_items_ocr_status_idx on public.import_inbox_items (ocr_status);
