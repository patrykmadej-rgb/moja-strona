import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Klient Supabase z kluczem service_role — pomija RLS całkowicie.
 *
 * UŻYWAJ WYŁĄCZNIE z Route Handlerów / Server Actions, i wyłącznie dla
 * tabeli school_calendar_connections (jedynej, która celowo nie ma żadnej
 * polityki RLS dla ról anon/authenticated — patrz komentarz w migracji
 * 009_school_calendar_sync.sql). Import "server-only" na górze pliku
 * powoduje błąd builda, jeśli ten moduł trafi choćby pośrednio do bundla
 * klienckiego.
 *
 * Wymaga zmiennej środowiskowej SUPABASE_SERVICE_ROLE_KEY (NIE
 * NEXT_PUBLIC_ — inaczej trafiłaby do przeglądarki). Klucz znajdziesz w
 * Supabase Dashboard -> Settings -> API -> service_role secret.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Brak SUPABASE_SERVICE_ROLE_KEY (lub NEXT_PUBLIC_SUPABASE_URL) w zmiennych środowiskowych — integracja z Google Calendar wymaga konfiguracji.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
