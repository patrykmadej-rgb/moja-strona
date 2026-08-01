import { describe, expect, it } from "vitest";
import { matchImportToSession } from "./importSessionMatching";
import type { SchoolSession } from "./types";

function makeSession(overrides: Partial<SchoolSession>): SchoolSession {
  return {
    id: "session-id",
    session_number: null,
    title: "Zjazd",
    topic: null,
    city: null,
    venue: null,
    start_date: "2026-09-18",
    end_date: "2026-09-20",
    lead_trainer: null,
    status: "planowanie",
    training_year: null,
    notes: null,
    planned_budget: null,
    planned_budget_currency: null,
    created_by: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("matchImportToSession", () => {
  it("matches by explicit text reference (Zjazd VI) with high confidence, even if dates don't overlap", () => {
    const zjazd6 = makeSession({ id: "s6", session_number: 6, start_date: "2026-09-18", end_date: "2026-09-20" });
    const otherSession = makeSession({ id: "s1", session_number: 1, start_date: "2026-01-10", end_date: "2026-01-12" });

    const result = matchImportToSession(
      { text: "Potwierdzenie płatności — Opłata za zjazd VI", startAt: "2026-01-10T10:00:00.000Z" },
      [otherSession, zjazd6],
    );

    expect(result?.session.id).toBe("s6");
    expect(result?.confidence).toBe("high");
    expect(result?.reason).toContain("Zjazd VI");
  });

  it("falls back to date overlap when no session number is mentioned in the text, with high confidence for a single match", () => {
    const session = makeSession({ id: "s2", start_date: "2026-09-18", end_date: "2026-09-20" });
    const other = makeSession({ id: "s3", start_date: "2026-01-01", end_date: "2026-01-03" });

    const result = matchImportToSession({ text: "Potwierdzenie rezerwacji hotelu", startAt: "2026-09-19T00:00:00.000Z" }, [session, other]);

    expect(result?.session.id).toBe("s2");
    expect(result?.confidence).toBe("high");
    expect(result?.reason).toContain("data pokrywa się");
  });

  it("checks check-in/check-out dates too, not just startAt", () => {
    const session = makeSession({ id: "s4", start_date: "2026-09-18", end_date: "2026-09-20" });

    const result = matchImportToSession({ text: "Rezerwacja hotelu", checkIn: "2026-09-19T00:00:00.000Z" }, [session]);

    expect(result?.session.id).toBe("s4");
    expect(result?.confidence).toBe("high");
  });

  it("returns low confidence when the date range overlaps multiple sessions", () => {
    const sessionA = makeSession({ id: "sA", start_date: "2026-09-18", end_date: "2026-09-22" });
    const sessionB = makeSession({ id: "sB", start_date: "2026-09-20", end_date: "2026-09-25" });

    const result = matchImportToSession({ text: "Rezerwacja hotelu", startAt: "2026-09-21T00:00:00.000Z" }, [sessionA, sessionB]);

    expect(result?.confidence).toBe("low");
    expect(result?.reason).toContain("kilka zjazdów");
  });

  it("returns null when there is no textual reference and no date overlap", () => {
    const session = makeSession({ id: "s5", start_date: "2026-09-18", end_date: "2026-09-20" });

    const result = matchImportToSession({ text: "Wiadomość bez żadnych dat", startAt: "2026-01-01T00:00:00.000Z" }, [session]);

    expect(result).toBeNull();
  });

  it("returns null when no dates are provided and there is no session-number reference", () => {
    const session = makeSession({ id: "s7" });

    const result = matchImportToSession({ text: "Brak jakichkolwiek wskazówek" }, [session]);

    expect(result).toBeNull();
  });

  it("prefers explicit numeric session reference over an ambiguous date overlap", () => {
    const zjazd2 = makeSession({ id: "s2num", session_number: 2, start_date: "2026-01-01", end_date: "2026-01-03" });
    const overlapping = makeSession({ id: "sOverlap", start_date: "2026-09-18", end_date: "2026-09-20" });

    const result = matchImportToSession({ text: "Zjazd nr 2 — faktura", startAt: "2026-09-19T00:00:00.000Z" }, [zjazd2, overlapping]);

    expect(result?.session.id).toBe("s2num");
    expect(result?.confidence).toBe("high");
  });
});
