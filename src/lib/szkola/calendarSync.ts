import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken, encryptToken } from "@/lib/szkola/calendarCrypto";
import { listGoogleEvents, normalizeGoogleEvent, refreshAccessToken } from "@/lib/szkola/googleCalendar";
import { fetchIcsFeed, parseIcsEvents } from "@/lib/szkola/icsCalendar";
import { diffEventFields, type ComparableEventFields } from "@/lib/szkola/calendarDiff";
import { matchEventToSession } from "@/lib/szkola/calendarMatching";
import { assessTravelImpact } from "@/lib/szkola/calendarImpact";
import { weekendStartForInstant } from "@/lib/szkola/calendarWeekendGrouping";
import { buildWeekendDetection, runConfidentWeekendImport } from "@/lib/szkola/calendarWeekendAutomation";
import {
  DEFAULT_CALENDAR_SETTINGS,
  type Accommodation,
  type CalendarImpactLevel,
  type CalendarSyncType,
  type NormalizedCalendarEvent,
  type SchoolCalendarSettings,
  type SchoolSession,
  type TravelSegment,
} from "@/lib/szkola/types";

const FULL_SYNC_LOOKBACK_MS = 2 * 365 * 24 * 60 * 60 * 1000;

export type SyncResult = {
  status: "success" | "error";
  eventsReceived: number;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  conflictsDetected: number;
  errorMessage: string | null;
};

function toComparable(row: {
  title: string | null;
  description: string | null;
  location: string | null;
  start_at: string | null;
  end_at: string | null;
  timezone: string | null;
  status: string | null;
  organizer_email: string | null;
  attachments: unknown;
  recurrence: unknown;
}): ComparableEventFields {
  return row;
}

type ProcessEventsResult = {
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  touchedSessionIds: Set<string>;
};

/**
 * Wspólna logika przetwarzania wydarzeń — identyczna niezależnie od tego,
 * czy `normalizedEvents` pochodzi z Google Calendar API, czy z parsowania
 * feedu ICS. Porównuje z zapisanym stanem, zapisuje zmiany pole-po-polu,
 * próbuje dopasować do zjazdu, wykrywa usunięcia (tylko przy pełnej
 * synchronizacji — `isFullSync`).
 */
