import { describe, expect, it } from "vitest";
import {
  findExistingSessionForWeekend,
  groupCalendarEventsIntoWeekends,
  localDateKey,
  shiftDateKey,
  weekendStartForInstant,
  type GroupableCalendarEvent,
} from "./calendarWeekendGrouping";
import type { SchoolSession } from "./types";

const WARSAW = "Europe/Warsaw";

let idCounter = 0;
function makeEvent(overrides: Partial<GroupableCalendarEvent> & { start_at: string }): GroupableCalendarEvent {
  idCounter += 1;
  return {
    id: `event-${idCounter}`,
    google_event_id: `event-${idCounter}@test.invalid`,
    title: "Zjazd",
    description: null,
    location: null,
    end_at: null,
    all_day: false,
    ...overrides,
  };
}

function makeSession(overrides: Partial<SchoolSession> & { start_date: string }): SchoolSession {
  return {
    id: "session-1",
    session_number: null,
    title: "Zjazd 1",
    topic: null,
    city: null,
    venue: null,
    end_date: null,
    lead_trainer: null,
    status: "planowanie",
    training_year: null,
    notes: null,
    planned_budget: null,
    planned_budget_currency: null,
    created_by: null,
    created_at: "",
    updated_at: "",
    created_from_calendar: false,
    semester_id: null,
    lodging_not_needed: false,
    ...overrides,
  };
}

