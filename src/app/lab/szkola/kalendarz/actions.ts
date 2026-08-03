"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, AdminClientConfigError } from "@/lib/supabase/admin";
import { getValidAccessToken, runCalendarSync, type SyncResult } from "@/lib/szkola/calendarSync";
import { listGoogleCalendars, revokeGoogleToken } from "@/lib/szkola/googleCalendar";
import { fetchIcsFeed, parseIcsEvents, type IcsFetchResult } from "@/lib/szkola/icsCalendar";
import { normalizeIcsUrl, maskIcsUrl } from "@/lib/szkola/urlSafety";
import { decryptToken, encryptToken, CalendarEncryptionConfigError } from "@/lib/szkola/calendarCrypto";
import { DEFAULT_SESSION_CHECKLIST, DEFAULT_CALENDAR_SETTINGS } from "@/lib/szkola/types";
import {
  buildWeekendDetection,
  createSessionFromWeekendGroup,
  assignWeekendGroupToExistingSession,
  skipWeekendGroup,
  runConfidentWeekendImport,
  getNextSessionNumber,
} from "@/lib/szkola/calendarWeekendAutomation";

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

export type ConnectIcsResult =
  | {
      success: true;
      eventsFound: number;
      nearestEventTitle: string | null;
      nearestEventAt: string | null;
      syncedAt: string;
    }
  | { success: false; message: string };

const ICS_CONNECT_GENERIC_MESSAGE = "Nie udało się połączyć kalendarza. Sprawdź link i spróbuj ponownie.";

function logIcsConnectStage(stage: string, extra?: Record<string, unknown>) {
  // Celowo bez pełnego URL/tokenów — tylko nazwa etapu i bezpieczne metadane (kody, liczby).
  console.log(`[ics-connect] ${stage}`, extra ?? "");
}

function mapIcsFetchErrorToMessage(result: Extract<IcsFetchResult, { status: "error" }>): string {
  if (result.reason === "not_icalendar" || result.reason === "invalid_url" || result.reason === "unsafe_url") {
    return "Link nie prowadzi do kalendarza ICS.";
  }
  if (result.reason === "http_error" && (result.httpStatus === 401 || result.httpStatus === 403)) {
    return "Serwer szkoły odrzucił dostęp do kalendarza.";
  }
  return ICS_CONNECT_GENERIC_MESSAGE;
}

/**
 * Podstawowy, domyślny sposób połączenia kalendarza: prywatny link
 * subskrypcji ICS (żadnego Google OAuth). Testuje połączenie PRZED
 * zapisaniem — jeśli pierwsze pobranie się nie powiedzie, konfiguracja
 * w ogóle nie zostaje zapisana jako aktywna (sekcja 4 specyfikacji).
 *
 * WAŻNE: ta funkcja NIGDY nie rzuca wyjątku na zewnątrz — Next.js redaguje
 * treść błędów Server Actions w produkcji do ogólnego komunikatu
 * "An error occurred in the Server Components render", więc każdy błąd
 * (walidacja, sieć, szyfrowanie, zapis do bazy) jest łapany tutaj i
 * zwracany jako kontrolowany wynik { success: false, message }.
 */
