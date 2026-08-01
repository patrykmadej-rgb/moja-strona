import { extractSessionReference } from "@/lib/szkola/importFieldExtraction";
import type { SchoolSession } from "@/lib/szkola/types";

export type ImportSessionMatch = { session: SchoolSession; confidence: "high" | "low"; reason: string };

function dateOverlapsSession(dateIso: string, session: SchoolSession): boolean {
  const d = new Date(dateIso).getTime();
  if (Number.isNaN(d)) return false;
  const start = new Date(`${session.start_date}T00:00:00Z`).getTime();
  const end = new Date(`${session.end_date ?? session.start_date}T23:59:59Z`).getTime();
  return d >= start && d <= end;
}

/**
 * Proponuje zjazd dla importu (sekcja 13): najpierw jawne odwołanie tekstowe
 * ("Zjazd VI"), potem nakładanie się dat (start_at / check-in / check-out).
 * Wysoka pewność tylko przy jednoznacznym dopasowaniu — inaczej caller
 * pokazuje propozycję do ręcznego potwierdzenia zamiast przypisywać automatycznie.
 */
export function matchImportToSession(
  input: { text: string; startAt?: string | null; checkIn?: string | null; checkOut?: string | null },
  sessions: SchoolSession[],
): ImportSessionMatch | null {
  const ref = extractSessionReference(input.text);
  if (ref.number != null) {
    const bySessionNumber = sessions.find((s) => s.session_number === ref.number);
    if (bySessionNumber) {
      return { session: bySessionNumber, confidence: "high", reason: `treść wspomina „${ref.label}”` };
    }
  }

  const candidateDates = [input.startAt, input.checkIn, input.checkOut].filter((d): d is string => Boolean(d));
  const overlapping = sessions.filter((session) => candidateDates.some((date) => dateOverlapsSession(date, session)));

  if (overlapping.length === 1) {
    return { session: overlapping[0], confidence: "high", reason: "data pokrywa się z terminem zjazdu" };
  }
  if (overlapping.length > 1) {
    return { session: overlapping[0], confidence: "low", reason: "kilka zjazdów pokrywa się terminem" };
  }

  return null;
}
