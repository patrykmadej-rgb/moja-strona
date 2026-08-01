import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runCalendarSync } from "@/lib/szkola/calendarSync";

/**
 * Cotygodniowa automatyczna synchronizacja (Vercel Cron -> vercel.json).
 * Wymaga zmiennej środowiskowej CRON_SECRET. Vercel automatycznie dołącza
 * nagłówek `Authorization: Bearer <CRON_SECRET>` przy wywołaniach z crona,
 * gdy ta zmienna jest ustawiona w projekcie — więc wystarczy porównać.
 * Bez skonfigurowanego CRON_SECRET endpoint odmawia wykonania każdemu
 * żądaniu (deny-by-default), żeby nikt nie mógł go wywołać anonimowo.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET nie jest skonfigurowany — synchronizacja zablokowana." },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: connections, error } = await admin
    .from("school_calendar_connections")
    .select("user_id, connection_type, sync_enabled, next_sync_at, calendar_id, encrypted_ics_url")
    .eq("provider", "google")
    .eq("sync_enabled", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Połączenie musi mieć faktycznie skonfigurowane źródło danych: kalendarz
  // Google wybrany (calendar_id) dla connection_type='google_oauth', albo
  // zapisany link ICS (encrypted_ics_url) dla connection_type='ics_url'.
  const configured = (connections ?? []).filter((c) =>
    c.connection_type === "google_oauth" ? Boolean(c.calendar_id) : Boolean(c.encrypted_ics_url),
  );
  const due = configured.filter((c) => !c.next_sync_at || new Date(c.next_sync_at).getTime() <= Date.now());

  const results: { userId: string; status: "success" | "error"; message?: string }[] = [];
  for (const connection of due) {
    try {
      await runCalendarSync(connection.user_id, "scheduled");
      results.push({ userId: connection.user_id, status: "success" });
    } catch (err) {
      results.push({
        userId: connection.user_id,
        status: "error",
        message: err instanceof Error ? err.message : "Nieznany błąd.",
      });
    }
  }

  return NextResponse.json({ checked: due.length, results });
}
