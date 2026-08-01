-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
-- Polityki Storage dla nowego bucketu school-imports (ETAP 5 modułu
-- Szkoła psychoterapii — skrzynka importu rezerwacji/dokumentów).
--
-- WYMAGA RĘCZNEGO UTWORZENIA BUCKETU w Supabase Dashboard -> Storage:
--   nazwa: school-imports
--   Public: NIE (prywatny)
-- Ten plik tylko dokłada polityki RLS, nie tworzy bucketu (insert into
-- storage.buckets celowo nieużywany — zgodnie z tą samą zasadą co przy
-- school-materials/school-documents w migracji 008).
--
-- Osobny bucket od school-documents/school-materials: pliki z importu
-- (przed weryfikacją, mogą zostać odrzucone) mają inny cykl życia niż
-- zatwierdzone dokumenty zjazdu — nie powinny się mieszać z materiałami
-- ani z dokumentami podróży (ta sama zasada, co przy oddzieleniu
-- school-materials od school-documents w ETAPIE 3).
--
-- Ścieżka: "{user_id}/imports/{rok}/{miesiąc}/{timestamp}-{filename}" —
-- pierwszy segment ścieżki musi być równy auth.uid() właściciela, ten sam
-- wzorzec co w migracji 008.

drop policy if exists "school_imports_select_own" on storage.objects;
create policy "school_imports_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'school-imports' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "school_imports_insert_own" on storage.objects;
create policy "school_imports_insert_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'school-imports' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "school_imports_update_own" on storage.objects;
create policy "school_imports_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'school-imports' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'school-imports' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "school_imports_delete_own" on storage.objects;
create policy "school_imports_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'school-imports' and (storage.foldername(name))[1] = auth.uid()::text);
