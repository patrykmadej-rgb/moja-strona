/**
 * Porównuje zapisany wcześniej stan wydarzenia z nowo pobranym z Google —
 * zwraca osobną zmianę dla KAŻDEGO różniącego się pola (nigdy jednej
 * ogólnej informacji "wydarzenie zmienione").
 */

export type ComparableEventFields = {
  title: string | null;
  description: string | null;
  location: string | null;
  start_at: string | null;
  end_at: string | null;
  timezone: string | null;
  status: string | null;
  organizer_email: string | null;
  attachments: unknown;
  recurrence: unknown;
};

const COMPARED_FIELDS: (keyof ComparableEventFields)[] = [
  "title",
  "description",
  "location",
  "start_at",
  "end_at",
  "timezone",
  "status",
  "organizer_email",
  "attachments",
  "recurrence",
];

export type DetectedFieldChange = {
  field_name: keyof ComparableEventFields;
  old_value: string | null;
  new_value: string | null;
};

function stringifyForCompare(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

// start_at/end_at wracają z Postgresa jako "...+00:00", a ze świeżo
// sparsowanego ICS/Google jako "...Z" (Date#toISOString) — ten sam moment,
// inny zapis stringa. Porównanie czysto tekstowe fałszywie zgłaszało "moved"
// przy KAŻDEJ synchronizacji dla praktycznie każdego wydarzenia.
const DATE_FIELDS = new Set<keyof ComparableEventFields>(["start_at", "end_at"]);

function valuesEqual(field: keyof ComparableEventFields, oldVal: string | null, newVal: string | null): boolean {
  if (oldVal === newVal) return true;
  if (DATE_FIELDS.has(field) && oldVal !== null && newVal !== null) {
    const oldTime = new Date(oldVal).getTime();
    const newTime = new Date(newVal).getTime();
    if (!Number.isNaN(oldTime) && !Number.isNaN(newTime)) return oldTime === newTime;
  }
  return false;
}

/** `previous === null` oznacza nowe wydarzenie — brak zmian pól do zgłoszenia (obsługiwane osobno jako "created"). */
export function diffEventFields(
  previous: ComparableEventFields | null,
  incoming: ComparableEventFields,
): DetectedFieldChange[] {
  if (!previous) return [];

  const changes: DetectedFieldChange[] = [];
  for (const field of COMPARED_FIELDS) {
    const oldVal = stringifyForCompare(previous[field]);
    const newVal = stringifyForCompare(incoming[field]);
    if (!valuesEqual(field, oldVal, newVal)) {
      changes.push({ field_name: field, old_value: oldVal, new_value: newVal });
    }
  }
  return changes;
}
