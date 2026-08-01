import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchIcsFeed, parseIcsEvents } from "./icsCalendar";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]),
}));

// Fikcyjne dane testowe — NIE prawdziwy link szkoły.
const SIMPLE_EVENT_ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//PL
BEGIN:VEVENT
UID:zjazd-1@test.invalid
DTSTAMP:20260101T090000Z
DTSTART:20260918T080000Z
DTEND:20260918T170000Z
SUMMARY:Zjazd I
LOCATION:Sala 204
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

const ALL_DAY_EVENT_ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//PL
BEGIN:VEVENT
UID:zjazd-allday@test.invalid
DTSTAMP:20260101T090000Z
DTSTART;VALUE=DATE:20260920
DTEND;VALUE=DATE:20260921
SUMMARY:Zjazd całodniowy
END:VEVENT
END:VCALENDAR`;

const CANCELLED_EVENT_ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//PL
BEGIN:VEVENT
UID:zjazd-cancelled@test.invalid
DTSTAMP:20260101T090000Z
DTSTART:20260918T080000Z
DTEND:20260918T170000Z
SUMMARY:Zjazd odwołany
STATUS:CANCELLED
END:VEVENT
END:VCALENDAR`;

const TIMEZONE_EVENT_ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//PL
BEGIN:VTIMEZONE
TZID:Europe/Warsaw
BEGIN:STANDARD
DTSTART:19961027T030000
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
END:STANDARD
BEGIN:DAYLIGHT
DTSTART:19970330T020000
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
END:DAYLIGHT
END:VTIMEZONE
BEGIN:VEVENT
UID:zjazd-tz@test.invalid
DTSTAMP:20260101T090000Z
DTSTART;TZID=Europe/Warsaw:20260918T090000
DTEND;TZID=Europe/Warsaw:20260918T170000
SUMMARY:Zjazd ze strefą czasową
END:VEVENT
END:VCALENDAR`;

// Cykliczne comiesięczne superwizje (5 pierwszych sobót), z jednym
// wyjątkiem (EXDATE) i jedną nadpisaną godziną (RECURRENCE-ID override).
const RECURRING_EVENT_ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//PL
BEGIN:VEVENT
UID:superwizja@test.invalid
DTSTAMP:20260101T090000Z
DTSTART:20260110T100000Z
DTEND:20260110T120000Z
SUMMARY:Superwizja grupowa
RRULE:FREQ=WEEKLY;COUNT=5
EXDATE:20260124T100000Z
END:VEVENT
BEGIN:VEVENT
UID:superwizja@test.invalid
RECURRENCE-ID:20260207T100000Z
DTSTAMP:20260101T090000Z
DTSTART:20260207T130000Z
DTEND:20260207T150000Z
SUMMARY:Superwizja grupowa (zmieniona godzina)
END:VEVENT
END:VCALENDAR`;

