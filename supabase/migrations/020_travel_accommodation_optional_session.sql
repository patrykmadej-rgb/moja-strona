-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
--
-- Pozwala dodawać odcinki podróży i zakwaterowanie BEZ zjazdu z poziomu
-- ogólnych zakładek /lab/szkola/podroze i /lab/szkola/zakwaterowanie —
-- rekord zapisuje się od razu, a powiązanie ze zjazdem (sugerowane
-- automatycznie, zawsze potwierdzane ręcznie) można dodać później.
--
-- Sprawdzone przed napisaniem tej migracji (migracja 005): oba klucze obce
-- były NOT NULL (accommodations.session_id wprost; travel_segments nie miał
-- w ogóle bezpośredniego session_id, tylko pośrednio przez itinerary_id ->
-- travel_itineraries.session_id, też NOT NULL) — migracja jest więc
-- potrzebna.
--
-- W pełni addytywna: nowa nullable kolumna (accommodations.city), poluzowanie
-- NOT NULL (nie zmienia istniejących wartości), zmiana akcji ON DELETE z
-- CASCADE na SET NULL (dotyczy tylko przyszłych usunięć zjazdów, nie rusza
-- istniejących danych), backfill UPDATE (wyłącznie wypełnia nową kolumnę na
-- podstawie już istniejącej relacji, nic nie usuwa/nadpisuje ręcznie
-- wpisanych wartości). Bez DROP TABLE/COLUMN, bez DELETE/TRUNCATE.
--
-- Idempotentna: "add column if not exists", "drop constraint if exists"
-- przed ponownym założeniem, `where session_id is null` w backfillu —
-- bezpieczna do wielokrotnego uruchomienia.

-- --- accommodations: session_id nullable + ON DELETE SET NULL + miasto ---

-- city + notes: sekcja 3 briefu wymaga obu pól dla zakwaterowania, żadne nie
-- istniało w migracji 005.
alter table public.accommodations
  add column if not exists city text,
  add column if not exists notes text;

alter table public.accommodations alter column session_id drop not null;

alter table public.accommodations drop constraint if exists accommodations_session_id_fkey;
alter table public.accommodations
  add constraint accommodations_session_id_fkey
  foreign key (session_id) references public.school_sessions (id) on delete set null;

create index if not exists accommodations_session_id_idx on public.accommodations (session_id);

-- --- travel_segments: session_id bezpośrednio na odcinku (niezależnie od   ---
-- --- itinerary_id), itinerary_id staje się opcjonalne dla nieprzypisanych ---

-- session_id: bezpośrednie powiązanie ze zjazdem, niezależne od itinerary_id.
-- notes: sekcja 2 briefu, nie istniało w migracji 005.
alter table public.travel_segments
  add column if not exists session_id uuid references public.school_sessions (id) on delete set null,
  add column if not exists notes text;

alter table public.travel_segments alter column itinerary_id drop not null;

-- Sekcja 2 briefu: kierunek rozszerzony o "lokalny" (przejazd lokalny) i
-- "inny" — było tylko "tam"/"powrot" (migracja 005). Nazwa ograniczenia to
-- domyślna, automatycznie nadana przez Postgres dla inline CHECK
-- (kolumna_check), ten sam wzorzec co w migracji 018.
alter table public.travel_segments drop constraint if exists travel_segments_direction_check;
alter table public.travel_segments
  add constraint travel_segments_direction_check
  check (direction is null or direction in ('tam', 'powrot', 'lokalny', 'inny'));

create index if not exists travel_segments_session_id_idx on public.travel_segments (session_id);

-- Backfill: istniejące odcinki mają dziś powiązanie WYŁĄCZNIE przez
-- itinerary_id -> travel_itineraries.session_id — bez tego od razu
-- wyglądałyby jak "nieprzypisane" w nowym ogólnym widoku /lab/szkola/podroze,
-- mimo że w rzeczywistości należą do konkretnego zjazdu.
update public.travel_segments ts
set session_id = ti.session_id
from public.travel_itineraries ti
where ts.itinerary_id = ti.id
  and ts.session_id is null;
