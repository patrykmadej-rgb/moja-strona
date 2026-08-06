import { getDaysUntil } from "@/lib/szkola/preparation";
import type { Accommodation, SchoolSemester, SchoolSession, TravelSegment } from "@/lib/szkola/types";

export type WarningSeverity = "info" | "uwaga" | "pilne";

export type SessionWarning = {
  id: string;
  severity: WarningSeverity;
  message: string;
};

type ScheduleWindow = {
  item_date: string;
  start_time: string | null;
  end_time: string | null;
};

const SEVERITY_ORDER: Record<WarningSeverity, number> = { pilne: 0, uwaga: 1, info: 2 };

export function getSessionWarnings({
  session,
  segments,
  accommodations,
  semester,
  scheduleItems,
}: {
  session: SchoolSession;
  segments: TravelSegment[];
  accommodations: Accommodation[];
  /** Szkoła jest opłacana semestralnie z góry — status płatności patrzy na semestr, nie na płatność per-zjazd (patrz preparation.ts). */
  semester: SchoolSemester | null;
  scheduleItems: ScheduleWindow[];
}): SessionWarning[] {
  const warnings: SessionWarning[] = [];
  const isActive = session.status !== "anulowany" && session.status !== "zakonczony";

  if (isActive) {
    const activeSegments = segments.filter((s) => s.status !== "anulowane");
    const hasOutbound = activeSegments.some((s) => s.direction === "tam");
    const hasReturn = activeSegments.some((s) => s.direction === "powrot");

    if (!hasOutbound) {
      warnings.push({ id: "no-outbound", severity: "uwaga", message: "Brak biletu w jedną stronę (tam)." });
    }
    if (!hasReturn) {
      warnings.push({ id: "no-return", severity: "uwaga", message: "Brak biletu powrotnego." });
    }

    if (!session.lodging_not_needed) {
      const hasAccommodation = accommodations.some((a) => a.payment_status !== "anulowane");
      if (!hasAccommodation) {
        warnings.push({ id: "no-accommodation", severity: "uwaga", message: "Brak zarezerwowanego noclegu." });
      }
    }

    if (!semester) {
      warnings.push({ id: "no-semester", severity: "uwaga", message: "Zjazd nie ma przypisanego semestru." });
    } else if (semester.payment_status !== "oplacone" && semester.payment_status !== "anulowane") {
      warnings.push({
        id: "unpaid-semester",
        severity: "pilne",
        message: `Semestr „${semester.name}” nie został jeszcze opłacony.`,
      });
    }
  }

  for (const segment of segments) {
    if (segment.status === "anulowane") continue;

    if (segment.direction === "tam" && segment.arrival_date && segment.arrival_time) {
      const collision = scheduleItems.find(
        (item) =>
          item.item_date === segment.arrival_date &&
          item.start_time !== null &&
          segment.arrival_time! > item.start_time,
      );
      if (collision) {
        warnings.push({
          id: `collision-arrival-${segment.id}`,
          severity: "pilne",
          message: `Przylot o ${segment.arrival_time.slice(0, 5)} może kolidować z rozpoczęciem zajęć.`,
        });
      }
    }

    if (segment.direction === "powrot" && segment.departure_date && segment.departure_time) {
      const collision = scheduleItems.find(
        (item) =>
          item.item_date === segment.departure_date &&
          item.end_time !== null &&
          segment.departure_time! < item.end_time,
      );
      if (collision) {
        warnings.push({
          id: `collision-departure-${segment.id}`,
          severity: "pilne",
          message: `Wyjazd o ${segment.departure_time.slice(0, 5)} może kolidować z zakończeniem zajęć.`,
        });
      }
    }
  }

  for (const accommodation of accommodations) {
    if (!accommodation.free_cancellation_until || accommodation.payment_status === "anulowane") continue;
    const days = getDaysUntil(accommodation.free_cancellation_until);
    if (days >= 0 && days <= 3) {
      warnings.push({
        id: `cancellation-${accommodation.id}`,
        severity: "uwaga",
        message: `Bezpłatne anulowanie „${accommodation.name}” kończy się ${
          days === 0 ? "dziś" : `za ${days} ${days === 1 ? "dzień" : "dni"}`
        }.`,
      });
    }
  }

  return warnings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
