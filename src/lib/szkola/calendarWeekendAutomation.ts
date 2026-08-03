import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  groupCalendarEventsIntoWeekends,
  localDateKey,
  localTimeOfDay,
  type GroupableCalendarEvent,
  type ManualReviewEvent,
  type WeekendGroup,
} from "@/lib/szkola/calendarWeekendGrouping";
import { DEFAULT_SESSION_CHECKLIST, type SchoolSession } from "@/lib/szkola/types";

export type WeekendGroupStatus = "new_session" | "matched_existing" | "needs_decision";

export type DetectedWeekendGroup = WeekendGroup & { status: WeekendGroupStatus };

export type WeekendDetectionSummary = {
  groups: DetectedWeekendGroup[];
  manualReviewEvents: ManualReviewEvent[];
  totalWeekends: number;
  newSessionsCount: number;
  matchedExistingCount: number;
  scheduleItemsToAddCount: number;
  needsDecisionEventsCount: number;
};

function statusForGroup(group: WeekendGroup): WeekendGroupStatus {
  if (group.suggestedSession) return "matched_existing";
  if (group.confidence === "high") return "new_session";
  return "needs_decision";
}

/**
 * Buduje podgląd wykrytych weekendów szkoleniowych z jeszcze
 * nieprzypisanych wydarzeń kalendarza (sekcja 9/13 specyfikacji) — używane
 * zarówno przez stronę /lab/szkola/kalendarz, jak i przez tryb automatyczny
 * w calendarSync.ts.
 */
export async function buildWeekendDetection(
  client: SupabaseClient,
  userId: string,
  timezone: string,
): Promise<WeekendDetectionSummary> {
  const [{ data: eventsData, error: eventsError }, { data: sessionsData, error: sessionsError }] = await Promise.all([
    client
      .from("school_calendar_events")
      .select("id, google_event_id, title, description, location, start_at, end_at, all_day")
      .eq("user_id", userId)
      .is("session_id", null)
      .is("deleted_at", null)
      .eq("ignored", false)
      .neq("status", "cancelled")
      .order("start_at", { ascending: true }),
    client.from("school_sessions").select("*"),
  ]);
  if (eventsError) throw new Error(eventsError.message);
  if (sessionsError) throw new Error(sessionsError.message);

  const events = (eventsData ?? []) as GroupableCalendarEvent[];
  const sessions = (sessionsData ?? []) as SchoolSession[];

  const { weekendGroups, manualReviewEvents } = groupCalendarEventsIntoWeekends(events, timezone, sessions);
  const groups: DetectedWeekendGroup[] = weekendGroups.map((group) => ({ ...group, status: statusForGroup(group) }));

  const confidentGroups = groups.filter((g) => g.status !== "needs_decision");

  return {
    groups,
    manualReviewEvents,
    totalWeekends: groups.length,
    newSessionsCount: groups.filter((g) => g.status === "new_session").length,
    matchedExistingCount: groups.filter((g) => g.status === "matched_existing").length,
    scheduleItemsToAddCount: confidentGroups.reduce((sum, g) => sum + g.events.length, 0),
    needsDecisionEventsCount:
      groups.filter((g) => g.status === "needs_decision").reduce((sum, g) => sum + g.events.length, 0) + manualReviewEvents.length,
  };
}

