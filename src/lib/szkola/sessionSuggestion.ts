import type { SchoolSession, SegmentDirection } from "@/lib/szkola/types";

/**
 * Wspólny silnik dopasowania zjazdu (sekcja 6/14 briefu) — używany przez:
 *  - ręczny formularz odcinka podróży / zakwaterowania w ogólnych zakładkach
 *    (/lab/szkola/podroze, /lab/szkola/zakwaterowanie),
 *  - ponowne powiązywanie ("Zmień powiązanie"),
 *  - fallback dopasowania dat w module importu (importSessionMatching.ts —
 *    korzysta z eksportowanego niżej `scoreSessionsForSuggestion`, żeby NIE
 *    duplikować tej samej logiki scoringu, tylko inaczej agreguje wynik dla
 *    swojego przypadku: kilka niezależnych dat kandydujących naraz).
 *
 * Nigdy nie przypisuje niczego automatycznie — zwraca tylko sugestię
 * (confidence + powody) do pokazania użytkownikowi w modalu potwierdzenia.
 */

export type SessionSuggestionType = "travel" | "accommodation";
/** null = odcinek lokalny/inny — liczy się wyłącznie to, czy termin mieści się w oknie zjazdu. */
export type SessionSuggestionDirection = "tam" | "powrot" | null;

/** SegmentDirection ma 4 wartości (tam/powrot/lokalny/inny) — dla scoringu "lokalny" i "inny" liczą się identycznie jak brak kierunku (patrz komentarz przy SessionSuggestionDirection). */
export function toSuggestionDirection(direction: SegmentDirection | null): SessionSuggestionDirection {
  return direction === "tam" || direction === "powrot" ? direction : null;
}

export type FindSuggestedSessionInput = {
  type: SessionSuggestionType;
  /** travel: data/godzina wyjazdu (ISO datetime lub YYYY-MM-DD). accommodation: check-in. */
  startDate: string | null;
  /** travel: data/godzina przyjazdu. accommodation: check-out. */
  endDate: string | null;
  /** travel, kierunek "tam" — miejsce przyjazdu; kierunek "powrot"/null — pomocniczo. */
  destination?: string | null;
  /** travel, kierunek "powrot" — miejsce wyjazdu; kierunek "tam"/null — pomocniczo. */
  origin?: string | null;
  /** Tylko dla type: "travel". Brak/"null" = lokalny/inny odcinek. */
  direction?: SessionSuggestionDirection;
  /** Tylko dla type: "accommodation" — miasto obiektu. */
  city?: string | null;
  sessions: SchoolSession[];
};

export type SessionScore = { session: SchoolSession; score: number; reasons: string[] };

export type ConfidenceLabel = "bardzo_prawdopodobne" | "prawdopodobne" | "mozliwe";

export const CONFIDENCE_LABEL_TEXT: Record<ConfidenceLabel, string> = {
  bardzo_prawdopodobne: "Bardzo prawdopodobne",
  prawdopodobne: "Prawdopodobne",
  mozliwe: "Możliwe dopasowanie",
};

export type FindSuggestedSessionResult = {
  suggestedSession: SchoolSession | null;
  /** 0..1 — WYŁĄCZNIE do wewnętrznej logiki/sortowania, nigdy nie pokazuj tej liczby użytkownikowi (sekcja 6 briefu: pokaż confidenceLabel). */
  confidence: number;
  confidenceLabel: ConfidenceLabel | null;
  reasons: string[];
  /** Wszystkie pozostałe zjazdy, posortowane tak samo jak suggestedSession (najbardziej prawdopodobne, potem chronologicznie) — gotowe do listy "Wybierz inny zjazd". */
  alternativeSessions: SchoolSession[];
};

