"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidAccessToken, runCalendarSync, type SyncResult } from "@/lib/szkola/calendarSync";
import { listGoogleCalendars, revokeGoogleToken } from "@/lib/szkola/googleCalendar";
import { fetchIcsFeed, parseIcsEvents } from "@/lib/szkola/icsCalendar";
import { normalizeIcsUrl, maskIcsUrl } from "@/lib/szkola/urlSafety";
import { decryptToken, encryptToken } from "@/lib/szkola/calendarCrypto";
import { DEFAULT_SESSION_CHECKLIST, DEFAULT_CALENDAR_SETTINGS } from "@/lib/szkola/types";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");
  return user.id;
}

export async function listAvailableCalendars() {
  const userId = await requireUserId();
  const admin = createAdminClient();

  const { data: connection, error } = await admin
    .from("school_calendar_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!connection) throw new Error("Kalendarz nie jest połączony.");

  const accessToken = await getValidAccessToken(admin, connection);
  return listGoogleCalendars(accessToken);
}

export async function selectCalendar(formData: FormData) {
  const userId = await requireUserId();
  const calendarId = String(formData.get("calendar_id") ?? "").trim();
  const calendarName = String(formData.get("calendar_name") ?? "").trim();
  const calendarColor = String(formData.get("calendar_color") ?? "").trim() || null;
  if (!calendarId) throw new Error("Wybierz kalendarz.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("school_calendar_connections")
    .update({
      calendar_id: calendarId,
      calendar_name: calendarName || calendarId,
      calendar_color: calendarColor,
      sync_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("provider", "google");
  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/kalendarz");

  try {
    await runCalendarSync(userId, "initial");
  } catch {
    // Błąd pierwszej synchronizacji zostaje zapisany w school_calendar_sync_runs
    // i widoczny na stronie /lab/szkola/kalendarz — samo wybranie kalendarza się udało.
  }
  revalidatePath("/lab/szkola/kalendarz");
}

export type ConnectIcsResult = {
  eventsFound: number;
  nearestEventTitle: string | null;
  nearestEventAt: string | null;
  syncedAt: string;
};

/**
 * Podstawowy, domyślny sposób połączenia kalendarza: prywatny link
 * subskrypcji ICS (żadnego Google OAuth). Testuje połączenie PRZED
 * zapisaniem — jeśli pierwsze pobranie się nie powiedzie, konfiguracja
 * w ogóle nie zostaje zapisana jako aktywna (sekcja 4 specyfikacji).
 */
export async function connectIcsCalendar(formData: FormData): Promise<ConnectIcsResult> {
  const userId = await requireUserId();

  const name = String(formData.get("calendar_name") ?? "").trim();
  const rawUrl = String(formData.get("ics_url") ?? "").trim();
  const timezone = String(formData.get("default_timezone") ?? "").trim() || DEFAULT_CALENDAR_SETTINGS.default_timezone;
  const syncEnabled = formData.get("sync_enabled") === "on";

  if (!name) throw new Error("Nazwa kalendarza jest wymagana.");
  if (!rawUrl) throw new Error("Adres kalendarza jest wymagany.");

  const normalizedUrl = normalizeIcsUrl(rawUrl);

  const fetchResult = await fetchIcsFeed(normalizedUrl, {});
  if (fetchResult.status === "error") {
    throw new Error(fetchResult.errorMessage);
  }
  if (fetchResult.status === "not_modified") {
    throw new Error("Serwer nie zwrócił zawartości kalendarza. Spróbuj ponownie.");
  }

  const events = parseIcsEvents(fetchResult.body);
  const now = Date.now();
  const upcoming = events
    .filter((e) => e.status !== "cancelled" && e.start_at && new Date(e.start_at).getTime() >= now)
    .sort((a, b) => new Date(a.start_at!).getTime() - new Date(b.start_at!).getTime());
  const nearest = upcoming[0] ?? null;

  const admin = createAdminClient();
  const { error } = await admin.from("school_calendar_connections").upsert(
    {
      user_id: userId,
      provider: "google",
      connection_type: "ics_url",
      calendar_name: name,
      encrypted_ics_url: encryptToken(normalizedUrl),
      masked_ics_url: maskIcsUrl(normalizedUrl),
      etag: fetchResult.etag,
      last_modified: fetchResult.lastModified,
      last_successful_fetch_at: new Date().toISOString(),
      last_http_status: fetchResult.httpStatus,
      sync_enabled: syncEnabled,
      sync_frequency: "weekly",
      last_error: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" },
  );
  if (error) throw new Error(error.message);

  const supabase = await createClient();
  const { data: existingSettings } = await supabase
    .from("school_calendar_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  await supabase.from("school_calendar_settings").upsert(
    {
      user_id: userId,
      buffer_before_minutes: existingSettings?.buffer_before_minutes ?? DEFAULT_CALENDAR_SETTINGS.buffer_before_minutes,
      buffer_after_minutes: existingSettings?.buffer_after_minutes ?? DEFAULT_CALENDAR_SETTINGS.buffer_after_minutes,
      flight_buffer_minutes: existingSettings?.flight_buffer_minutes ?? DEFAULT_CALENDAR_SETTINGS.flight_buffer_minutes,
      train_buffer_minutes: existingSettings?.train_buffer_minutes ?? DEFAULT_CALENDAR_SETTINGS.train_buffer_minutes,
      default_timezone: timezone,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  revalidatePath("/lab/szkola/kalendarz");

  try {
    await runCalendarSync(userId, "initial");
  } catch {
    // Błąd pierwszej pełnej synchronizacji zostaje zapisany w
    // school_calendar_sync_runs i widoczny na stronie — samo połączenie
    // (test pobrania) już się powiodło, więc konfigurację zostawiamy zapisaną.
  }

  revalidatePath("/lab/szkola/kalendarz");
  revalidatePath("/lab/szkola/kalendarz/zmiany");
  revalidatePath("/lab/szkola");

  return {
    eventsFound: events.filter((e) => e.status !== "cancelled").length,
    nearestEventTitle: nearest?.title ?? null,
    nearestEventAt: nearest?.start_at ?? null,
    syncedAt: new Date().toISOString(),
  };
}

export async function toggleCalendarSync(formData: FormData) {
  const userId = await requireUserId();
  const enabled = String(formData.get("sync_enabled") ?? "") === "true";

  const admin = createAdminClient();
  const { error } = await admin
    .from("school_calendar_connections")
    .update({ sync_enabled: enabled, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("provider", "google");
  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/kalendarz");
}

export async function disconnectCalendar() {
  const userId = await requireUserId();
  const admin = createAdminClient();

  const { data: connection } = await admin
    .from("school_calendar_connections")
    .select("connection_type, refresh_token_encrypted")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();

  if (connection?.connection_type === "google_oauth" && connection.refresh_token_encrypted) {
    try {
      await revokeGoogleToken(decryptToken(connection.refresh_token_encrypted));
    } catch {
      // best-effort — brak możliwości odwołania tokenu nie blokuje rozłączenia lokalnego
    }
  }

  const { error } = await admin.from("school_calendar_connections").delete().eq("user_id", userId).eq("provider", "google");
  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/kalendarz");
  revalidatePath("/lab/szkola");
}

export async function runManualSync(): Promise<SyncResult> {
  const userId = await requireUserId();
  const result = await runCalendarSync(userId, "manual");
  revalidatePath("/lab/szkola/kalendarz");
  revalidatePath("/lab/szkola/kalendarz/zmiany");
  revalidatePath("/lab/szkola");
  return result;
}

export async function markChangeReviewed(formData: FormData) {
  await requireUserId();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase
    .from("school_calendar_changes")
    .update({ status: "reviewed", reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/lab/szkola/kalendarz/zmiany");
  revalidatePath("/lab/szkola");
}

export async function dismissChange(formData: FormData) {
  await requireUserId();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase
    .from("school_calendar_changes")
    .update({ status: "ignored", reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/lab/szkola/kalendarz/zmiany");
  revalidatePath("/lab/szkola");
}

/**
 * "Zastosuj zmianę": jeśli wydarzenie Google jest już zaimportowane jako
 * punkt planu zajęć (session_schedule_items.google_event_id), przenosi do
 * niego nowy stan (data/godziny/tytuł/lokalizacja). Jeśli nie — po prostu
 * potwierdza przejrzenie zmiany (dane w school_calendar_events są i tak
 * już aktualne od momentu synchronizacji).
 */
export async function applyChange(formData: FormData) {
  await requireUserId();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  const { data: change, error: changeError } = await supabase
    .from("school_calendar_changes")
    .select("*, calendar_event:school_calendar_events(*)")
    .eq("id", id)
    .single();
  if (changeError) throw new Error(changeError.message);

  const event = change.calendar_event as {
    google_event_id: string;
    title: string | null;
    location: string | null;
    start_at: string | null;
    end_at: string | null;
  } | null;

  if (event) {
    const { data: scheduleItem } = await supabase
      .from("session_schedule_items")
      .select("id")
      .eq("google_event_id", event.google_event_id)
      .maybeSingle();

    if (scheduleItem) {
      const startDate = event.start_at ? new Date(event.start_at) : null;
      const endDate = event.end_at ? new Date(event.end_at) : null;
      const { error: updateError } = await supabase
        .from("session_schedule_items")
        .update({
          item_date: startDate ? startDate.toISOString().slice(0, 10) : undefined,
          start_time: startDate ? startDate.toISOString().slice(11, 16) : undefined,
          end_time: endDate ? endDate.toISOString().slice(11, 16) : undefined,
          title: event.title ?? undefined,
          location: event.location ?? undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", scheduleItem.id);
      if (updateError) throw new Error(updateError.message);
    }
  }

  const { error } = await supabase
    .from("school_calendar_changes")
    .update({ status: "accepted", reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/kalendarz/zmiany");
  revalidatePath("/lab/szkola");
}

export async function assignEventToSession(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");

  const eventId = String(formData.get("event_id") ?? "");
  const sessionId = String(formData.get("session_id") ?? "").trim() || null;
  if (!eventId) throw new Error("Brak identyfikatora wydarzenia.");

  const { error } = await supabase.from("school_calendar_events").update({ session_id: sessionId }).eq("id", eventId);
  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/kalendarz");
  revalidatePath("/lab/szkola/kalendarz/zmiany");
}

export async function ignoreCalendarEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");

  const eventId = String(formData.get("event_id") ?? "");
  if (!eventId) throw new Error("Brak identyfikatora wydarzenia.");

  const { error } = await supabase.from("school_calendar_events").update({ ignored: true }).eq("id", eventId);
  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/kalendarz");
}

/** Importuje wydarzenie Google jako nowy punkt planu zajęć (session_schedule_items). */
export async function importScheduleItemFromEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");

  const eventId = String(formData.get("event_id") ?? "");
  const { data: event, error: eventError } = await supabase
    .from("school_calendar_events")
    .select("*")
    .eq("id", eventId)
    .single();
  if (eventError) throw new Error(eventError.message);
  if (!event.session_id) throw new Error("To wydarzenie nie jest jeszcze przypisane do zjazdu.");
  if (!event.start_at) throw new Error("Wydarzenie nie ma daty rozpoczęcia.");

  const start = new Date(event.start_at);
  const end = event.end_at ? new Date(event.end_at) : null;

  const { data: maxSortRow } = await supabase
    .from("session_schedule_items")
    .select("sort_order")
    .eq("session_id", event.session_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("session_schedule_items").insert({
    session_id: event.session_id,
    item_date: start.toISOString().slice(0, 10),
    start_time: event.all_day ? null : start.toISOString().slice(11, 16),
    end_time: event.all_day || !end ? null : end.toISOString().slice(11, 16),
    title: event.title ?? "Punkt planu z Google Calendar",
    location: event.location ?? null,
    source: "google_calendar",
    google_event_id: event.google_event_id,
    sort_order: (maxSortRow?.sort_order ?? -1) + 1,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${event.session_id}`);
  revalidatePath("/lab/szkola/kalendarz");
}

export async function createSessionFromCalendarEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");

  const eventId = String(formData.get("event_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Tytuł zjazdu jest wymagany.");

  const { data: event, error: eventError } = await supabase
    .from("school_calendar_events")
    .select("*")
    .eq("id", eventId)
    .single();
  if (eventError) throw new Error(eventError.message);
  if (!event.start_at) throw new Error("Wydarzenie nie ma daty — nie można utworzyć zjazdu.");

  const startDate = new Date(event.start_at).toISOString().slice(0, 10);
  const endDate = event.end_at ? new Date(event.end_at).toISOString().slice(0, 10) : startDate;

  const { data: session, error } = await supabase
    .from("school_sessions")
    .insert({
      title,
      start_date: startDate,
      end_date: endDate,
      venue: event.location ?? null,
      planned_budget_currency: "PLN",
      created_by: user.id,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("session_tasks").insert(
    DEFAULT_SESSION_CHECKLIST.map((taskTitle, index) => ({
      session_id: session.id,
      title: taskTitle,
      sort_order: index,
    })),
  );

  await supabase.from("school_calendar_events").update({ session_id: session.id }).eq("id", eventId);

  revalidatePath("/lab/szkola");
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola/kalendarz");
  redirect(`/lab/szkola/zjazdy/${session.id}`);
}

export async function updateCalendarSettings(formData: FormData) {
  const userId = await requireUserId();
  const supabase = await createClient();

  function parseMinutes(key: string, fallback: number): number {
    const raw = String(formData.get(key) ?? "").trim();
    const value = Number(raw);
    return raw && Number.isFinite(value) && value >= 0 ? value : fallback;
  }

  const { error } = await supabase.from("school_calendar_settings").upsert(
    {
      user_id: userId,
      buffer_before_minutes: parseMinutes("buffer_before_minutes", DEFAULT_CALENDAR_SETTINGS.buffer_before_minutes),
      buffer_after_minutes: parseMinutes("buffer_after_minutes", DEFAULT_CALENDAR_SETTINGS.buffer_after_minutes),
      flight_buffer_minutes: parseMinutes("flight_buffer_minutes", DEFAULT_CALENDAR_SETTINGS.flight_buffer_minutes),
      train_buffer_minutes: parseMinutes("train_buffer_minutes", DEFAULT_CALENDAR_SETTINGS.train_buffer_minutes),
      default_timezone: String(formData.get("default_timezone") ?? "").trim() || DEFAULT_CALENDAR_SETTINGS.default_timezone,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/kalendarz");
}