export async function connectIcsCalendar(formData: FormData): Promise<ConnectIcsResult> {
  let stage = "start";
  try {
    logIcsConnectStage(stage);
    const userId = await requireUserId();

    const name = String(formData.get("calendar_name") ?? "").trim();
    const rawUrl = String(formData.get("ics_url") ?? "").trim();
    const timezone = String(formData.get("default_timezone") ?? "").trim() || DEFAULT_CALENDAR_SETTINGS.default_timezone;
    const syncEnabled = formData.get("sync_enabled") === "on";

    if (!name) return { success: false, message: "Nazwa kalendarza jest wymagana." };
    if (!rawUrl) return { success: false, message: "Adres kalendarza jest wymagany." };

    stage = "url validated";
    const normalizedUrl = normalizeIcsUrl(rawUrl);
    logIcsConnectStage(stage);

    stage = "fetch started";
    logIcsConnectStage(stage);
    const fetchResult = await fetchIcsFeed(normalizedUrl, {});

    stage = "fetch status";
    logIcsConnectStage(stage, { httpStatus: "httpStatus" in fetchResult ? fetchResult.httpStatus : null, result: fetchResult.status });

    if (fetchResult.status === "error") {
      logIcsConnectStage("failed at fetch", { reason: fetchResult.reason, httpStatus: fetchResult.httpStatus });
      return { success: false, message: mapIcsFetchErrorToMessage(fetchResult) };
    }
    if (fetchResult.status === "not_modified") {
      // Nie powinno się zdarzyć bez podanych nagłówków warunkowych przy pierwszym połączeniu.
      return { success: false, message: "Serwer nie zwrócił zawartości kalendarza. Spróbuj ponownie." };
    }

    stage = "calendar parsed";
    let events: ReturnType<typeof parseIcsEvents>;
    try {
      events = parseIcsEvents(fetchResult.body);
    } catch (err) {
      logIcsConnectStage("failed at parse", { name: err instanceof Error ? err.name : typeof err });
      return { success: false, message: "Link nie prowadzi do kalendarza ICS." };
    }
    logIcsConnectStage(stage, { eventsFound: events.length });

    const now = Date.now();
    const upcoming = events
      .filter((e) => e.status !== "cancelled" && e.start_at && new Date(e.start_at).getTime() >= now)
      .sort((a, b) => new Date(a.start_at!).getTime() - new Date(b.start_at!).getTime());
    const nearest = upcoming[0] ?? null;

    stage = "url encrypted";
    let encryptedUrl: string;
    let maskedUrl: string;
    try {
      encryptedUrl = encryptToken(normalizedUrl);
      maskedUrl = maskIcsUrl(normalizedUrl);
    } catch (err) {
      if (err instanceof CalendarEncryptionConfigError) {
        logIcsConnectStage("failed at encryption", { name: err.name });
        return { success: false, message: "Brakuje konfiguracji szyfrowania po stronie serwera." };
      }
      throw err;
    }
    logIcsConnectStage(stage);

    stage = "admin client ready";
    let admin: ReturnType<typeof createAdminClient>;
    try {
      admin = createAdminClient();
    } catch (err) {
      if (err instanceof AdminClientConfigError) {
        logIcsConnectStage("failed at admin client", { name: err.name });
        return { success: false, message: "Brakuje konfiguracji serwera (klucz dostępu do bazy)." };
      }
      throw err;
    }

    stage = "connection saved";
    const { error } = await admin.from("school_calendar_connections").upsert(
      {
        user_id: userId,
        provider: "google",
        connection_type: "ics_url",
        calendar_name: name,
        encrypted_ics_url: encryptedUrl,
        masked_ics_url: maskedUrl,
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
    if (error) {
      logIcsConnectStage("failed at save", { code: error.code });
      return { success: false, message: "Nie udało się zapisać konfiguracji kalendarza." };
    }
    logIcsConnectStage(stage);

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

    stage = "initial sync completed";
    try {
      await runCalendarSync(userId, "initial");
      logIcsConnectStage(stage);
    } catch (err) {
      // Błąd pierwszej pełnej synchronizacji zostaje zapisany w
      // school_calendar_sync_runs i widoczny na stronie — samo połączenie
      // (test pobrania) już się powiodło, więc konfigurację zostawiamy zapisaną.
      logIcsConnectStage("initial sync failed (non-fatal, connection stays saved)", {
        name: err instanceof Error ? err.name : typeof err,
      });
    }

    revalidatePath("/lab/szkola/kalendarz");
    revalidatePath("/lab/szkola/kalendarz/zmiany");
    revalidatePath("/lab/szkola");

    return {
      success: true,
      eventsFound: events.filter((e) => e.status !== "cancelled").length,
      nearestEventTitle: nearest?.title ?? null,
      nearestEventAt: nearest?.start_at ?? null,
      syncedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[ics-connect] failed", {
      stage,
      name: err instanceof Error ? err.name : typeof err,
      code: (err as { code?: string } | null)?.code ?? null,
      message: ICS_CONNECT_GENERIC_MESSAGE,
    });
    return { success: false, message: ICS_CONNECT_GENERIC_MESSAGE };
  }
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

async function getUserTimezone(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string> {
  const { data } = await supabase.from("school_calendar_settings").select("default_timezone").eq("user_id", userId).maybeSingle();
  return data?.default_timezone || DEFAULT_CALENDAR_SETTINGS.default_timezone;
}

/**
 * Ponownie wykrywa weekendy szkoleniowe z aktualnego stanu bazy i znajduje
 * grupę o podanym `weekendStart` — zamiast ufać liście wydarzeń przesłanej
 * z formularza. Dzięki temu żadna akcja nie działa na nieaktualnych/
 * spreparowanych danych, tylko zawsze na tym, co faktycznie jest w bazie
 * w chwili kliknięcia.
 */
async function findDetectedGroupOrThrow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  timezone: string,
  weekendStart: string,
) {
  const detection = await buildWeekendDetection(supabase, userId, timezone);
  const group = detection.groups.find((g) => g.weekendStart === weekendStart);
  if (!group) throw new Error("Nie znaleziono wykrytego weekendu — odśwież stronę i spróbuj ponownie.");
  return group;
}

/** Tworzy nowy zjazd z wykrytej grupy weekendowej ("Utwórz zjazd" — sekcja 13). */
export async function createSessionFromWeekendGroupAction(formData: FormData) {
  const userId = await requireUserId();
  const supabase = await createClient();
  const weekendStart = String(formData.get("weekend_start") ?? "");
  if (!weekendStart) throw new Error("Brak identyfikatora weekendu.");

  const timezone = await getUserTimezone(supabase, userId);
  const group = await findDetectedGroupOrThrow(supabase, userId, timezone, weekendStart);
  const sessionNumber = await getNextSessionNumber(supabase);
  const { session } = await createSessionFromWeekendGroup(supabase, userId, group, timezone, sessionNumber);

  revalidatePath("/lab/szkola");
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola/kalendarz");
  redirect(`/lab/szkola/zjazdy/${session.id}`);
}

/** Przypisuje wydarzenia wykrytej grupy weekendowej do istniejącego zjazdu ("Przypisz do istniejącego" — sekcja 13). */
export async function assignWeekendGroupToSessionAction(formData: FormData) {
  const userId = await requireUserId();
  const supabase = await createClient();
  const weekendStart = String(formData.get("weekend_start") ?? "");
  const sessionId = String(formData.get("session_id") ?? "").trim();
  if (!weekendStart) throw new Error("Brak identyfikatora weekendu.");
  if (!sessionId) throw new Error("Wybierz zjazd, do którego przypisać wydarzenia.");

  const timezone = await getUserTimezone(supabase, userId);
  const group = await findDetectedGroupOrThrow(supabase, userId, timezone, weekendStart);
  await assignWeekendGroupToExistingSession(supabase, sessionId, group, timezone);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/kalendarz");
}

/** "Pomiń" dla całej wykrytej grupy weekendowej — oznacza jej wydarzenia jako zignorowane (sekcja 13). */
export async function skipWeekendGroupAction(formData: FormData) {
  const userId = await requireUserId();
  const supabase = await createClient();
  const weekendStart = String(formData.get("weekend_start") ?? "");
  if (!weekendStart) throw new Error("Brak identyfikatora weekendu.");

  const timezone = await getUserTimezone(supabase, userId);
  const group = await findDetectedGroupOrThrow(supabase, userId, timezone, weekendStart);
  await skipWeekendGroup(supabase, group);

  revalidatePath("/lab/szkola/kalendarz");
}

export type CreateAllConfidentWeekendSessionsResult = {
  sessionsCreated: number;
  sessionsMatched: number;
  scheduleItemsCreated: number;
};

/**
 * "Utwórz wszystkie pewne zjazdy" (sekcja 9/13) — tworzy/dopasowuje
 * jednym kliknięciem wszystkie weekendy, które NIE wymagają ręcznej
 * decyzji. Po pierwszym takim ręcznie zatwierdzonym imporcie wsadowym
 * włącza tryb automatyczny na przyszłość (sekcja 10) — kolejne
 * synchronizacje mogą tworzyć pewne zjazdy same, bez czekania na ten
 * przycisk.
 */
export async function createAllConfidentWeekendSessionsAction(): Promise<CreateAllConfidentWeekendSessionsResult> {
  const userId = await requireUserId();
  const supabase = await createClient();

  const timezone = await getUserTimezone(supabase, userId);
  const detection = await buildWeekendDetection(supabase, userId, timezone);
  const confidentGroups = detection.groups.filter((g) => g.status !== "needs_decision");

  if (confidentGroups.length === 0) {
    return { sessionsCreated: 0, sessionsMatched: 0, scheduleItemsCreated: 0 };
  }

  const outcome = await runConfidentWeekendImport(supabase, userId, confidentGroups, timezone);

  await supabase
    .from("school_calendar_settings")
    .upsert({ user_id: userId, auto_create_sessions: true, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

  revalidatePath("/lab/szkola");
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola/kalendarz");

  return {
    sessionsCreated: outcome.sessionsCreated,
    sessionsMatched: outcome.sessionsMatched,
    scheduleItemsCreated: outcome.scheduleItemsCreated,
  };
}

/** Ręczny przełącznik "Automatycznie twórz zjazdy z weekendów szkoleniowych" (sekcja 10). */
export async function toggleAutoCreateSessions(formData: FormData) {
  const userId = await requireUserId();
  const enabled = String(formData.get("auto_create_sessions") ?? "") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("school_calendar_settings")
    .upsert({ user_id: userId, auto_create_sessions: enabled, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/kalendarz");
}
