import { getAutomaticPreparationItems, getDaysUntil } from "@/lib/szkola/preparation";
import type { Accommodation, SchoolSemester, SchoolSession, TravelSegment } from "@/lib/szkola/types";
import type { NextSessionData } from "@/lib/dashboard/types";

const WEEKDAY_LABELS: Record<number, string> = {
  0: "Niedziela",
  1: "Poniedziałek",
  2: "Wtorek",
  3: "Środa",
  4: "Czwartek",
  5: "Piątek",
  6: "Sobota",
};

function parseDateOnly(dateOnly: string): Date {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Skrócony harmonogram dni (sekcja 7 briefu, przykład "Piątek 15:00–20:00")
 * — grupuje session_schedule_items po dniu, bierze najwcześniejszy start i
 * najpóźniejszy koniec danego dnia.
 */
function buildSchedulePreview(scheduleItems: { item_date: string; start_time: string | null; end_time: string | null }[]) {
  const byDate = new Map<string, { start: string | null; end: string | null }>();
  for (const item of scheduleItems) {
    const existing = byDate.get(item.item_date) ?? { start: null, end: null };
    if (item.start_time && (!existing.start || item.start_time < existing.start)) existing.start = item.start_time;
    if (item.end_time && (!existing.end || item.end_time > existing.end)) existing.end = item.end_time;
    byDate.set(item.item_date, existing);
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { start, end }]) => ({
      label: WEEKDAY_LABELS[parseDateOnly(date).getDay()],
      time: start && end ? `${start.slice(0, 5)}–${end.slice(0, 5)}` : "godziny nieustalone",
    }));
}

/**
 * Sekcja 7 briefu: statusy transportu/noclegu/płatności są AUTOMATYCZNE
 * (reużywa getAutomaticPreparationItems z preparation.ts — dokładnie ta sama
 * logika co Status przygotowań na stronie zjazdu, sekcja 18: nie zmieniamy
 * jej, tylko wywołujemy) — żadnych ręcznych checklist dla rejestracji/
 * ubezpieczenia/materiałów.
 */
export function buildNextSessionData(input: {
  session: SchoolSession;
  segments: TravelSegment[];
  accommodations: Accommodation[];
  semester: SchoolSemester | null;
  costCount: number;
  scheduleItems: { item_date: string; start_time: string | null; end_time: string | null }[];
}): NextSessionData {
  const [transportStatus, accommodationStatus, paymentStatus] = getAutomaticPreparationItems({
    segments: input.segments,
    accommodations: input.accommodations,
    lodgingNotNeeded: input.session.lodging_not_needed,
    semester: input.semester,
  });

  return {
    session: input.session,
    daysUntil: getDaysUntil(input.session.start_date),
    transportStatus,
    accommodationStatus,
    paymentStatus,
    costCount: input.costCount,
    schedulePreview: buildSchedulePreview(input.scheduleItems),
  };
}