/** Najbliższy wolny numer zjazdu ("Zjazd N") — najwyższy istniejący + 1 (sekcja 5). */
export async function getNextSessionNumber(client: SupabaseClient): Promise<number> {
  const { data, error } = await client
    .from("school_sessions")
    .select("session_number")
    .order("session_number", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  const max = (data?.[0] as { session_number: number | null } | undefined)?.session_number ?? 0;
  return max + 1;
}

/**
 * Tworzy punkty planu zajęć (session_schedule_items) dla wydarzeń grupy,
 * pomijając te, dla których punkt o tym samym google_event_id już istnieje
 * (sekcja 7/11 — ochrona przed duplikatami, jeden UID/wystąpienie = jeden
 * punkt planu). Zwraca liczbę faktycznie utworzonych punktów.
 */
async function createScheduleItemsForEvents(
  client: SupabaseClient,
  sessionId: string,
  events: GroupableCalendarEvent[],
  timezone: string,
): Promise<number> {
  const googleEventIds = events.map((e) => e.google_event_id);
  const [{ data: existingItems, error: existingError }, { data: maxSortRow, error: sortError }] = await Promise.all([
    client.from("session_schedule_items").select("google_event_id").eq("session_id", sessionId).in("google_event_id", googleEventIds),
    client
      .from("session_schedule_items")
      .select("sort_order")
      .eq("session_id", sessionId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (existingError) throw new Error(existingError.message);
  if (sortError) throw new Error(sortError.message);

  const existingIds = new Set((existingItems ?? []).map((i: { google_event_id: string | null }) => i.google_event_id));
  let nextSortOrder = ((maxSortRow as { sort_order: number } | null)?.sort_order ?? -1) + 1;

  const rowsToInsert = events
    .filter((event) => event.start_at && !existingIds.has(event.google_event_id))
    .map((event) => {
      const endIso = event.end_at ?? event.start_at!;
      const row = {
        session_id: sessionId,
        item_date: localDateKey(event.start_at!, timezone, event.all_day),
        start_time: event.all_day ? null : localTimeOfDay(event.start_at!, timezone),
        end_time: event.all_day ? null : localTimeOfDay(endIso, timezone),
        title: event.title ?? "Punkt planu z kalendarza",
        notes: event.description ?? null,
        location: event.location ?? null,
        source: "google_calendar" as const,
        google_event_id: event.google_event_id,
        sort_order: nextSortOrder,
      };
      nextSortOrder += 1;
      return row;
    });

  if (rowsToInsert.length === 0) return 0;
  const { error } = await client.from("session_schedule_items").insert(rowsToInsert);
  if (error) throw new Error(error.message);
  return rowsToInsert.length;
}

export type WeekendGroupForAction = Pick<
  WeekendGroup,
  "weekendStart" | "weekendEnd" | "earliestStartDate" | "latestEndDate" | "events"
>;

/**
 * Tworzy nowy zjazd z grupy weekendowej: numeruje "Zjazd N", zapisuje
 * temat/miejsce odczytane z wydarzeń jako podpowiedź (nie zastępując
 * numeracji — sekcja 5), zasiewa domyślną checklistę, przypisuje wydarzenia
 * i tworzy brakujące punkty planu zajęć (sekcja 6/7/8).
 */
export async function createSessionFromWeekendGroup(
  client: SupabaseClient,
  userId: string,
  group: WeekendGroupForAction,
  timezone: string,
  sessionNumber: number,
): Promise<{ session: SchoolSession; scheduleItemsCreated: number }> {
  const topic = group.events.find((e) => e.title)?.title ?? null;
  const venue = group.events.find((e) => e.location)?.location ?? null;

  const { data: session, error } = await client
    .from("school_sessions")
    .insert({
      title: `Zjazd ${sessionNumber}`,
      session_number: sessionNumber,
      topic,
      venue,
      start_date: group.earliestStartDate,
      end_date: group.latestEndDate,
      planned_budget_currency: "PLN",
      created_by: userId,
      created_from_calendar: true,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const { error: tasksError } = await client.from("session_tasks").insert(
    DEFAULT_SESSION_CHECKLIST.map((taskTitle, index) => ({
      session_id: session.id,
      title: taskTitle,
      sort_order: index,
    })),
  );
  if (tasksError) throw new Error(tasksError.message);

  const eventIds = group.events.map((e) => e.id);
  if (eventIds.length > 0) {
    const { error: assignError } = await client.from("school_calendar_events").update({ session_id: session.id }).in("id", eventIds);
    if (assignError) throw new Error(assignError.message);
  }

  const scheduleItemsCreated = await createScheduleItemsForEvents(client, session.id, group.events, timezone);

  return { session: session as SchoolSession, scheduleItemsCreated };
}

/** Przypisuje wydarzenia grupy do już istniejącego zjazdu i uzupełnia brakujące punkty planu (sekcja 4/7/8). */
export async function assignWeekendGroupToExistingSession(
  client: SupabaseClient,
  sessionId: string,
  group: WeekendGroupForAction,
  timezone: string,
): Promise<{ scheduleItemsCreated: number }> {
  const eventIds = group.events.map((e) => e.id);
  if (eventIds.length > 0) {
    const { error } = await client.from("school_calendar_events").update({ session_id: sessionId }).in("id", eventIds);
    if (error) throw new Error(error.message);
  }
  const scheduleItemsCreated = await createScheduleItemsForEvents(client, sessionId, group.events, timezone);
  return { scheduleItemsCreated };
}

/** "Pomiń" — oznacza wszystkie wydarzenia grupy jako zignorowane, żeby zniknęły z detekcji przy kolejnych synchronizacjach/wizytach na stronie. */
export async function skipWeekendGroup(client: SupabaseClient, group: WeekendGroupForAction): Promise<void> {
  const eventIds = group.events.map((e) => e.id);
  if (eventIds.length === 0) return;
  const { error } = await client.from("school_calendar_events").update({ ignored: true }).in("id", eventIds);
  if (error) throw new Error(error.message);
}

export type WeekendImportOutcome = {
  sessionsCreated: number;
  sessionsMatched: number;
  scheduleItemsCreated: number;
  /** Szczegóły per grupa — do zapisania historii zmian (sekcja 14) przez wywołującego. */
  details: { sessionId: string; action: "created" | "matched"; group: DetectedWeekendGroup; scheduleItemsCreated: number }[];
};

/**
 * Przetwarza wszystkie "pewne" grupy (status != needs_decision): tworzy
 * nowe zjazdy albo dopasowuje do istniejących, numerując nowe zjazdy
 * chronologicznie (grupy są już posortowane po weekendStart — patrz
 * groupCalendarEventsIntoWeekends). Współdzielone przez akcję "Utwórz
 * wszystkie pewne zjazdy" i tryb automatyczny w calendarSync.ts.
 */
export async function runConfidentWeekendImport(
  client: SupabaseClient,
  userId: string,
  groups: DetectedWeekendGroup[],
  timezone: string,
): Promise<WeekendImportOutcome> {
  let nextNumber = await getNextSessionNumber(client);
  let sessionsCreated = 0;
  let sessionsMatched = 0;
  let scheduleItemsCreated = 0;
  const details: WeekendImportOutcome["details"] = [];

  for (const group of groups) {
    if (group.status === "needs_decision") continue;

    if (group.status === "matched_existing" && group.suggestedSession) {
      const result = await assignWeekendGroupToExistingSession(client, group.suggestedSession.id, group, timezone);
      sessionsMatched += 1;
      scheduleItemsCreated += result.scheduleItemsCreated;
      details.push({ sessionId: group.suggestedSession.id, action: "matched", group, scheduleItemsCreated: result.scheduleItemsCreated });
      continue;
    }

    const result = await createSessionFromWeekendGroup(client, userId, group, timezone, nextNumber);
    nextNumber += 1;
    sessionsCreated += 1;
    scheduleItemsCreated += result.scheduleItemsCreated;
    details.push({ sessionId: result.session.id, action: "created", group, scheduleItemsCreated: result.scheduleItemsCreated });
  }

  return { sessionsCreated, sessionsMatched, scheduleItemsCreated, details };
}