async function processEvents(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  syncRunId: string,
  connectionCalendarId: string | null,
  sessions: SchoolSession[],
  normalizedEvents: NormalizedCalendarEvent[],
  isFullSync: boolean,
  timezone: string,
): Promise<ProcessEventsResult> {
  const { data: existingEventsData } = await admin
    .from("school_calendar_events")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null);
  const existingByEventId = new Map((existingEventsData ?? []).map((e) => [e.google_event_id as string, e]));

  const touchedSessionIds = new Set<string>();
  const seenEventIds = new Set<string>();
  let eventsCreated = 0;
  let eventsUpdated = 0;
  let eventsDeleted = 0;

  for (const normalized of normalizedEvents) {
    seenEventIds.add(normalized.google_event_id);
    const existing = existingByEventId.get(normalized.google_event_id);

    if (!existing) {
      if (normalized.status === "cancelled") continue; // nigdy nie widzieliśmy, i tak anulowane — pomiń

      const match = matchEventToSession(normalized, sessions);
      const sessionId = match?.confidence === "high" ? match.session.id : null;

      const { data: inserted, error: insertError } = await admin
        .from("school_calendar_events")
        .insert({
          user_id: userId,
          calendar_id: connectionCalendarId,
          session_id: sessionId,
          ...normalized,
        })
        .select()
        .single();
      if (insertError) throw new Error(insertError.message);

      await admin.from("school_calendar_changes").insert({
        user_id: userId,
        calendar_event_id: inserted.id,
        session_id: sessionId,
        sync_run_id: syncRunId,
        change_type: "created",
        field_name: null,
        old_value: null,
        new_value: normalized.title,
        impact_level: "none",
      });
      eventsCreated += 1;
      if (sessionId) touchedSessionIds.add(sessionId);
      continue;
    }

    // Anulowanie/skasowanie istniejącego wydarzenia.
    if (normalized.status === "cancelled" && existing.status !== "cancelled") {
      await admin
        .from("school_calendar_events")
        .update({ status: "cancelled", deleted_at: new Date().toISOString(), last_seen_at: new Date().toISOString() })
        .eq("id", existing.id);
      await admin.from("school_calendar_changes").insert({
        user_id: userId,
        calendar_event_id: existing.id,
        session_id: existing.session_id,
        sync_run_id: syncRunId,
        change_type: "cancelled",
        field_name: "status",
        old_value: existing.status,
        new_value: "cancelled",
        impact_level: existing.session_id ? "warning" : "none",
        impact_summary: existing.session_id
          ? "Zjazd/punkt planu został anulowany w kalendarzu. Sprawdź rezerwacje podróży i noclegu."
          : null,
      });
      eventsDeleted += 1;
      if (existing.session_id) touchedSessionIds.add(existing.session_id);
      continue;
    }

    const fieldChanges = diffEventFields(toComparable(existing), toComparable(normalized));

    const match = existing.session_id ? null : matchEventToSession(normalized, sessions);
    const sessionId = existing.session_id ?? (match?.confidence === "high" ? match.session.id : null);

    await admin
      .from("school_calendar_events")
      .update({ ...normalized, session_id: sessionId, last_seen_at: new Date().toISOString() })
      .eq("id", existing.id);

    // Wydarzenie już przypisane do zjazdu, którego termin się przesunął na
    // inny weekend szkoleniowy (sekcja 14) — nie przenosimy nic automatycznie,
    // tylko podnosimy poziom wpływu, żeby użytkownik zobaczył to na stronie
    // "Zmiany" i podjął decyzję ręcznie.
    const oldWeekendStart = existing.start_at ? weekendStartForInstant(existing.start_at, timezone, existing.all_day) : null;
    const newWeekendStart = normalized.start_at ? weekendStartForInstant(normalized.start_at, timezone, normalized.all_day) : null;
    const movedToOtherWeekend = Boolean(
      sessionId && oldWeekendStart && newWeekendStart && oldWeekendStart !== newWeekendStart,
    );

    if (fieldChanges.length > 0) {
      for (const change of fieldChanges) {
        const isMove = change.field_name === "start_at" || change.field_name === "end_at";
        await admin.from("school_calendar_changes").insert({
          user_id: userId,
          calendar_event_id: existing.id,
          session_id: sessionId,
          sync_run_id: syncRunId,
          change_type: isMove ? "moved" : "updated",
          field_name: change.field_name,
          old_value: change.old_value,
          new_value: change.new_value,
          impact_level: isMove && movedToOtherWeekend ? "warning" : "none",
          impact_summary:
            isMove && movedToOtherWeekend
              ? "Wydarzenie zostało przeniesione do innego weekendu. Sprawdź przypisanie do zjazdu."
              : null,
        });
      }
      eventsUpdated += 1;
      if (sessionId) touchedSessionIds.add(sessionId);
    }
  }

  // Pełna synchronizacja: wydarzenia, które zniknęły z odpowiedzi (a nie
  // przyszły ze statusem "cancelled") traktujemy jako potencjalnie usunięte.
  // Przy synchronizacji przyrostowej (Google sync_token) nieobecność w
  // odpowiedzi oznacza po prostu "bez zmian", więc pomijamy ten krok.
  if (isFullSync) {
    for (const [eventId, existing] of existingByEventId) {
      if (seenEventIds.has(eventId)) continue;
      await admin
        .from("school_calendar_events")
        .update({ deleted_at: new Date().toISOString(), last_seen_at: new Date().toISOString() })
        .eq("id", existing.id);
      await admin.from("school_calendar_changes").insert({
        user_id: userId,
        calendar_event_id: existing.id,
        session_id: existing.session_id,
        sync_run_id: syncRunId,
        change_type: "deleted",
        field_name: null,
        old_value: existing.title,
        new_value: null,
        impact_level: existing.session_id ? "warning" : "none",
        impact_summary: existing.session_id
          ? "Wydarzenie zniknęło z kalendarza. Sprawdź rezerwacje podróży i noclegu."
          : null,
      });
      eventsDeleted += 1;
      if (existing.session_id) touchedSessionIds.add(existing.session_id);
    }
  }

  return { eventsCreated, eventsUpdated, eventsDeleted, touchedSessionIds };
}

