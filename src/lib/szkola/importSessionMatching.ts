import { extractSessionReference } from "@/lib/szkola/importFieldExtraction";
import { scoreSessionsForSuggestion } from "@/lib/szkola/sessionSuggestion";
import type { SchoolSession } from "@/lib/szkola/types";

export type ImportSessionMatch = { session: SchoolSession; confidence: "high" | "low"; reason: string };

/** Poniżej tego wyniku fallback datowy w ogóle nie proponuje zjazdu (spójne z SUGGESTION_THRESHOLD w sessionSuggestion.ts, ale też z dawnym progiem "brak nakładania się dat" tej funkcji). */
const MIN_SCORE = 0.5;
/** Jak duża musi być przewaga nad drugim najlepszym wynikiem, żeby uznać dopasowanie za jednoznaczne ("high") zamiast tylko sugerowanego ("low", sekcja 2 dawnego briefu — kilka zjazdów pokrywa się terminem). */
const UNIQUE_MARGIN = 0.15;

/**
 * Proponuje zjazd dla importu (sekcja 13/14 briefu): najpierw jawne odwołanie
 * tekstowe ("Zjazd VI"), potem współdzielony silnik scoringu dat/lokalizacji
 * (sessionSuggestion.ts — TA SAMA logika co ręczny formularz podróży/
 * zakwaterowania i ponowne powiązywanie, żeby nie utrzymywać dwóch
 * niezależnych implementacji dopasowania zjazdu, sekcja 14 briefu).
 *
 * Import ma do dyspozycji kilka NIEZALEŻNYCH dat kandydujących naraz
 * (startAt z biletu, checkIn/checkOut z hotelu) — w przeciwieństwie do
 * ręcznego formularza, który zawsze pyta o jedną, dobrze zdefiniowaną parę
 * dat. Dlatego każda data kandydująca jest oceniana osobno (jako odcinek
 * "lokalny/inny", czyli sam fakt mieszczenia się w oknie zjazdu — import nie
 * zna kierunku podróży), a wybierany jest najlepszy wynik spośród wszystkich.
 *
 * Wysoka pewność ("high", auto-przypisanie w runIntakePipeline) tylko przy
 * NIEDWUZNACZNYM zwycięzcy (wynik >= MIN_SCORE i wyraźnie lepszy od drugiego
 * najlepszego) — inaczej caller pokazuje propozycję do ręcznego potwierdzenia
 * zamiast przypisywać automatycznie.
 */
export function matchImportToSession(
  input: {
    text: string;
    startAt?: string | null;
    checkIn?: string | null;
    checkOut?: string | null;
    origin?: string | null;
    destination?: string | null;
  },
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
  if (candidateDates.length === 0 || sessions.length === 0) return null;

  let best: { session: SchoolSession; score: number } | null = null;
  let secondBestScore = 0;

  for (const date of candidateDates) {
    const scored = scoreSessionsForSuggestion({
      type: "travel",
      direction: null,
      startDate: date,
      endDate: date,
      origin: input.origin,
      destination: input.destination,
      sessions,
    });
    if (scored.length === 0) continue;

    if (!best || scored[0].score > best.score) {
      if (best) secondBestScore = Math.max(secondBestScore, best.score);
      best = { session: scored[0].session, score: scored[0].score };
    } else {
      secondBestScore = Math.max(secondBestScore, scored[0].score);
    }
    if (scored.length > 1) secondBestScore = Math.max(secondBestScore, scored[1].score);
  }

  if (!best || best.score < MIN_SCORE) return null;

  const isUnique = best.score - secondBestScore >= UNIQUE_MARGIN;
  return {
    session: best.session,
    confidence: isUnique ? "high" : "low",
    reason: isUnique ? "data pokrywa się z terminem zjazdu" : "kilka zjazdów pokrywa się terminem",
  };
}
