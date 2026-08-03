import type { SchoolSession } from "@/lib/szkola/types";

/**
 * Minimalny kształt wydarzenia potrzebny do grupowania — celowo podzbiór
 * `NormalizedCalendarEvent`/`SchoolCalendarEvent`, żeby ta funkcja została
 * czysta i łatwa do testowania bez zależności od Supabase.
 */
export type GroupableCalendarEvent = {
  id: string;
  google_event_id: string;
  title: string | null;
  description: string | null;
  location: string | null;
  start_at: string | null;
  end_at: string | null;
  all_day: boolean;
};

export type WeekendGroupConfidence = "high" | "low";

export type WeekendGroup = {
  /** Piątek weekendu szkoleniowego, lokalna data "YYYY-MM-DD". */
  weekendStart: string;
  /** Niedziela weekendu szkoleniowego, lokalna data "YYYY-MM-DD". */
  weekendEnd: string;
  events: GroupableCalendarEvent[];
  /** ISO chwili rozpoczęcia najwcześniejszego wydarzenia w grupie. */
  earliestStart: string;
  /** ISO chwili zakończenia najpóźniejszego wydarzenia w grupie. */
  latestEnd: string;
  /** Lokalna data (YYYY-MM-DD) odpowiadająca earliestStart — do porównań z session.start_date. */
  earliestStartDate: string;
  /** Lokalna data (YYYY-MM-DD) odpowiadająca latestEnd — do porównań z session.end_date. */
  latestEndDate: string;
  /**
   * "high" tylko gdy grupa ma >=2 wydarzenia (sekcja 3 specyfikacji) —
   * jedynie wtedy wolno tworzyć zjazd automatycznie/masowo. Pojedyncze
   * wydarzenie zawsze zostaje "low", nawet jeśli przypada w piątek-niedzielę.
   */
  confidence: WeekendGroupConfidence;
  /** Istniejący zjazd, którego zakres dat obejmuje ten weekend — patrz findExistingSessionForWeekend. */
  suggestedSession: SchoolSession | null;
};

export type ManualReviewReason = "weekday";

export type ManualReviewEvent = GroupableCalendarEvent & { reason: ManualReviewReason };

export type WeekendGroupingResult = {
  weekendGroups: WeekendGroup[];
  /** Wydarzenia poniedziałek-czwartek, które nie dały się bezpiecznie dopiąć do sąsiedniego weekendu. */
  manualReviewEvents: ManualReviewEvent[];
};

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/**
 * Lokalna data kalendarzowa (YYYY-MM-DD) wydarzenia w danej strefie czasowej.
 * Wydarzenia całodniowe (VALUE=DATE) nie niosą realnej godziny/strefy — ich
 * data jest już "faktyczną" datą lokalną nadaną przez organizatora, więc
 * bierzemy ją wprost z zapisanego ISO zamiast przeliczać przez Intl (patrz
 * te same założenie w importScheduleItemFromEvent/UnassignedCalendarEventsCard).
 */
export function localDateKey(iso: string, timezone: string, allDay: boolean): string {
  if (allDay) return iso.slice(0, 10);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value])) as Record<string, string>;
  return `${map.year}-${map.month}-${map.day}`;
}

function localWeekday(iso: string, timezone: string, allDay: boolean): number {
  if (allDay) {
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  }
  const weekdayShort = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(new Date(iso));
  return WEEKDAY_INDEX[weekdayShort];
}

/** Przesuwa datę "YYYY-MM-DD" o `deltaDays` dni (arytmetyka w UTC, żeby uniknąć niuansów DST). */
export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
}

/**
 * Piątek weekendu, do którego należy dana lokalna data, na podstawie
 * jawnej reguły piątek/sobota/niedziela (sekcja 2 specyfikacji) — NIE na
 * podstawie odstępu 24h. Poniedziałek-czwartek → null (poza regułą).
 */
function weekendStartForWeekday(dateKey: string, weekday: number): string | null {
  if (weekday === 5) return dateKey;
  if (weekday === 6) return shiftDateKey(dateKey, -1);
  if (weekday === 0) return shiftDateKey(dateKey, -2);
  return null;
}

/**
 * Sprawdza, czy istniejący zjazd już obejmuje ten weekend (sekcja 4) —
 * albo zakres zjazdu zawiera realne daty wydarzeń, albo dokładnie
 * odpowiada granicom piątek-niedziela. Zwraca pierwsze dopasowanie wysokiej
 * pewności; przy kilku nakładających się zjazdach woła caller ma za mało
 * informacji, żeby rozstrzygać automatycznie, więc bierzemy pierwszy.
 */
export function findExistingSessionForWeekend(
  group: Pick<WeekendGroup, "weekendStart" | "weekendEnd" | "earliestStartDate" | "latestEndDate">,
  sessions: SchoolSession[],
): SchoolSession | null {
  for (const session of sessions) {
    const sessionEnd = session.end_date ?? session.start_date;
    const containsEvents = session.start_date <= group.earliestStartDate && sessionEnd >= group.latestEndDate;
    const exactWeekendMatch = session.start_date === group.weekendStart && sessionEnd === group.weekendEnd;
    if (containsEvents || exactWeekendMatch) return session;
  }
  return null;
}