describe("parseIcsEvents", () => {
  it("parsuje proste wydarzenie godzinowe", () => {
    const events = parseIcsEvents(SIMPLE_EVENT_ICS, new Date("2026-01-01"));
    expect(events).toHaveLength(1);
    expect(events[0].google_event_id).toBe("zjazd-1@test.invalid");
    expect(events[0].title).toBe("Zjazd I");
    expect(events[0].location).toBe("Sala 204");
    expect(events[0].all_day).toBe(false);
    expect(events[0].status).toBe("confirmed");
    expect(events[0].start_at).toBe("2026-09-18T08:00:00.000Z");
    expect(events[0].end_at).toBe("2026-09-18T17:00:00.000Z");
  });

  it("rozpoznaje wydarzenie całodniowe", () => {
    const events = parseIcsEvents(ALL_DAY_EVENT_ICS, new Date("2026-01-01"));
    expect(events).toHaveLength(1);
    expect(events[0].all_day).toBe(true);
  });

  it("rozpoznaje wydarzenie anulowane", () => {
    const events = parseIcsEvents(CANCELLED_EVENT_ICS, new Date("2026-01-01"));
    expect(events).toHaveLength(1);
    expect(events[0].status).toBe("cancelled");
  });

  it("odczytuje strefę czasową z VTIMEZONE/TZID", () => {
    const events = parseIcsEvents(TIMEZONE_EVENT_ICS, new Date("2026-01-01"));
    expect(events).toHaveLength(1);
    expect(events[0].timezone).toBe("Europe/Warsaw");
    // 09:00 czasu Warszawy we wrześniu (czas letni, UTC+2) = 07:00 UTC.
    expect(events[0].start_at).toBe("2026-09-18T07:00:00.000Z");
  });

  it("rozwija wydarzenie cykliczne (RRULE), pomija EXDATE i stosuje RECURRENCE-ID override", () => {
    const events = parseIcsEvents(RECURRING_EVENT_ICS, new Date("2026-01-01"));
    // COUNT=5 co tydzień od 10.01, minus 1 wyjątek (24.01) = 4 wystąpienia.
    expect(events).toHaveLength(4);

    const starts = events.map((e) => e.start_at).sort();
    expect(starts).not.toContain("2026-01-24T10:00:00.000Z");

    const overridden = events.find((e) => e.start_at === "2026-02-07T13:00:00.000Z");
    expect(overridden).toBeDefined();
    expect(overridden?.title).toBe("Superwizja grupowa (zmieniona godzina)");
    expect(overridden?.recurring_event_id).toBe("superwizja@test.invalid");
    expect(overridden?.original_start_time).toBe("2026-02-07T10:00:00.000Z");
    expect(overridden?.google_event_id).not.toBe("superwizja@test.invalid");

    const nonOverridden = events.find((e) => e.start_at === "2026-01-10T10:00:00.000Z");
    expect(nonOverridden?.google_event_id).toBe("superwizja@test.invalid");
  });

  it("wykrywa zmianę godziny między dwoma synchronizacjami (ten sam UID, inny start_at)", () => {
    const before = parseIcsEvents(SIMPLE_EVENT_ICS, new Date("2026-01-01"))[0];
    const changedIcs = SIMPLE_EVENT_ICS.replace("DTEND:20260918T170000Z", "DTEND:20260918T190000Z");
    const after = parseIcsEvents(changedIcs, new Date("2026-01-01"))[0];

    expect(before.google_event_id).toBe(after.google_event_id);
    expect(before.end_at).not.toBe(after.end_at);
    expect(before.raw_hash).not.toBe(after.raw_hash);
  });

  it("wykrywa zmianę lokalizacji", () => {
    const before = parseIcsEvents(SIMPLE_EVENT_ICS, new Date("2026-01-01"))[0];
    const changedIcs = SIMPLE_EVENT_ICS.replace("LOCATION:Sala 204", "LOCATION:Sala 315");
    const after = parseIcsEvents(changedIcs, new Date("2026-01-01"))[0];

    expect(before.location).toBe("Sala 204");
    expect(after.location).toBe("Sala 315");
    expect(before.raw_hash).not.toBe(after.raw_hash);
  });
});

describe("fetchIcsFeed", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("zwraca status ok i treść przy poprawnym feedzie ICS", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(SIMPLE_EVENT_ICS, { status: 200, headers: { etag: '"abc"' } })),
    );
    const result = await fetchIcsFeed("https://calendar.example.com/basic.ics");
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.body).toContain("BEGIN:VCALENDAR");
      expect(result.etag).toBe('"abc"');
    }
  });

  it("odrzuca odpowiedź, która nie wygląda jak ICS", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>nie kalendarz</html>", { status: 200 })));
    const result = await fetchIcsFeed("https://calendar.example.com/not-ics.html");
    expect(result.status).toBe("error");
  });

  it("obsługuje 404", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not found", { status: 404 })));
    const result = await fetchIcsFeed("https://calendar.example.com/missing.ics");
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.httpStatus).toBe(404);
  });

  it("obsługuje 401/403", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("forbidden", { status: 403 })));
    const result = await fetchIcsFeed("https://calendar.example.com/private.ics");
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.httpStatus).toBe(403);
  });

  it("obsługuje 304 Not Modified bez tworzenia błędu", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 304 })));
    const result = await fetchIcsFeed("https://calendar.example.com/basic.ics", { etag: '"abc"' });
    expect(result.status).toBe("not_modified");
  });

  it("odrzuca niepoprawny adres URL przed jakimkolwiek fetchem", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const result = await fetchIcsFeed("not a url");
    expect(result.status).toBe("error");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("blokuje adresy SSRF (localhost) przed fetchem", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const result = await fetchIcsFeed("http://127.0.0.1/basic.ics");
    expect(result.status).toBe("error");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
