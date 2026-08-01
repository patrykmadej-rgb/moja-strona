import type { SchoolSession } from "@/lib/szkola/types";

export type SessionMatch = { session: SchoolSession; confidence: "high" | "low" };

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleMentionsSession(eventTitle: string, session: SchoolSession): boolean {
  const normalizedTitle = normalizeText(eventTitle);
  if (session.session_number && normalizedTitle.includes(String(session.session_number))) return true;

  const sessionWords = normalizeText(session.title)
    .split(" ")
    .filter((w) => w.length > 3);
  return sessionWords.some((word) => normalizedTitle.includes(word));
}

function dateRangeOverlaps(eventStart: string | null, eventEnd: string | null, session: SchoolSession): boolean {
  if (!eventStart) return false;
  const evStart = new Date(eventStart).getTime();
  const evEnd = eventEnd ? new Date(eventEnd).getTime() : evStart;
  const sessStart = new Date(`${session.start_date}T00:00:00Z`).getTime();
  const sessEnd = new Date(`${session.end_date ?? session.start_date}T23:59:59Z`).getTime();
  return evStart <= sessEnd && evEnd >= sessStart;
}

/**
 * Próbuje dopasować wydarzenie Google Calendar do rekordu zjazdu na
 * podstawie nakładania się dat (główne kryterium) i podobieństwa tytułu
 * (do rozstrzygania, gdy kilka zjazdów nakłada się terminami). Wysoka
 * pewność tylko wtedy, gdy dopasowanie jest jednoznaczne — inaczej caller
 * pokazuje użytkownikowi propozycję do ręcznego potwierdzenia zamiast
 * przypisywać automatycznie.
 */
export function matchEventToSession(
  event: { title: string | null; start_at: string | null; end_at: string | null },
  sessions: SchoolSession[],
): SessionMatch | null {
  const candidates = sessions.filter((s) => dateRangeOverlaps(event.start_at, event.end_at, s));
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return { session: candidates[0], confidence: "high" };

  const titleMatches = event.title ? candidates.filter((s) => titleMentionsSession(event.title!, s)) : [];
  if (titleMatches.length === 1) return { session: titleMatches[0], confidence: "high" };

  return { session: candidates[0], confidence: "low" };
}