/**
 * Grupuje wydarzenia kalendarza w zjazdy weekendowe (piątek-niedziela,
 * sekcja 1-2 specyfikacji). Czysta funkcja — bez I/O, bez Supabase — żeby
 * dało się ją łatwo testować jednostkowo i współdzielić między stroną
 * /lab/szkola/kalendarz (podgląd) a silnikiem synchronizacji (tryb
 * automatyczny).
 *
 * Wystąpienia wydarzeń cyklicznych trafiają tu już rozwinięte na osobne
 * rekordy z realnymi datami (patrz icsCalendar.ts/parseIcsEvents), więc
 * grupowanie "po prostu działa" — każde wystąpienie ląduje w weekendzie
 * odpowiadającym jego faktycznej dacie, a nie w jednej grupie dla całej serii.
 */
export function groupCalendarEventsIntoWeekends(
  events: GroupableCalendarEvent[],
  timezone: string,
  sessions: SchoolSession[] = [],
): WeekendGroupingResult {
  const byWeekendStart = new Map<string, GroupableCalendarEvent[]>();
  const loose: { event: GroupableCalendarEvent; dateKey: string; weekday: number }[] = [];

  for (const event of events) {
    if (!event.start_at) continue;
    const dateKey = localDateKey(event.start_at, timezone, event.all_day);
    const weekday = localWeekday(event.start_at, timezone, event.all_day);
    const weekendStart = weekendStartForWeekday(dateKey, weekday);
    if (weekendStart) {
      const list = byWeekendStart.get(weekendStart) ?? [];
      list.push(event);
      byWeekendStart.set(weekendStart, list);
    } else {
      loose.push({ event, dateKey, weekday });
    }
  }

  const manualReviewEvents: ManualReviewEvent[] = [];
  for (const item of loose) {
    let attached = false;
    if (item.weekday === 1) {
      // Poniedziałek: może należeć do weekendu, którego niedziela była dzień wcześniej.
      const candidateWeekendStart = shiftDateKey(item.dateKey, -3);
      const candidateGroup = byWeekendStart.get(candidateWeekendStart);
      if (candidateGroup) {
        candidateGroup.push(item.event);
        attached = true;
      }
    } else if (item.weekday === 4) {
      // Czwartek: może należeć do weekendu, którego piątek jest dzień później.
      const candidateWeekendStart = shiftDateKey(item.dateKey, 1);
      const candidateGroup = byWeekendStart.get(candidateWeekendStart);
      if (candidateGroup) {
        candidateGroup.push(item.event);
        attached = true;
      }
    }
    if (!attached) manualReviewEvents.push({ ...item.event, reason: "weekday" });
  }

  const weekendGroups: WeekendGroup[] = [];
  for (const [weekendStart, groupEvents] of byWeekendStart) {
    const weekendEnd = shiftDateKey(weekendStart, 2);
    const sorted = [...groupEvents].sort((a, b) => (a.start_at ?? "").localeCompare(b.start_at ?? ""));
    const earliest = sorted[0];
    const latest = sorted.reduce((acc, e) => ((e.end_at ?? e.start_at ?? "") > (acc.end_at ?? acc.start_at ?? "") ? e : acc), sorted[0]);

    const earliestStart = earliest.start_at!;
    const latestEnd = latest.end_at ?? latest.start_at!;

    const group: WeekendGroup = {
      weekendStart,
      weekendEnd,
      events: sorted,
      earliestStart,
      latestEnd,
      earliestStartDate: localDateKey(earliestStart, timezone, earliest.all_day),
      latestEndDate: localDateKey(latestEnd, timezone, latest.all_day),
      confidence: sorted.length >= 2 ? "high" : "low",
      suggestedSession: null,
    };
    group.suggestedSession = findExistingSessionForWeekend(group, sessions);
    weekendGroups.push(group);
  }

  weekendGroups.sort((a, b) => a.weekendStart.localeCompare(b.weekendStart));

  return { weekendGroups, manualReviewEvents };
}

/** Piątek weekendu, do którego należy dana chwila — używane do wykrywania "przeniesiono na inny weekend" (sekcja 14). Null dla poniedziałku-czwartku. */
export function weekendStartForInstant(iso: string, timezone: string, allDay: boolean): string | null {
  const dateKey = localDateKey(iso, timezone, allDay);
  const weekday = localWeekday(iso, timezone, allDay);
  return weekendStartForWeekday(dateKey, weekday);
}

/** Lokalna godzina "HH:MM" wydarzenia w danej strefie czasowej — do wypełniania start_time/end_time punktu planu zajęć. */
export function localTimeOfDay(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
    new Date(iso),
  );
}