describe("groupCalendarEventsIntoWeekends", () => {
  it("grupuje piątek + sobota + niedziela w jeden zjazd", () => {
    const events = [
      makeEvent({ start_at: "2026-09-04T13:00:00.000Z" }), // piątek 15:00 Warszawa
      makeEvent({ start_at: "2026-09-05T07:00:00.000Z" }), // sobota 09:00
      makeEvent({ start_at: "2026-09-05T13:00:00.000Z" }), // sobota 15:00
      makeEvent({ start_at: "2026-09-06T07:00:00.000Z" }), // niedziela 09:00
      makeEvent({ start_at: "2026-09-06T13:00:00.000Z", end_at: "2026-09-06T14:00:00.000Z" }), // niedziela 15:00-16:00
    ];
    const { weekendGroups, manualReviewEvents } = groupCalendarEventsIntoWeekends(events, WARSAW);

    expect(weekendGroups).toHaveLength(1);
    expect(manualReviewEvents).toHaveLength(0);
    expect(weekendGroups[0].weekendStart).toBe("2026-09-04");
    expect(weekendGroups[0].weekendEnd).toBe("2026-09-06");
    expect(weekendGroups[0].events).toHaveLength(5);
    expect(weekendGroups[0].confidence).toBe("high");
  });

  it("wyznacza weekendStart jako piątek nawet gdy jest tylko sobota + niedziela", () => {
    const events = [
      makeEvent({ start_at: "2026-09-05T07:00:00.000Z" }), // sobota
      makeEvent({ start_at: "2026-09-06T07:00:00.000Z" }), // niedziela
    ];
    const { weekendGroups } = groupCalendarEventsIntoWeekends(events, WARSAW);

    expect(weekendGroups).toHaveLength(1);
    expect(weekendGroups[0].weekendStart).toBe("2026-09-04");
    expect(weekendGroups[0].confidence).toBe("high");
  });

  it("rozdziela dwa kolejne weekendy na dwie osobne grupy", () => {
    const events = [
      makeEvent({ start_at: "2026-09-05T07:00:00.000Z" }),
      makeEvent({ start_at: "2026-09-06T07:00:00.000Z" }),
      makeEvent({ start_at: "2026-09-12T07:00:00.000Z" }),
      makeEvent({ start_at: "2026-09-13T07:00:00.000Z" }),
    ];
    const { weekendGroups } = groupCalendarEventsIntoWeekends(events, WARSAW);

    expect(weekendGroups).toHaveLength(2);
    expect(weekendGroups.map((g) => g.weekendStart)).toEqual(["2026-09-04", "2026-09-11"]);
    expect(weekendGroups.every((g) => g.confidence === "high")).toBe(true);
  });

  it("wydarzenie w czwartek bez sąsiedniego weekendu trafia do manualReviewEvents", () => {
    const events = [makeEvent({ start_at: "2026-09-03T08:00:00.000Z" })]; // czwartek, samotne
    const { weekendGroups, manualReviewEvents } = groupCalendarEventsIntoWeekends(events, WARSAW);

    expect(weekendGroups).toHaveLength(0);
    expect(manualReviewEvents).toHaveLength(1);
    expect(manualReviewEvents[0].reason).toBe("weekday");
  });

  it("wydarzenie w poniedziałek bez sąsiedniego weekendu trafia do manualReviewEvents", () => {
    const events = [makeEvent({ start_at: "2026-09-07T08:00:00.000Z" })]; // poniedziałek, samotne
    const { weekendGroups, manualReviewEvents } = groupCalendarEventsIntoWeekends(events, WARSAW);

    expect(weekendGroups).toHaveLength(0);
    expect(manualReviewEvents).toHaveLength(1);
  });

  it("dopina czwartek do sąsiedniego weekendu, gdy ten weekend już istnieje (bliskość)", () => {
    const events = [
      makeEvent({ start_at: "2026-09-03T08:00:00.000Z" }), // czwartek 03.09
      makeEvent({ start_at: "2026-09-04T13:00:00.000Z" }), // piątek 04.09
      makeEvent({ start_at: "2026-09-05T07:00:00.000Z" }), // sobota 05.09
    ];
    const { weekendGroups, manualReviewEvents } = groupCalendarEventsIntoWeekends(events, WARSAW);

    expect(manualReviewEvents).toHaveLength(0);
    expect(weekendGroups).toHaveLength(1);
    expect(weekendGroups[0].events).toHaveLength(3);
  });

  it("dopina poniedziałek do poprzedniego weekendu, gdy ten weekend już istnieje (bliskość)", () => {
    const events = [
      makeEvent({ start_at: "2026-09-05T07:00:00.000Z" }), // sobota
      makeEvent({ start_at: "2026-09-06T07:00:00.000Z" }), // niedziela
      makeEvent({ start_at: "2026-09-07T08:00:00.000Z" }), // poniedziałek 07.09
    ];
    const { weekendGroups, manualReviewEvents } = groupCalendarEventsIntoWeekends(events, WARSAW);

    expect(manualReviewEvents).toHaveLength(0);
    expect(weekendGroups).toHaveLength(1);
    expect(weekendGroups[0].events).toHaveLength(3);
  });

  it("nie grupuje całej serii cyklicznej razem — każde wystąpienie trafia do swojego weekendu", () => {
    // Superwizje w co drugą sobotę - dwa różne weekendy, dwie osobne grupy jednoelementowe.
    const events = [
      makeEvent({ start_at: "2026-09-05T09:00:00.000Z", google_event_id: "superwizja@test.invalid" }),
      makeEvent({ start_at: "2026-09-19T09:00:00.000Z", google_event_id: "superwizja@test.invalid::2026-09-19T09:00:00.000Z" }),
    ];
    const { weekendGroups } = groupCalendarEventsIntoWeekends(events, WARSAW);

    expect(weekendGroups).toHaveLength(2);
    expect(weekendGroups[0].confidence).toBe("low");
    expect(weekendGroups[1].confidence).toBe("low");
  });

  it("zmiana strefy czasowej zmienia przypisanie do weekendu", () => {
    // 23:30 UTC w czwartek = 01:30 w piątek czasu Warszawy (lato, +2).
    const events = [makeEvent({ start_at: "2026-09-03T23:30:00.000Z" })];

    const warsawResult = groupCalendarEventsIntoWeekends(events, WARSAW);
    expect(warsawResult.weekendGroups).toHaveLength(1);
    expect(warsawResult.weekendGroups[0].weekendStart).toBe("2026-09-04");
    expect(warsawResult.manualReviewEvents).toHaveLength(0);

    const utcResult = groupCalendarEventsIntoWeekends(events, "UTC");
    expect(utcResult.weekendGroups).toHaveLength(0);
    expect(utcResult.manualReviewEvents).toHaveLength(1); // wciąż czwartek w UTC
  });

  it("obsługuje wydarzenie całodniowe wg zapisanej daty, niezależnie od strefy", () => {
    const events = [makeEvent({ start_at: "2026-09-05T00:00:00.000Z", all_day: true })]; // sobota (DATE-only)
    const { weekendGroups } = groupCalendarEventsIntoWeekends(events, WARSAW);

    expect(weekendGroups).toHaveLength(1);
    expect(weekendGroups[0].weekendStart).toBe("2026-09-04");
  });

  it("obsługuje wydarzenie po północy (UTC data różni się od lokalnej)", () => {
    // 22:30 UTC w piątek 04.09 = 00:30 w sobotę 05.09 czasu Warszawy.
    const events = [makeEvent({ start_at: "2026-09-04T22:30:00.000Z" })];
    const { weekendGroups } = groupCalendarEventsIntoWeekends(events, WARSAW);

    expect(weekendGroups).toHaveLength(1);
    expect(weekendGroups[0].weekendStart).toBe("2026-09-04"); // nadal ten sam piątek (sobota należy do tego weekendu)
  });

  it("pojedyncze wydarzenie w weekend ma confidence 'low', nawet w piątek-niedzielę", () => {
    const events = [makeEvent({ start_at: "2026-09-05T09:00:00.000Z" })];
    const { weekendGroups } = groupCalendarEventsIntoWeekends(events, WARSAW);

    expect(weekendGroups).toHaveLength(1);
    expect(weekendGroups[0].confidence).toBe("low");
  });

  it("dopasowuje istniejący zjazd obejmujący dokładnie ten weekend", () => {
    const events = [
      makeEvent({ start_at: "2026-09-05T07:00:00.000Z" }),
      makeEvent({ start_at: "2026-09-06T07:00:00.000Z" }),
    ];
    const sessions = [makeSession({ start_date: "2026-09-04", end_date: "2026-09-06" })];
    const { weekendGroups } = groupCalendarEventsIntoWeekends(events, WARSAW, sessions);

    expect(weekendGroups[0].suggestedSession).not.toBeNull();
    expect(weekendGroups[0].suggestedSession?.start_date).toBe("2026-09-04");
  });

  it("nie dopasowuje zjazdu, którego zakres dat nie obejmuje weekendu", () => {
    const events = [
      makeEvent({ start_at: "2026-09-05T07:00:00.000Z" }),
      makeEvent({ start_at: "2026-09-06T07:00:00.000Z" }),
    ];
    const sessions = [makeSession({ start_date: "2026-10-02", end_date: "2026-10-04" })];
    const { weekendGroups } = groupCalendarEventsIntoWeekends(events, WARSAW, sessions);

    expect(weekendGroups[0].suggestedSession).toBeNull();
  });
});

