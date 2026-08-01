import "server-only";
import ical, { type VEvent } from "node-ical";
import { createHash } from "node:crypto";
import { assertPublicHttpUrl, parseIcsUrlOrThrow, UnsafeUrlError } from "@/lib/szkola/urlSafety";
import type { NormalizedCalendarEvent } from "@/lib/szkola/types";

const MAX_BODY_LENGTH = 10 * 1024 * 1024; // 10 MB — rozsądny limit na plik ICS
const FETCH_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 5;
// Okno, w którym rozwijamy cykliczne wydarzenia (RRULE) na pojedyncze
// wystąpienia — zdarzenia bez RRULE są uwzględniane zawsze, niezależnie
// od tego okna (patrz parseIcsEvents).
const EXPAND_WINDOW_PAST_MS = 2 * 365 * 24 * 60 * 60 * 1000;
const EXPAND_WINDOW_FUTURE_MS = 3 * 365 * 24 * 60 * 60 * 1000;

export type IcsFetchErrorReason =
  | "invalid_url"
  | "unsafe_url"
  | "timeout"
  | "network_error"
  | "http_error"
  | "too_large"
  | "not_icalendar";

export type IcsFetchResult =
  | { status: "ok"; httpStatus: number; body: string; etag: string | null; lastModified: string | null }
  | { status: "not_modified"; httpStatus: number }
  | { status: "error"; httpStatus: number | null; errorMessage: string; reason: IcsFetchErrorReason };

/**
 * Pobiera surowy feed ICS z ochroną przed SSRF — łącznie z przekierowaniami
 * (redirect: "manual" + ręczne podążanie za Location, walidując KAŻDY
 * kolejny adres, żeby złośliwy/przejęty serwer nie mógł przekierować na
 * adres wewnętrzny po przejściu pierwszej walidacji).
 */
export async function fetchIcsFeed(
  rawUrl: string,
  conditional: { etag?: string | null; lastModified?: string | null } = {},
): Promise<IcsFetchResult> {
  let url: URL;
  try {
    url = parseIcsUrlOrThrow(rawUrl);
  } catch (err) {
    return {
      status: "error",
      httpStatus: null,
      errorMessage: err instanceof Error ? err.message : "Nieprawidłowy adres kalendarza.",
      reason: "invalid_url",
    };
  }

  const headers: Record<string, string> = { Accept: "text/calendar, text/plain, */*" };
  if (conditional.etag) headers["If-None-Match"] = conditional.etag;
  if (conditional.lastModified) headers["If-Modified-Since"] = conditional.lastModified;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    let currentUrl = url;
    let res: Response | null = null;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await assertPublicHttpUrl(currentUrl);
      res = await fetch(currentUrl.toString(), { headers, redirect: "manual", signal: controller.signal });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) break;
        currentUrl = parseIcsUrlOrThrow(new URL(location, currentUrl).toString());
        continue;
      }
      break;
    }
    clearTimeout(timeout);

    if (!res) {
      return { status: "error", httpStatus: null, errorMessage: "Nie udało się pobrać kalendarza.", reason: "network_error" };
    }
    if (res.status === 304) {
      return { status: "not_modified", httpStatus: 304 };
    }
    if (res.status >= 300 && res.status < 400) {
      return { status: "error", httpStatus: res.status, errorMessage: "Zbyt wiele przekierowań.", reason: "network_error" };
    }
    if (!res.ok) {
      return {
        status: "error",
        httpStatus: res.status,
        errorMessage: `Serwer zwrócił błąd HTTP ${res.status}.`,
        reason: "http_error",
      };
    }

    const body = await res.text();
    if (body.length > MAX_BODY_LENGTH) {
      return { status: "error", httpStatus: res.status, errorMessage: "Plik kalendarza jest zbyt duży.", reason: "too_large" };
    }
    if (!body.includes("BEGIN:VCALENDAR")) {
      return {
        status: "error",
        httpStatus: res.status,
        errorMessage: "Nie udało się odczytać kalendarza. Sprawdź, czy link jest aktualny i prowadzi do pliku ICS.",
        reason: "not_icalendar",
      };
    }

    return {
      status: "ok",
      httpStatus: res.status,
      body,
      etag: res.headers.get("etag"),
      lastModified: res.headers.get("last-modified"),
    };
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      return {
        status: "error",
        httpStatus: null,
        errorMessage: "Przekroczono czas oczekiwania na odpowiedź serwera kalendarza.",
        reason: "timeout",
      };
    }
    if (err instanceof UnsafeUrlError) {
      return { status: "error", httpStatus: null, errorMessage: err.message, reason: "unsafe_url" };
    }
    return {
      status: "error",
      httpStatus: null,
      errorMessage: err instanceof Error ? err.message : "Nie udało się odczytać kalendarza. Sprawdź, czy link jest aktualny i prowadzi do pliku ICS.",
      reason: "network_error",
    };
  }
}

function textValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value || null;
  if (typeof value === "object" && "val" in (value as Record<string, unknown>)) {
    const val = (value as { val: unknown }).val;
    return typeof val === "string" ? val || null : null;
  }
  return null;
}

function extractEmail(value: unknown): string | null {
  const raw = textValue(value);
  if (!raw) return null;
  return raw.replace(/^mailto:/i, "");
}

function toIsoOrNull(date: Date | null | undefined): string | null {
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeInstance(
  masterUid: string,
  event: VEvent,
  start: Date | undefined,
  end: Date | undefined,
  allDay: boolean,
  isOverride: boolean,
): NormalizedCalendarEvent {
  const startIso = toIsoOrNull(start);
  const endIso = toIsoOrNull(end ?? start);
  const eventId = isOverride && startIso ? `${masterUid}::${startIso}` : masterUid;

  const rruleText = event.rrule ? event.rrule.toString() : null;

  const normalized: Omit<NormalizedCalendarEvent, "raw_hash"> = {
    google_event_id: eventId,
    ical_uid: masterUid,
    title: textValue(event.summary),
    description: textValue(event.description),
    location: textValue(event.location),
    start_at: startIso,
    end_at: endIso,
    all_day: allDay,
    timezone: (start as (Date & { tz?: string }) | undefined)?.tz ?? null,
    status: event.status ? event.status.toLowerCase() : null,
    organizer_email: extractEmail(event.organizer),
    attendees: null,
    attachments: null,
    recurrence: rruleText ? [rruleText.startsWith("RRULE:") ? rruleText : `RRULE:${rruleText}`] : null,
    recurring_event_id: isOverride ? masterUid : null,
    original_start_time: isOverride ? toIsoOrNull(event.recurrenceid) : null,
    google_updated_at: toIsoOrNull(event.lastmodified ?? event.dtstamp),
    html_link: typeof event.url === "string" ? event.url : null,
  };

  const hash = createHash("sha256")
    .update(
      JSON.stringify({
        title: normalized.title,
        description: normalized.description,
        location: normalized.location,
        start_at: normalized.start_at,
        end_at: normalized.end_at,
        timezone: normalized.timezone,
        status: normalized.status,
        organizer_email: normalized.organizer_email,
        attachments: normalized.attachments,
        recurrence: normalized.recurrence,
      }),
    )
    .digest("hex");

  return { ...normalized, raw_hash: hash };
}

/**
 * Parsuje tekst ICS na tablicę znormalizowanych wydarzeń (ten sam kształt
 * co wydarzenia z Google Calendar API — patrz NormalizedCalendarEvent).
 * Wydarzenia cykliczne (RRULE) są rozwijane na pojedyncze wystąpienia w
 * ograniczonym oknie czasowym (`now`), z zastosowaniem wyjątków RECURRENCE-ID
 * i wykluczeniem dat z EXDATE — to robi bezpośrednio node-ical
 * (`expandRecurringEvent`), więc nie parsujemy RRULE ręcznie. Wydarzenia
 * bez RRULE są zawsze uwzględniane, niezależnie od okna.
 */
export function parseIcsEvents(icsText: string, now: Date = new Date()): NormalizedCalendarEvent[] {
  const parsed = ical.sync.parseICS(icsText);
  const results: NormalizedCalendarEvent[] = [];

  const windowStart = new Date(now.getTime() - EXPAND_WINDOW_PAST_MS);
  const windowEnd = new Date(now.getTime() + EXPAND_WINDOW_FUTURE_MS);

  for (const component of Object.values(parsed)) {
    if (!component || typeof component !== "object" || (component as { type?: string }).type !== "VEVENT") continue;
    const event = component as VEvent;

    if (event.rrule) {
      const instances = ical.expandRecurringEvent(event, {
        from: windowStart,
        to: windowEnd,
        includeOverrides: true,
        excludeExdates: true,
      });
      for (const instance of instances) {
        results.push(
          normalizeInstance(event.uid, instance.event, instance.start, instance.end, instance.isFullDay, instance.isOverride),
        );
      }
    } else {
      results.push(normalizeInstance(event.uid, event, event.start, event.end ?? event.start, event.datetype === "date", false));
    }
  }

  return results;
}
