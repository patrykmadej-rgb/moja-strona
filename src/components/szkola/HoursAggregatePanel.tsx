"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil } from "lucide-react";
import { updateHourRequirement } from "@/app/lab/szkola/godziny/actions";
import { formatHours } from "@/lib/szkola/format";
import {
  ACTIVITY_TO_HOUR_CATEGORY,
  type ActivityType,
  type SessionScheduleItem,
  type TrainingHoursEntry,
  type TrainingHourRequirement,
} from "@/lib/szkola/types";

const inputClass =
  "rounded-[10px] border border-[#e8e2ec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86]";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[10px] bg-[#5b2a86] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
    >
      {pending ? "Zapisywanie…" : "Zapisz"}
    </button>
  );
}

function RequirementRow({
  requirement,
  completed,
  planned,
}: {
  requirement: TrainingHourRequirement;
  completed: number;
  planned: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const required = requirement.required_hours;
  const remaining = Math.max(required - completed, 0);
  const percent = required > 0 ? Math.min((completed / required) * 100, 100) : completed > 0 ? 100 : 0;

  return (
    <div className="border-b border-[#eee9f2] py-4 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#201a2b]">
            {requirement.label}
            {!requirement.active && <span className="ml-2 text-xs font-normal text-[#9a919f]">(nieaktywne)</span>}
          </p>
          <p className="mt-0.5 text-xs text-[#706878]">
            Wymagane {formatHours(required)} · Zrealizowane {formatHours(completed)} · Planowane {formatHours(planned)} · Pozostało{" "}
            {formatHours(remaining)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing((v) => !v)}
          title="Edytuj wymaganie"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[#706878] hover:bg-[#f1eafd] hover:text-[#4c1f72]"
        >
          <Pencil className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      {required > 0 && (
        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#f1eafd]">
          <div className="h-full rounded-full bg-[#5b2a86]" style={{ width: `${percent}%` }} />
        </div>
      )}

      {isEditing && (
        <form
          action={async (formData) => {
            setError(null);
            try {
              await updateHourRequirement(formData);
              setIsEditing(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Nie udało się zapisać wymagania.");
            }
          }}
          className="mt-3 flex flex-wrap items-end gap-2 rounded-[10px] border border-[#e8e2ec] bg-[#f7f4ef] p-3"
        >
          <input type="hidden" name="id" value={requirement.id} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#706878]">Etykieta</label>
            <input name="label" required defaultValue={requirement.label} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#706878]">Wymagane godziny</label>
            <input
              name="required_hours"
              type="number"
              min={0}
              step="0.5"
              required
              defaultValue={requirement.required_hours}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-1.5 pb-2 text-sm text-[#201a2b]">
            <input type="checkbox" name="active" defaultChecked={requirement.active} className="h-4 w-4 accent-[#5b2a86]" />
            Aktywne
          </label>
          <SubmitButton />
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded-[10px] border border-[#e8e2ec] px-3 py-1.5 text-xs text-[#706878] hover:border-[#d9cde5]"
          >
            Anuluj
          </button>
          {error && <p className="w-full text-xs text-red-600">{error}</p>}
        </form>
      )}
    </div>
  );
}

export default function HoursAggregatePanel({
  entries,
  requirements,
  scheduleItems,
}: {
  entries: TrainingHoursEntry[];
  requirements: TrainingHourRequirement[];
  scheduleItems: SessionScheduleItem[];
}) {
  const completedByCategory = useMemo(() => {
    const totals = new Map<string, number>();
    for (const entry of entries) {
      if (!entry.attended) continue;
      totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.hours);
    }
    return totals;
  }, [entries]);

  const plannedByCategory = useMemo(() => {
    const linkedScheduleItemIds = new Set(entries.map((e) => e.schedule_item_id).filter(Boolean));
    const totals = new Map<string, number>();
    for (const item of scheduleItems) {
      if (linkedScheduleItemIds.has(item.id)) continue;
      if (!item.activity_type) continue;
      const category = ACTIVITY_TO_HOUR_CATEGORY[item.activity_type as ActivityType];
      if (!category) continue;
      totals.set(category, (totals.get(category) ?? 0) + (item.hours ?? 0));
    }
    return totals;
  }, [entries, scheduleItems]);

  const sorted = [...requirements].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <h2 className="text-sm font-semibold text-[#201a2b]">Panel zbiorczy — cała szkoła</h2>
      <p className="mt-1 text-xs text-[#706878]">
        Wymagania godzinowe są konfigurowalne — edytuj je poniżej, jeśli program szkoły się zmieni.
      </p>
      <div className="mt-3">
        {sorted.map((requirement) => (
          <RequirementRow
            key={requirement.id}
            requirement={requirement}
            completed={completedByCategory.get(requirement.category) ?? 0}
            planned={plannedByCategory.get(requirement.category) ?? 0}
          />
        ))}
      </div>
    </section>
  );
}
