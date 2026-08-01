import "server-only";
import { createHash } from "node:crypto";
import type { NormalizedCalendarEvent } from "@/lib/szkola/types";

/**
 * Cienki klient Google OAuth 2.0 + Calendar API (tylko odczyt).
 * Wyłącznie server-only — nigdy nie importuj z komponentu klienckiego.
 *
 * Wymagane zmienne środowiskowe (patrz `isGoogleCalendarConfigured`):
 * GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI.
 */

export const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI,
  );
}

function requireGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Integracja wymaga konfiguracji Google Cloud (brak GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI).",
    );
  }
  return { clientId, clientSecret, redirectUri };
}

export function buildGoogleAuthUrl(state: string): string {
  const { clientId, redirectUri } = requireGoogleConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: GOOGLE_CALENDAR_SCOPE,
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret, redirectUri } = requireGoogleConfig();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Nie udało się wymienić kodu autoryzacji na token Google (HTTP ${res.status}). ${body}`);
  }

  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = requireGoogleConfig();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Nie udało się odświeżyć tokenu Google (HTTP ${res.status}). ${body}`);
  }

  return res.json();
}

/** Best-effort — brak refresh tokenu do odwołania nie powinien blokować rozłączenia lokalnego. */
export async function revokeGoogleToken(token: string): Promise<void> {
  try {
    await fetch(`${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(token)}`, { method: "POST" });
  } catch {
    // Ignorujemy błąd sieci przy odwoływaniu — rozłączenie lokalne (usunięcie
    // wiersza connections) i tak następuje niezależnie od tego wywołania.
  }
}

export type GoogleCalendarListEntry = {
  id: string;
  summary: string;
  backgroundColor?: string;
  primary?: boolean;
  accessRole?: string;
};

export async function listGoogleCalendars(accessToken: string): Promise<GoogleCalendarListEntry[]> {
  const res = await fetch(`${CALENDAR_API_BASE}/users/me/calendarList?minAccessRole=freeBusyReader`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Nie udało się pobrać listy kalendarzy Google (HTTP ${res.status}). ${body}`);
  }

  const data = await res.json();
  return (data.items ?? []) as GoogleCalendarListEntry[];
}

type GoogleEventDateTime = { date?: string; dateTime?: string; timeZone?: string };

export type GoogleCalendarEventRaw = {
  id: string;
  iCalUID?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: GoogleEventDateTime;
  end?: GoogleEventDateTime;
  status?: string;
  updated?: string;
  htmlLink?: string;
  organizer?: { email?: string; displayName?: string };
  attendees?: { email?: string; responseStatus?: string }[];
  attachments?: { title?: string; fileUrl?: string; mimeType?: string }[];
  recurrence?: string[];
  recurringEventId?: string;
  originalStartTime?: GoogleEventDateTime;
};

export type GoogleEventsPage = {
  events: GoogleCalendarEventRaw[];
  nextSyncToken: string | null;
  syncTokenInvalid: boolean;
};

/**
 * Pobiera wydarzenia z kalendarza. Jeśli podano syncToken, pobiera tylko
 * różnicę od poprzedniej synchronizacji (Google Calendar incremental sync).
 * Jeśli Google odrzuci syncToken (HTTP 410 — token wygasł/nieprawidłowy),
 * zwraca syncTokenInvalid=true — wywołujący musi wykonać pełną synchronizację
 * (bez syncToken, z timeMin).
 *
 * showDeleted=true i singleEvents=false celowo: chcemy widzieć zarówno
 * skasowane/anulowane wydarzenia (status="cancelled"), jak i wydarzenia
 * cykliczne jako pojedynczy "master" event z polem recurrence (a nie setki
 * rozwiniętych wystąpień) — wyjątki w seriach i tak przychodzą osobno,
 * gdy zostały indywidualnie zmienione (mają recurringEventId).
 */
export async function listGoogleEvents(
  accessToken: string,
  calendarId: string,
  options: { syncToken?: string | null; timeMin?: string } = {},
): Promise<GoogleEventsPage> {
  const events: GoogleCalendarEventRaw[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | null = null;

  for (;;) {
    const params = new URLSearchParams({
      showDeleted: "true",
      singleEvents: "false",
      maxResults: "250",
    });
    if (options.syncToken) {
      params.set("syncToken", options.syncToken);
    } else if (options.timeMin) {
      params.set("timeMin", options.timeMin);
    }
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 410) {
      return { events: [], nextSyncToken: null, syncTokenInvalid: true };
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Nie udało się pobrać wydarzeń z Google Calendar (HTTP ${res.status}). ${body}`);
    }

    const data = await res.json();
    events.push(...((data.items ?? []) as GoogleCalendarEventRaw[]));

    if (data.nextPageToken) {
      pageToken = data.nextPageToken;
      continue;
    }
    nextSyncToken = data.nextSyncToken ?? null;
    break;
  }

  return { events, nextSyncToken, syncTokenInvalid: false };
}

function toIso(dt: GoogleEventDateTime | undefined): { value: string | null; allDay: boolean } {
  if (!dt) return { value: null, allDay: false };
  if (dt.dateTime) return { value: new Date(dt.dateTime).toISOString(), allDay: false };
  if (dt.date) return { value: new Date(`${dt.date}T00:00:00Z`).toISOString(), allDay: true };
  return { value: null, allDay: false };
}

export function normalizeGoogleEvent(raw: GoogleCalendarEventRaw): NormalizedCalendarEvent {
  const start = toIso(raw.start);
  const end = toIso(raw.end);
  const originalStart = toIso(raw.originalStartTime);

  const normalized: Omit<NormalizedCalendarEvent, "raw_hash"> = {
    google_event_id: raw.id,
    ical_uid: raw.iCalUID ?? null,
    title: raw.summary ?? null,
    description: raw.description ?? null,
    location: raw.location ?? null,
    start_at: start.value,
    end_at: end.value,
    all_day: start.allDay,
    timezone: raw.start?.timeZone ?? null,
    status: raw.status ?? null,
    organizer_email: raw.organizer?.email ?? null,
    attendees: raw.attendees && raw.attendees.length > 0 ? raw.attendees : null,
    attachments: raw.attachments && raw.attachments.length > 0 ? raw.attachments : null,
    recurrence: raw.recurrence && raw.recurrence.length > 0 ? raw.recurrence : null,
    recurring_event_id: raw.recurringEventId ?? null,
    original_start_time: originalStart.value,
    google_updated_at: raw.updated ?? null,
    html_link: raw.htmlLink ?? null,
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
