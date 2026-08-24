-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
--
-- Zakres 6 briefu ("ręczne dodanie okładki"): pozwala uploadować własne
-- zdjęcie okładki (z galerii albo aparatu) do prywatnego Supabase Storage,
-- zamiast wyłącznie zewnętrznego URL-a (Google Books/Open Library, patrz
-- migracja 023).
--
-- Bucket "library-covers" NIE jest tworzony tutaj (wzorzec identyczny jak
-- migracje 008/012 dla school-materials/school-documents/school-imports) —
-- trzeba go założyć RĘCZNIE w Supabase Dashboard -> Storage jako PRYWATNY,
-- ten plik dokłada tylko kolumnę i polityki RLS. Pierwszy segment ścieżki
-- obiektu musi być równy auth.uid() właściciela — kod aplikacji
-- (src/lib/lab/libraryCoverStorage.ts) zapisuje pliki pod ścieżką
-- "{user_id}/{book_id}-{timestamp}.jpg", więc
-- (storage.foldername(name))[1] = auth.uid()::text jest zgodne z faktyczną
-- strukturą ścieżek.
--
-- cover_storage_path (nie cover_url — migracja 023) bo bucket jest
-- prywatny: trwały URL nie istnieje, trzeba za każdym razem generować
-- podpisany, krótkotrwały odczyt (createSignedUrl, 300s — dokładnie ten
-- sam wzorzec co article_versions.file_path +
-- getArticleVersionDownloadUrl). Gdy cover_storage_path jest ustawione,
-- ma pierwszeństwo przed cover_url (aplikacja rozwiązuje to po stronie
-- serwera przy renderze listy, src/app/lab/biblioteka/page.tsx).
--
-- Idempotentna: "add column if not exists", "drop policy if exists" przed
-- każdym "create policy" — bezpieczna do wielokrotnego uruchomienia. Bez
-- DROP TABLE/DELETE/TRUNCATE, bez zmian innych kolumn.

alter table public.library_books
  add column if not exists cover_storage_path text;

drop policy if exists "library_covers_select_own" on storage.objects;
create policy "library_covers_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'library-covers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "library_covers_insert_own" on storage.objects;
create policy "library_covers_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'library-covers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "library_covers_update_own" on storage.objects;
create policy "library_covers_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'library-covers' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'library-covers' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "library_covers_delete_own" on storage.objects;
create policy "library_covers_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'library-covers' and (storage.foldername(name))[1] = auth.uid()::text);
