-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
-- Polityki Storage dla bucketów school-materials i school-documents
-- (ETAP 3 modułu Szkoła psychoterapii). Buckety utworzone ręcznie w
-- Dashboardzie jako PRYWATNE — ten plik dokłada tylko polityki RLS,
-- nie tworzy bucketów (insert into storage.buckets nieużywany celowo).
--
-- Wzorzec identyczny jak dla istniejącego prywatnego bucketu "documents"
-- w supabase/schema.sql: pierwszy segment ścieżki musi być równy
-- auth.uid() właściciela. Kod aplikacji (materialsStorage.ts,
-- documentsStorage.ts) zapisuje pliki pod ścieżką
-- "{user_id}/{session_id}/materials|documents/{timestamp}-{filename}",
-- więc (storage.foldername(name))[1] = auth.uid()::text jest zgodne
-- z faktyczną strukturą ścieżek.
--
-- Idempotentne (drop policy if exists przed każdym create policy),
-- bezpieczne do wielokrotnego uruchomienia. Brak dostępu publicznego,
-- brak service role key po stronie klienta — wszystko wymuszane przez RLS.

-- 1. school-materials
drop policy if exists "school_materials_select_own" on storage.objects;
create policy "school_materials_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'school-materials' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "school_materials_insert_own" on storage.objects;
create policy "school_materials_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'school-materials' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "school_materials_update_own" on storage.objects;
create policy "school_materials_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'school-materials' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'school-materials' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "school_materials_delete_own" on storage.objects;
create policy "school_materials_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'school-materials' and (storage.foldername(name))[1] = auth.uid()::text);

-- 2. school-documents
drop policy if exists "school_documents_select_own" on storage.objects;
create policy "school_documents_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'school-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "school_documents_insert_own" on storage.objects;
create policy "school_documents_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'school-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "school_documents_update_own" on storage.objects;
create policy "school_documents_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'school-documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'school-documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "school_documents_delete_own" on storage.objects;
create policy "school_documents_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'school-documents' and (storage.foldername(name))[1] = auth.uid()::text);
