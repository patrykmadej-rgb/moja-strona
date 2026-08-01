"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { updateCalendarSettings } from "@/app/lab/szkola/kalendarz/actions";
import type { SchoolCalendarSettings } from "@/lib/szkola/types";

const inputClass =
  "rounded-[10px] border border-[#e8e2ec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86]";
const labelClass = "text-xs font-medium text-[#201a2b]";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-[10px] bg-[#5b2a86] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
    >
      {pending ? "Zapisywanie…" : "Zapisz bufory"}
    </button>
  );
}

export default function CalendarBufferSettingsCard({ settings }: { settings: SchoolCalendarSettings }) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <h2 className="text-sm font-semibold text-[#201a2b]">Bufory czasowe</h2>
      <p className="mt-1 text-xs text-[#706878]">
        Używane do oceny, czy zmiana godziny zjazdu koliduje z kupioną podróżą. Wartości startowe — zmień je na
        realistyczne dla siebie.
      </p>

      <form
        action={async (formData) => {
          setError(null);
          setSaved(false);
          try {
            await updateCalendarSettings(formData);
            setSaved(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Nie udało się zapisać ustawień.");
          }
        }}
        className="mt-4 grid grid-cols-1 gap-3 min-[560px]:grid-cols-2"
      >
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Bufor przed rozpoczęciem zajęć (min)</label>
          <input
            name="buffer_before_minutes"
            type="number"
            min={0}
            defaultValue={settings.buffer_before_minutes}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Bufor po zakończeniu zajęć (min)</label>
          <input
            name="buffer_after_minutes"
            type="number"
            min={0}
            defaultValue={settings.buffer_after_minutes}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Zalecany czas przed lotem (min)</label>
          <input
            name="flight_buffer_minutes"
            type="number"
            min={0}
            defaultValue={settings.flight_buffer_minutes}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Zalecany czas przed pociągiem (min)</label>
          <input
            name="train_buffer_minutes"
            type="number"
            min={0}
            defaultValue={settings.train_buffer_minutes}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Domyślna strefa czasowa</label>
          <input name="default_timezone" defaultValue={settings.default_timezone} className={inputClass} />
        </div>

        <div className="flex items-center gap-3 min-[560px]:col-span-2">
          <SubmitButton />
          {saved && <span className="text-xs text-emerald-700">Zapisano.</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </form>
    </section>
  );
}
