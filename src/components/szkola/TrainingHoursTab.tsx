"use client";

import { useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { CalendarPlus, Clock } from "lucide-react";
import {
  addHoursEntry,
  createHoursEntryFromScheduleItem,
  deleteHoursEntry,
  updateHoursEntry,
} from "@/app/lab/szkola/zjazdy/[id]/actions";
import EmptyState from "@/components/lab/EmptyState";
import { formatHours, formatWeekdayDate } from "@/lib/szkola/format";
import {
  TRAINING_HOUR_CATEGORIES,
  TRAINING_HOUR_CATEGORY_LABELS,
  type SessionScheduleItem,
  type TrainingHoursEntry,
} from "@/lib/szkola/types";

const inputClass =
  "rounded-[10px] border border-[#e8e2ec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86]";
const labelClass = "text-xs font-medium text-[#201a2b]";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-[10px] bg-[#5b2a86] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function HoursEntryFields({ entry }: { entry?: TrainingHoursEntry }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Kategoria</label>
          <select name="category" defaultValue={entry?.category ?? "teoria"} className={inputClass}>
            {TRAINING_HOUR_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {TRAINING_HOUR_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Liczba godzin *</label>
          <input name="hours" type="number" min={0} step="0.25" required defaultValue={entry?.hours ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Data</label>
          <input name="entry_date" type="date" defaultValue={entry?.entry_date ?? ""} className={inputClass} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Prowadzący</label>
        <input name="trainer" defaultValue={entry?.trainer ?? ""} className={inputClass} />
      </div>
      <label className="flex items-center gap-2 text-sm text-[#201a2b]">
        <input type="checkbox" name="attended" defaultChecked={entry?.attended ?? true} className="h-4 w-4 accent-[#5b2a86]" />
        Obecność potwierdzona
      </label>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Notatka</label>
        <textarea name="notes" rows={2} defaultValue={entry?.notes ?? ""} className={inputClass} />
      </div>
    </>
  );
}

function HoursEntryRow({ sessionId, entry }: { sessionId: string; entry: TrainingHoursEntry }) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isEditing) {
    return (
      <li className="border-b border-[#eee9f2] py-4 last:border-b-0">
        <form
          action={async (formData) => {
            setError(null);
            try {
              await updateHoursEntry(formData);
              setIsEditing(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Nie udało się zapisać wpisu.");
            }
          }}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="id" value={entry.id} />
          <HoursEntryFields entry={entry} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <SubmitButton label="Zapisz" pendingLabel="Zapisywanie…" />
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-[10px] border border-[#e8e2ec] px-4 py-2 text-sm text-[#706878] hover:border-[#d9cde5]"
            >
              Anuluj
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-4 border-b border-[#eee9f2] py-4 last:border-b-0">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#f1eafd]">
          <Clock className="h-4 w-4 text-[#5b2a86]" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#201a2b]">
            {TRAINING_HOUR_CATEGORY_LABELS[entry.category]} · {formatHours(entry.hours)}
          </p>
          <p className="mt-0.5 truncate text-xs text-[#706878]">
            {[entry.entry_date, entry.trainer, entry.attended ? "obecność" : "nieobecność"].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button type="button" onClick={() => setIsEditing(true)} className="text-sm text-[#5b2a86] hover:underline">
          Edytuj
        </button>
        <form
          action={deleteHoursEntry}
          onSubmit={(e) => {
            if (!confirm("Usunąć ten wpis godzinowy?")) e.preventDefault();
          }}
        >
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="id" value={entry.id} />
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Usuń
          </button>
        </form>
      </div>
    </li>
  );
}

export default function TrainingHoursTab({
  sessionId,
  entries,
  scheduleItems,
}: {
  sessionId: string;
  entries: TrainingHoursEntry[];
  scheduleItems: SessionScheduleItem[];
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFromPlan, setShowFromPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const linkedScheduleItemIds = new Set(entries.map((e) => e.schedule_item_id).filter(Boolean));
  const unlinkedScheduleItems = scheduleItems.filter((item) => !linkedScheduleItemIds.has(item.id));

  const totalsByCategory = useMemo(() => {
    const totals = new Map<string, number>();
    for (const entry of entries) {
      totals.set(entry.category, (totals.get(entry.category) ?? 0) + entry.hours);
    }
    return totals;
  }, [entries]);

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-[#201a2b]">Godziny szkoleniowe</h2>
            <p className="mt-0.5 text-xs text-[#706878]">{formatHours(totalHours)} łącznie w tym zjeździe</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFromPlan((v) => !v)}
              className="flex items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-3 py-2 text-sm text-[#5b2a86] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]"
            >
              <CalendarPlus className="h-3.5 w-3.5" strokeWidth={1.75} />
              Z planu zajęć
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="rounded-[10px] border border-[#e8e2ec] px-3 py-2 text-sm text-[#5b2a86] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]"
            >
              {showAddForm ? "Anuluj" : "+ Dodaj wpis"}
            </button>
          </div>
        </div>

        {totalsByCategory.size > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from(totalsByCategory.entries()).map(([category, hours]) => (
              <span key={category} className="rounded-full bg-[#f1eafd] px-2.5 py-1 text-xs text-[#5b2a86]">
                {TRAINING_HOUR_CATEGORY_LABELS[category as keyof typeof TRAINING_HOUR_CATEGORY_LABELS]}: {formatHours(hours)}
              </span>
            ))}
          </div>
        )}

        {showFromPlan && (
          <div className="mt-4 rounded-[10px] border border-[#e8e2ec] bg-[#f7f4ef] p-4">
            {unlinkedScheduleItems.length === 0 ? (
              <p className="text-sm text-[#706878]">
                Wszystkie punkty planu mają już wpis godzinowy (albo plan zajęć jest pusty).
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {unlinkedScheduleItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-[#201a2b]">
                      {formatWeekdayDate(item.item_date)} · {item.title}
                      {item.hours ? ` · ${formatHours(item.hours)}` : ""}
                    </span>
                    <form action={createHoursEntryFromScheduleItem}>
                      <input type="hidden" name="session_id" value={sessionId} />
                      <input type="hidden" name="schedule_item_id" value={item.id} />
                      <button type="submit" className="shrink-0 text-xs font-medium text-[#5b2a86] hover:underline">
                        + Dodaj godziny
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {showAddForm && (
          <form
            ref={formRef}
            action={async (formData) => {
              setError(null);
              try {
                await addHoursEntry(formData);
                formRef.current?.reset();
                setShowAddForm(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Nie udało się dodać wpisu.");
              }
            }}
            className="mt-4 flex flex-col gap-3 rounded-[10px] border border-[#e8e2ec] bg-[#f7f4ef] p-4"
          >
            <input type="hidden" name="session_id" value={sessionId} />
            <HoursEntryFields />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <SubmitButton label="Dodaj wpis" pendingLabel="Dodawanie…" />
          </form>
        )}
      </section>

      <section>
        {entries.length === 0 ? (
          <div className="rounded-[16px] border border-[#e8e2ec] bg-white px-6 py-10 text-center shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
            <EmptyState icon={Clock} title="Brak wpisów godzinowych" subtitle="Dodaj wpis ręcznie albo z planu zajęć." compact />
          </div>
        ) : (
          <ul className="rounded-[16px] border border-[#e8e2ec] bg-white px-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
            {entries.map((entry) => (
              <HoursEntryRow key={entry.id} sessionId={sessionId} entry={entry} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
