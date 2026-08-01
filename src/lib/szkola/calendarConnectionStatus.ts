import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CalendarConnectionSummary } from "@/lib/szkola/types";

const SAFE_CONNECTION_COLUMNS =
  "id, connection_type, calendar_id, calendar_name, calendar_color, masked_ics_url, sync_enabled, sync_frequency, last_synced_at, next_sync_at, last_successful_fetch_at, last_http_status, last_error, created_at";

export type CalendarConnectionLookup = {
  connection: CalendarConnectionSummary | null;
  /** false tylko gdy brakuje SUPABASE_SERVICE_ROLE_KEY (lub klient się nie utworzył) — nie mylić z "brak zapisanego połączenia". */
  adminConfigured: boolean;
};

/**
 * Bezpiecznie pobiera stan połączenia kalendarza — NIGDY nie rzuca wyjątku.
 * Brak SUPABASE_SERVICE_ROLE_KEY, brak tabeli (migracja 009/010 jeszcze
 * nieuruchomiona), błąd zapytania albo brak wiersza zawsze kończy się
 * bezpiecznym `{ connection: null, ... }`, nigdy awarią renderowania
 * strony. Używane przez /lab/szkola i /lab/szkola/kalendarz.
 */
export async function getCalendarConnectionSummary(userId: string): Promise<CalendarConnectionLookup> {
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return { connection: null, adminConfigured: false };
  }

  try {
    const { data, error } = await admin
      .from("school_calendar_connections")
      .select(SAFE_CONNECTION_COLUMNS)
      .eq("user_id", userId)
      .eq("provider", "google")
      .maybeSingle();

    if (error) return { connection: null, adminConfigured: true };
    return { connection: (data as CalendarConnectionSummary | null) ?? null, adminConfigured: true };
  } catch {
    return { connection: null, adminConfigured: true };
  }
}

/** Czy połączenie ma faktycznie skonfigurowane źródło danych (nie tylko wiersz w tabeli). */
export function isCalendarConnectionActive(connection: CalendarConnectionSummary | null): boolean {
  if (!connection) return false;
  return connection.connection_type === "ics_url" ? Boolean(connection.masked_ics_url) : Boolean(connection.calendar_id);
}
