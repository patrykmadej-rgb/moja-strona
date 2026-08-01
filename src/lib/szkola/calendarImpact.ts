import type { Accommodation, CalendarImpactLevel, SchoolCalendarSettings, TravelSegment } from "@/lib/szkola/types";

export type ImpactAssessment = { impact_level: CalendarImpactLevel; impact_summary: string | null };

const IMPACT_ORDER: CalendarImpactLevel[] = ["none", "information", "warning", "conflict"];

function escalate(current: CalendarImpactLevel, next: CalendarImpactLevel): CalendarImpactLevel {
  return IMPACT_ORDER.indexOf(next) > IMPACT_ORDER.indexOf(current) ? next : current;
}

function combineDateTime(date: string | null | undefined, time: string | null | undefined): Date | null {
  if (!date) return null;
  return new Date(`${date}T${time ?? "00:00"}:00`);
}

function formatMinutes(minutes: number): string {
  const abs = Math.round(Math.abs(minutes));
  if (abs < 60) return `${abs} min`;
  const hours = Math.floor(abs / 60);
  const rest = abs % 60;
  return rest === 0 ? `${hours} godz.` : `${hours} godz. ${rest} min`;
}

/**
 * Ocena wpływu zmiany godziny/daty zjazdu na już kupioną podróż i nocleg.
 * classStart/classEnd = efektywny początek/koniec zajęć (pierwszy/ostatni
 * punkt planu zajęć, albo daty samego zjazdu jeśli plan jest pusty).
 *
 * Jeżeli brak danych o czasie dojazdu z miejsca zajęć na lotnisko/dworzec —
 * NIE zgadujemy — zwracamy uczciwą, ogólną informację zamiast pseudo-precyzji.
 */
export function assessTravelImpact(input: {
  classStart: Date | null;
  classEnd: Date | null;
  segments: TravelSegment[];
  accommodations: Accommodation[];
  settings: SchoolCalendarSettings;
}): ImpactAssessment {
  const { classStart, classEnd, segments, accommodations, settings } = input;

  if (!classStart && !classEnd) {
    return { impact_level: "information", impact_summary: "Zmiana może wpływać na podróż. Sprawdź połączenia ręcznie." };
  }

  let level: CalendarImpactLevel = "none";
  const messages: string[] = [];

  // A. Przyjazd — ostatni odcinek "tam" musi kończyć się z odpowiednim zapasem przed rozpoczęciem zajęć.
  if (classStart) {
    const arrivals = segments
      .filter((s) => s.direction === "tam" && s.status !== "anulowane" && s.arrival_date)
      .map((s) => ({ segment: s, at: combineDateTime(s.arrival_date, s.arrival_time) }))
      .filter((x): x is { segment: TravelSegment; at: Date } => x.at !== null)
      .sort((a, b) => a.at.getTime() - b.at.getTime());

    const lastArrival = arrivals.at(-1);
    if (lastArrival) {
      const diffMinutes = (classStart.getTime() - lastArrival.at.getTime()) / 60000;
      if (diffMinutes < 0) {
        level = escalate(level, "conflict");
        messages.push(`Przyjazd kończy się ${formatMinutes(diffMinutes)} po rozpoczęciu zajęć.`);
      } else if (diffMinutes < settings.buffer_before_minutes) {
        level = escalate(level, "warning");
        messages.push(
          `Tylko ${formatMinutes(diffMinutes)} między przyjazdem a rozpoczęciem zajęć (zalecany bufor: ${settings.buffer_before_minutes} min).`,
        );
      }
    }
  }

  // B. Powrót — pierwszy odcinek "powrot" nie może zaczynać się przed zakończeniem zajęć.
  if (classEnd) {
    const departures = segments
      .filter((s) => s.direction === "powrot" && s.status !== "anulowane" && s.departure_date)
      .map((s) => ({ segment: s, at: combineDateTime(s.departure_date, s.departure_time) }))
      .filter((x): x is { segment: TravelSegment; at: Date } => x.at !== null)
      .sort((a, b) => a.at.getTime() - b.at.getTime());

    const firstDeparture = departures.at(0);
    if (firstDeparture) {
      const relevantBuffer =
        firstDeparture.segment.segment_type === "samolot"
          ? settings.flight_buffer_minutes
          : firstDeparture.segment.segment_type === "pociag"
            ? settings.train_buffer_minutes
            : settings.buffer_after_minutes;

      const diffMinutes = (firstDeparture.at.getTime() - classEnd.getTime()) / 60000;
      if (diffMinutes < 0) {
        level = escalate(level, "conflict");
        messages.push(`Wyjazd powrotny zaczyna się ${formatMinutes(diffMinutes)} przed zakończeniem zajęć.`);
      } else if (diffMinutes < relevantBuffer) {
        level = escalate(level, "warning");
        messages.push(
          `Tylko ${formatMinutes(diffMinutes)} między zakończeniem zajęć a odjazdem (zalecany bufor: ${relevantBuffer} min).`,
        );
      }
    }
  }

  // C. Zakwaterowanie — czy check-in/check-out wciąż pokrywają zjazd.
  for (const accommodation of accommodations) {
    if (accommodation.payment_status === "anulowane") continue;
    if (classStart && accommodation.check_in) {
      const checkIn = new Date(`${accommodation.check_in}T00:00:00`);
      if (checkIn.getTime() > classStart.getTime()) {
        level = escalate(level, "warning");
        messages.push(`Zameldowanie (${accommodation.check_in}) jest po nowym terminie rozpoczęcia zajęć — może być potrzebna dodatkowa noc.`);
      }
    }
    if (classEnd && accommodation.check_out) {
      const checkOut = new Date(`${accommodation.check_out}T00:00:00`);
      if (checkOut.getTime() < classEnd.getTime()) {
        level = escalate(level, "warning");
        messages.push(`Wymeldowanie (${accommodation.check_out}) jest przed nowym terminem zakończenia zajęć.`);
      }
    }
  }

  if (messages.length === 0) {
    return { impact_level: "none", impact_summary: null };
  }
  return { impact_level: level, impact_summary: messages.join(" ") };
}