/** Próg, poniżej którego NIE pokazujemy sugestii wcale (sekcja 7 briefu) — lepiej brak sugestii niż fałszywe potwierdzenie. */
const SUGGESTION_THRESHOLD = 0.35;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseDateOnly(value: string): number | null {
  const datePart = value.slice(0, 10);
  const t = new Date(`${datePart}T00:00:00Z`).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Im bliżej "idealnej" daty, tym wyższy wkład do score — łagodny spadek zamiast ostrego progu. */
function scoreDateProximity(diffDays: number): number {
  const abs = Math.abs(diffDays);
  if (abs <= 1) return 0.65;
  if (abs <= 3) return 0.45;
  if (abs <= 7) return 0.25;
  if (abs <= 21) return 0.1;
  return 0;
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function locationMatches(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

function scoreTravel(session: SchoolSession, input: FindSuggestedSessionInput): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const sessionStart = parseDateOnly(session.start_date);
  if (sessionStart == null) return { score: 0, reasons };
  const sessionEnd = parseDateOnly(session.end_date ?? session.start_date) ?? sessionStart;

  const departure = input.startDate ? parseDateOnly(input.startDate) : null;
  const arrival = input.endDate ? parseDateOnly(input.endDate) : null;

  if (input.direction === "tam") {
    if (arrival != null) {
      const diffDays = (arrival - sessionStart) / DAY_MS;
      const dScore = scoreDateProximity(diffDays);
      if (dScore > 0) {
        score += dScore;
        reasons.push(
          Math.abs(diffDays) <= 1
            ? diffDays <= 0
              ? "Przyjazd dzień przed rozpoczęciem zjazdu lub w dniu rozpoczęcia"
              : "Przyjazd blisko rozpoczęcia zjazdu"
            : "Data przyjazdu zbliżona do terminu zjazdu",
        );
      }
    }
    if (locationMatches(input.destination, session.city)) {
      score += 0.35;
      reasons.push("Miejsce docelowe zgodne z lokalizacją zjazdu");
    }
  } else if (input.direction === "powrot") {
    if (departure != null) {
      const diffDays = (departure - sessionEnd) / DAY_MS;
      const dScore = scoreDateProximity(diffDays);
      if (dScore > 0) {
        score += dScore;
        reasons.push(
          Math.abs(diffDays) <= 1
            ? diffDays >= 0
              ? "Wyjazd w ostatnim dniu zjazdu lub dzień później"
              : "Wyjazd blisko zakończenia zjazdu"
            : "Data wyjazdu zbliżona do terminu zjazdu",
        );
      }
    }
    if (locationMatches(input.origin, session.city)) {
      score += 0.35;
      reasons.push("Miejsce rozpoczęcia zgodne z lokalizacją zjazdu");
    }
  } else {
    // Kierunek lokalny/inny/nieokreślony — liczy się wyłącznie, czy termin
    // mieści się w oknie zjazdu (albo jest blisko niego).
    const candidateDates = [departure, arrival].filter((d): d is number => d != null);
    const withinWindow = candidateDates.some((d) => d >= sessionStart && d <= sessionEnd);
    if (withinWindow) {
      score += 0.7;
      reasons.push("Termin mieści się w dniach trwania zjazdu");
    } else if (candidateDates.length > 0) {
      const minDiffDays = Math.min(
        ...candidateDates.map((d) => Math.min(Math.abs(d - sessionStart), Math.abs(d - sessionEnd)) / DAY_MS),
      );
      const dScore = scoreDateProximity(minDiffDays);
      if (dScore > 0) {
        score += dScore * 0.7;
        reasons.push("Termin zbliżony do dat zjazdu");
      }
    }
    if (locationMatches(input.destination, session.city) || locationMatches(input.origin, session.city)) {
      score += 0.25;
      reasons.push("Lokalizacja zgodna ze zjazdem");
    }
  }

  return { score: Math.min(score, 1), reasons };
}

function scoreAccommodation(session: SchoolSession, input: FindSuggestedSessionInput): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const sessionStart = parseDateOnly(session.start_date);
  if (sessionStart == null) return { score: 0, reasons };
  const sessionEnd = parseDateOnly(session.end_date ?? session.start_date) ?? sessionStart;

  const checkIn = input.startDate ? parseDateOnly(input.startDate) : null;
  const checkOut = input.endDate ? parseDateOnly(input.endDate) : null;

  if (checkIn != null) {
    const diffDays = (checkIn - sessionStart) / DAY_MS;
    const dScore = scoreDateProximity(diffDays);
    if (dScore > 0) {
      score += dScore;
      reasons.push(
        Math.abs(diffDays) <= 1
          ? diffDays <= 0
            ? "Zameldowanie dzień przed rozpoczęciem zjazdu lub w dniu rozpoczęcia"
            : "Zameldowanie blisko rozpoczęcia zjazdu"
          : "Data zameldowania zbliżona do terminu zjazdu",
      );
    }
  }
  if (checkOut != null) {
    const diffDays = (checkOut - sessionEnd) / DAY_MS;
    const dScore = scoreDateProximity(diffDays);
    if (dScore > 0) {
      score += dScore * 0.5;
      reasons.push(
        Math.abs(diffDays) <= 1
          ? diffDays >= 0
            ? "Wymeldowanie w ostatnim dniu zjazdu lub dzień później"
            : "Wymeldowanie blisko zakończenia zjazdu"
          : "Data wymeldowania zbliżona do terminu zjazdu",
      );
    }
  }
  if (locationMatches(input.city, session.city)) {
    score += 0.35;
    reasons.push("Miasto zgodne z lokalizacją zjazdu");
  }

  return { score: Math.min(score, 1), reasons };
}

/** Zwraca WSZYSTKIE zjazdy, ocenione i posortowane (najlepszy wynik pierwszy, remis rozstrzyga chronologia) — nigdy nie filtruje, żeby caller mógł budować zarówno sugestię, jak i pełną listę "wybierz inny zjazd" z jednego wywołania. */
export function scoreSessionsForSuggestion(input: FindSuggestedSessionInput): SessionScore[] {
  const scored = input.sessions.map((session) => {
    const { score, reasons } = input.type === "travel" ? scoreTravel(session, input) : scoreAccommodation(session, input);
    return { session, score, reasons };
  });

  return scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.session.start_date.localeCompare(b.session.start_date);
  });
}

export function findSuggestedSession(input: FindSuggestedSessionInput): FindSuggestedSessionResult {
  const scored = scoreSessionsForSuggestion(input);
  const best = scored[0];
  const hasSuggestion = Boolean(best && best.score >= SUGGESTION_THRESHOLD);

  const confidence = hasSuggestion ? Math.round(best.score * 100) / 100 : 0;
  const confidenceLabel: ConfidenceLabel | null = !hasSuggestion
    ? null
    : confidence >= 0.85
      ? "bardzo_prawdopodobne"
      : confidence >= 0.55
        ? "prawdopodobne"
        : "mozliwe";

  return {
    suggestedSession: hasSuggestion ? best.session : null,
    confidence,
    confidenceLabel,
    reasons: hasSuggestion ? best.reasons : [],
    // Wyklucz najlepiej ocenione zjazd TYLKO jeśli faktycznie stał się
    // sugestią — inaczej (brak pewnego dopasowania) lista "wybierz zjazd
    // ręcznie" musi zawierać WSZYSTKIE zjazdy, łącznie z tym najlepiej
    // ocenionym, bo żaden nie został jeszcze nikomu pokazany jako sugestia.
    alternativeSessions: (hasSuggestion ? scored.filter((s) => s.session.id !== best.session.id) : scored).map(
      (s) => s.session,
    ),
  };
}