describe("findExistingSessionForWeekend", () => {
  it("dopasowuje po zakresie dat zawierającym realne daty wydarzeń", () => {
    const group = { weekendStart: "2026-09-04", weekendEnd: "2026-09-06", earliestStartDate: "2026-09-05", latestEndDate: "2026-09-06" };
    const session = makeSession({ start_date: "2026-09-04", end_date: "2026-09-07" });
    expect(findExistingSessionForWeekend(group, [session])).toBe(session);
  });

  it("zwraca null, gdy żaden zjazd nie pasuje", () => {
    const group = { weekendStart: "2026-09-04", weekendEnd: "2026-09-06", earliestStartDate: "2026-09-04", latestEndDate: "2026-09-06" };
    expect(findExistingSessionForWeekend(group, [])).toBeNull();
  });
});

describe("helpers", () => {
  it("shiftDateKey przesuwa datę poprawnie przez granicę miesiąca", () => {
    expect(shiftDateKey("2026-10-01", -1)).toBe("2026-09-30");
    expect(shiftDateKey("2026-09-30", 2)).toBe("2026-10-02");
  });

  it("localDateKey zwraca lokalną datę dla strefy czasowej", () => {
    expect(localDateKey("2026-09-04T22:30:00.000Z", WARSAW, false)).toBe("2026-09-05");
    expect(localDateKey("2026-09-05T00:00:00.000Z", WARSAW, true)).toBe("2026-09-05");
  });

  it("weekendStartForInstant zwraca null dla poniedziałku-czwartku", () => {
    expect(weekendStartForInstant("2026-09-03T08:00:00.000Z", WARSAW, false)).toBeNull();
    expect(weekendStartForInstant("2026-09-05T07:00:00.000Z", WARSAW, false)).toBe("2026-09-04");
  });
});
