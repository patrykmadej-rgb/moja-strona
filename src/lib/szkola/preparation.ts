import type { Accommodation, SchoolSemester, SessionTask, TravelSegment } from "@/lib/szkola/types";

/**
 * "Status przygotowań" nie jest już ręczną checklistą — to automatyczne
 * podsumowanie danych już zapisanych w systemie (transport/nocleg/płatność
 * semestralna). Cztery warianty statusu, zgodnie z briefem:
 *  - done: gotowe (np. transport dodany, semestr opłacony)
 *  - attention: wymaga uwagi (brak, a jest wymagane)
 *  - not_needed: niewymagane (np. nocleg ręcznie oznaczony jako niepotrzebny)
 *  - no_data: brak danych (np. zjazd nie ma przypisanego semestru, więc nie
 *    da się wyliczyć statusu płatności)
 */
export type PrepStatusKind = "done" | "attention" | "not_needed" | "no_data";

export type PrepItem = {
  key: "transport" | "nocleg" | "platnosc";
  title: string;
  kind: PrepStatusKind;
  detail: string;
};

/** Sekcja 3 briefu: gotowe, gdy do zjazdu przypisana jest choć jedna (nieanulowana) podróż/rezerwacja transportu. */
export function getTransportStatus(segments: TravelSegment[]): PrepItem {
  const active = segments.filter((s) => s.status !== "anulowane");
  if (active.length > 0) {
    return { key: "transport", title: "Transport", kind: "done", detail: "Transport dodany" };
  }
  return { key: "transport", title: "Transport", kind: "attention", detail: "Transport nie został jeszcze dodany" };
}

/** Sekcja 4 briefu: gotowe, gdy jest aktywna rezerwacja noclegu; neutralne, gdy ręcznie oznaczono jako niepotrzebny. */
export function getAccommodationStatus(accommodations: Accommodation[], lodgingNotNeeded: boolean): PrepItem {
  if (lodgingNotNeeded) {
    return { key: "nocleg", title: "Nocleg", kind: "not_needed", detail: "Nocleg niewymagany" };
  }
  const active = accommodations.filter((a) => a.payment_status !== "anulowane");
  if (active.length > 0) {
    return { key: "nocleg", title: "Nocleg", kind: "done", detail: "Nocleg dodany" };
  }
  return { key: "nocleg", title: "Nocleg", kind: "attention", detail: "Nocleg nie został jeszcze dodany" };
}

/** Sekcja 2 briefu: status wyliczany z płatności PRZYPISANEJ DO SEMESTRU obejmującego dany zjazd, nie z płatności per-zjazd. */
export function getSemesterPaymentStatus(semester: SchoolSemester | null): PrepItem {
  if (!semester) {
    return { key: "platnosc", title: "Płatność", kind: "no_data", detail: "Zjazd nie ma przypisanego semestru" };
  }
  if (semester.payment_status === "oplacone") {
    return { key: "platnosc", title: "Płatność", kind: "done", detail: "Semestr opłacony" };
  }
  if (semester.payment_status === "anulowane") {
    return { key: "platnosc", title: "Płatność", kind: "not_needed", detail: "Płatność za semestr anulowana" };
  }
  return { key: "platnosc", title: "Płatność", kind: "attention", detail: "Brak potwierdzenia opłaty za semestr" };
}

export function getAutomaticPreparationItems(input: {
  segments: TravelSegment[];
  accommodations: Accommodation[];
  lodgingNotNeeded: boolean;
  semester: SchoolSemester | null;
}): PrepItem[] {
  return [
    getTransportStatus(input.segments),
    getAccommodationStatus(input.accommodations, input.lodgingNotNeeded),
    getSemesterPaymentStatus(input.semester),
  ];
}

/** "not_needed" liczy się jako spełnione (nic więcej nie jest wymagane) — tylko "attention"/"no_data" obniżają procent. */
export function getAutomaticPreparationPercent(items: PrepItem[]): number {
  if (items.length === 0) return 0;
  const satisfied = items.filter((i) => i.kind === "done" || i.kind === "not_needed").length;
  return Math.round((satisfied / items.length) * 100);
}

export function getAutomaticPreparationMissingLabels(items: PrepItem[]): string[] {
  return items.filter((i) => i.kind === "attention" || i.kind === "no_data").map((i) => i.title);
}

/** Sekcja 6 briefu: procent/liczniki dla "Moje zadania" (wyłącznie ręczne, niestandardowe zadania). */
export function getPreparationPercent(tasks: SessionTask[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.is_done).length;
  return Math.round((done / tasks.length) * 100);
}

export function getMissingTaskTitles(tasks: SessionTask[], max = 3): string[] {
  return tasks
    .filter((t) => !t.is_done)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, max)
    .map((t) => t.title);
}

export function getDaysUntil(dateOnly: string): number {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
