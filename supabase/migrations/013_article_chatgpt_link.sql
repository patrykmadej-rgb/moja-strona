-- Uruchom ten plik w Supabase: Dashboard -> SQL Editor -> New query -> wklej i "Run".
-- Dodaje możliwość przypięcia do artykułu linku do powiązanej rozmowy ChatGPT.
-- W pełni addytywna: jedna nowa, nullowalna kolumna, bez DROP/DELETE/TRUNCATE.

alter table public.articles
  add column if not exists chatgpt_link text;
