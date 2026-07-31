"use client";

import { useFormStatus } from "react-dom";
import { SESSION_STATUSES, SESSION_STATUS_LABELS, type SchoolSession } from "@/lib/szkola/types";

const inputClass =
  "rounded-[10px] border border-[#e8e2ec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86]";
const labelClass = "text-sm font-medium text-[#201a2b]";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-[10px] bg-[#5b2a86] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export default function SessionForm({
  session,
  action,
  submitLabel,
  pendingLabel,
  onCancel,
}: {
  session?: SchoolSession;
  action: (formData: FormData) => void;
  submitLabel: string;
  pendingLabel: string;
  onCancel?: () => void;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      {session && <input type="hidden" name="session_id" value={session.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[100px_1fr]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="session_number" className={labelClass}>
            Numer
          </label>
          <input
            id="session_number"
            name="session_number"
            type="number"
            min={1}
            defaultValue={session?.session_number ?? ""}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className={labelClass}>
            Tytuł *
          </label>
          <input
            id="title"
            name="title"
            required
            placeholder="np. Zjazd VI"
            defaultValue={session?.title ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="topic" className={labelClass}>
          Temat
        </label>
        <input
          id="topic"
          name="topic"
          placeholder="np. Doświadczenie własne"
          defaultValue={session?.topic ?? ""}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="city" className={labelClass}>
            Miasto
          </label>
          <input id="city" name="city" defaultValue={session?.city ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="venue" className={labelClass}>
            Miejsce / sala
          </label>
          <input id="venue" name="venue" defaultValue={session?.venue ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="start_date" className={labelClass}>
            Data rozpoczęcia *
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            defaultValue={session?.start_date ?? ""}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="end_date" className={labelClass}>
            Data zakończenia
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            defaultValue={session?.end_date ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lead_trainer" className={labelClass}>
            Prowadzący
          </label>
          <input
            id="lead_trainer"
            name="lead_trainer"
            defaultValue={session?.lead_trainer ?? ""}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="training_year" className={labelClass}>
            Rok szkoleniowy
          </label>
          <input
            id="training_year"
            name="training_year"
            placeholder="np. 2025/2026"
            defaultValue={session?.training_year ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      {session && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select id="status" name="status" defaultValue={session.status} className={inputClass}>
            {SESSION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {SESSION_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className={labelClass}>
          Notatka
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={session?.notes ?? ""}
          className={inputClass}
        />
      </div>

      <div className="flex gap-3">
        <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[10px] border border-[#e8e2ec] px-5 py-2.5 text-sm font-medium text-[#706878] hover:border-[#d9cde5]"
          >
            Anuluj
          </button>
        )}
      </div>
    </form>
  );
}