export async function runCalendarSync(userId: string, syncType: CalendarSyncType): Promise<SyncResult> {
  const admin = createAdminClient();

  const { data: connection, error: connectionError } = await admin
    .from("school_calendar_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();

  if (connectionError) throw new Error(connectionError.message);
  if (!connection) throw new Error("Kalendarz nie jest połączony.");

  const connectionType = connection.connection_type ?? "ics_url";
  if (connectionType === "google_oauth" && !connection.calendar_id) {
    throw new Error("Nie wybrano jeszcze kalendarza do synchronizacji.");
  }
  if (connectionType === "ics_url" && !connection.encrypted_ics_url) {
    throw new Error("Brak zapisanego adresu kalendarza — połącz kalendarz ponownie.");
  }

  const { data: syncRun, error: syncRunError } = await admin
    .from("school_calendar_sync_runs")
    .insert({ user_id: userId, connection_id: connection.id, sync_type: syncType, status: "running" })
    .select()
    .single();
  if (syncRunError) throw new Error(syncRunError.message);

  const result: SyncResult = {
    status: "success",
    eventsReceived: 0,
    eventsCreated: 0,
    eventsUpdated: 0,
    eventsDeleted: 0,
    conflictsDetected: 0,
    errorMessage: null,
  };

  try {
    const { data: sessionsData } = await admin.from("school_sessions").select("*");
    const sessions = (sessionsData as SchoolSession[] | null) ?? [];
    const settings = await loadOrDefaultSettings(admin, userId);
    const timezone = settings.default_timezone || DEFAULT_CALENDAR_SETTINGS.default_timezone;

    let normalizedEvents: NormalizedCalendarEvent[];
    let isFullSync: boolean;
    const connectionUpdate: Record<string, unknown> = { last_error: null };

    if (connectionType === "ics_url") {
      const icsUrl = decryptToken(connection.encrypted_ics_url);
      const fetchResult = await fetchIcsFeed(icsUrl, { etag: connection.etag, lastModified: connection.last_modified });

      if (fetchResult.status === "error") {
        throw new Error(fetchResult.errorMessage);
      }

      if (fetchResult.status === "not_modified") {
        // Sukces bez zmian — NIE tworzymy fałszywych zmian ani usunięć.
        await admin
          .from("school_calendar_connections")
          .update({
            last_synced_at: new Date().toISOString(),
            next_sync_at:
              connection.sync_frequency === "weekly" ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
            last_successful_fetch_at: new Date().toISOString(),
            last_http_status: 304,
            last_error: null,
          })
          .eq("id", connection.id);

        await admin
          .from("school_calendar_sync_runs")
          .update({
            completed_at: new Date().toISOString(),
            status: "success",
            events_received: 0,
            events_created: 0,
            events_updated: 0,
            events_deleted: 0,
          })
          .eq("id", syncRun.id);

        return result;
      }

      // fetchResult.status === "ok"
      normalizedEvents = parseIcsEvents(fetchResult.body);
      isFullSync = true; // ICS to zawsze pełny zrzut — nie ma odpowiednika sync_token
      connectionUpdate.etag = fetchResult.etag;
      connectionUpdate.last_modified = fetchResult.lastModified;
      connectionUpdate.last_successful_fetch_at = new Date().toISOString();
      connectionUpdate.last_http_status = fetchResult.httpStatus;
    } else {
      // google_oauth (opcjonalny, przyszłościowy wariant — patrz googleCalendar.ts)
      const accessToken = await getValidAccessToken(admin, connection);

      const hasSyncToken = Boolean(connection.sync_token);
      let page = hasSyncToken
        ? await listGoogleEvents(accessToken, connection.calendar_id, { syncToken: connection.sync_token })
        : await listGoogleEvents(accessToken, connection.calendar_id, {
            timeMin: new Date(Date.now() - FULL_SYNC_LOOKBACK_MS).toISOString(),
          });
      isFullSync = !hasSyncToken;
      if (page.syncTokenInvalid) {
        isFullSync = true;
        page = await listGoogleEvents(accessToken, connection.calendar_id, {
          timeMin: new Date(Date.now() - FULL_SYNC_LOOKBACK_MS).toISOString(),
        });
      }
      normalizedEvents = page.events.map(normalizeGoogleEvent);
      connectionUpdate.sync_token = page.nextSyncToken;
    }

    result.eventsReceived = normalizedEvents.length;

    const { eventsCreated, eventsUpdated, eventsDeleted, touchedSessionIds } = await processEvents(
      admin,
      userId,
      syncRun.id,
      connection.calendar_id,
      sessions,
      normalizedEvents,
      isFullSync,
      timezone,
    );
    result.eventsCreated = eventsCreated;
    result.eventsUpdated = eventsUpdated;
    result.eventsDeleted = eventsDeleted;

    // Ocena wpływu na podróż — tylko dla zjazdów, których punkty planu
    // faktycznie się przesunęły/pojawiły/zniknęły w tej synchronizacji.
    if (touchedSessionIds.size > 0) {
      for (const sessionId of touchedSessionIds) {
        const impact = await assessSessionImpact(admin, userId, sessionId, settings);
        if (impact.impact_level === "none") continue;
        if (impact.impact_level === "conflict") result.conflictsDetected += 1;

        await admin
          .from("school_calendar_changes")
          .update({ impact_level: impact.impact_level, impact_summary: impact.impact_summary })
          .eq("sync_run_id", syncRun.id)
          .eq("session_id", sessionId)
          .in("field_name", ["start_at", "end_at"]);
      }
    }

    // Tryb automatyczny (sekcja 10) — jeśli włączony, po synchronizacji od
    // razu tworzymy/dopasowujemy zjazdy dla weekendów o wysokiej pewności,
    // zamiast czekać na ręczne kliknięcie na stronie /lab/szkola/kalendarz.
    // Historia trafia do school_calendar_changes (widoczna na stronie
    // "Zmiany"), tak samo jak każda inna zmiana wykryta w tej synchronizacji —
    // nic nie dzieje się bez śladu.
    if (settings.auto_create_sessions) {
      const detection = await buildWeekendDetection(admin, userId, timezone);
      const confidentGroups = detection.groups.filter((g) => g.status !== "needs_decision");
      if (confidentGroups.length > 0) {
        const outcome = await runConfidentWeekendImport(admin, userId, confidentGroups, timezone);
        for (const detail of outcome.details) {
          await admin.from("school_calendar_changes").insert({
            user_id: userId,
            calendar_event_id: null,
            session_id: detail.sessionId,
            sync_run_id: syncRun.id,
            change_type: "created",
            field_name: null,
            old_value: null,
            new_value:
              detail.action === "created"
                ? `Automatycznie utworzono zjazd z weekendu ${detail.group.weekendStart}–${detail.group.weekendEnd} (${detail.group.events.length} wydarzeń).`
                : `Automatycznie dopasowano ${detail.group.events.length} wydarzeń weekendu ${detail.group.weekendStart}–${detail.group.weekendEnd} do istniejącego zjazdu.`,
            impact_level: "information",
          });
        }
      }
    }

    connectionUpdate.last_synced_at = new Date().toISOString();
    connectionUpdate.next_sync_at =
      connection.sync_frequency === "weekly" ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null;

    await admin.from("school_calendar_connections").update(connectionUpdate).eq("id", connection.id);

    await admin
      .from("school_calendar_sync_runs")
      .update({
        completed_at: new Date().toISOString(),
        status: "success",
        events_received: result.eventsReceived,
        events_created: result.eventsCreated,
        events_updated: result.eventsUpdated,
        events_deleted: result.eventsDeleted,
      })
      .eq("id", syncRun.id);

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nieznany błąd synchronizacji.";
    await admin
      .from("school_calendar_sync_runs")
      .update({ completed_at: new Date().toISOString(), status: "error", error_message: message })
      .eq("id", syncRun.id);
    await admin.from("school_calendar_connections").update({ last_error: message }).eq("id", connection.id);

    result.status = "error";
    result.errorMessage = message;
    throw new Error(message);
  }
}

/** Zwraca ważny access token Google, odświeżając go (i zapisując z powrotem, zaszyfrowany) w razie potrzeby. Tylko dla connection_type = 'google_oauth'. */
export async function getValidAccessToken(
  admin: ReturnType<typeof createAdminClient>,
  connection: {
    id: string;
    access_token_encrypted: string | null;
    refresh_token_encrypted: string | null;
    token_expires_at: string | null;
  },
): Promise<string> {
  const accessToken = connection.access_token_encrypted ? decryptToken(connection.access_token_encrypted) : null;
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0;
  if (accessToken && expiresAt >= Date.now() + 60_000) {
    return accessToken;
  }

  if (!connection.refresh_token_encrypted) {
    throw new Error("Brak zapisanego tokenu Google — połącz kalendarz ponownie.");
  }
  const refreshToken = decryptToken(connection.refresh_token_encrypted);
  const refreshed = await refreshAccessToken(refreshToken);
  await admin
    .from("school_calendar_connections")
    .update({
      access_token_encrypted: encryptToken(refreshed.access_token),
      token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    })
    .eq("id", connection.id);
  return refreshed.access_token;
}

async function loadOrDefaultSettings(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<SchoolCalendarSettings> {
  const { data } = await admin.from("school_calendar_settings").select("*").eq("user_id", userId).maybeSingle();
  if (data) return data as SchoolCalendarSettings;
  return {
    id: "",
    user_id: userId,
    created_at: "",
    updated_at: "",
    ...DEFAULT_CALENDAR_SETTINGS,
  };
}

async function assessSessionImpact(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  sessionId: string,
  settings: SchoolCalendarSettings,
): Promise<{ impact_level: CalendarImpactLevel; impact_summary: string | null }> {
  const { data: eventsData } = await admin
    .from("school_calendar_events")
    .select("start_at, end_at")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .is("deleted_at", null);

  const events = (eventsData as { start_at: string | null; end_at: string | null }[] | null) ?? [];
  const starts = events.map((e) => e.start_at).filter((v): v is string => Boolean(v));
  const ends = events.map((e) => e.end_at).filter((v): v is string => Boolean(v));
  if (starts.length === 0 && ends.length === 0) return { impact_level: "none", impact_summary: null };

  const classStart = starts.length > 0 ? new Date(Math.min(...starts.map((s) => new Date(s).getTime()))) : null;
  const classEnd = ends.length > 0 ? new Date(Math.max(...ends.map((e) => new Date(e).getTime()))) : null;

  const { data: itinerary } = await admin.from("travel_itineraries").select("id").eq("session_id", sessionId).maybeSingle();
  let segments: TravelSegment[] = [];
  if (itinerary) {
    const { data: segmentsData } = await admin.from("travel_segments").select("*").eq("itinerary_id", itinerary.id);
    segments = (segmentsData as TravelSegment[] | null) ?? [];
  }
  const { data: accommodationsData } = await admin.from("accommodations").select("*").eq("session_id", sessionId);
  const accommodations = (accommodationsData as Accommodation[] | null) ?? [];

  return assessTravelImpact({ classStart, classEnd, segments, accommodations, settings });
}
