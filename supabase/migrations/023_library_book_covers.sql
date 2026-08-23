-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
--
-- Dodaje opcjonalne pole okładki do już istniejącej tabeli library_books
-- (migracja 022) — uproszczony widok Biblioteki pokazuje małą miniaturę
-- okładki przy każdej pozycji. URL pochodzi z automatycznego wyszukiwania
-- Google Books (miniatury books.google.com / books.googleusercontent.com,
-- zawsze wymuszane na HTTPS przed zapisem po stronie aplikacji — patrz
-- src/lib/lab/library-isbn-lookup.ts) albo z ręcznego wyboru użytkownika
-- spośród kilku znalezionych wariantów.
--
-- Wolny tekst (bez CHECK na format URL) — tak samo jak pola typu "link" w
-- innych tabelach tego projektu (np. accommodations.link, migracja 020),
-- walidacja formatu zostaje w warstwie aplikacji.
--
-- Idempotentna: "add column if not exists". Bez DROP/DELETE/TRUNCATE, bez
-- zmian innych kolumn, bez wpływu na istniejące RLS (nowa kolumna jest
-- automatycznie objęta już istniejącymi politykami row-level).

alter table public.library_books
  add column if not exists cover_url text;
