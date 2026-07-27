"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { createTrip } from "@/app/panel/zjazdy/actions";

const inputClass =
  "rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 self-start rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
    >
      {pending ? "Dodawanie…" : "Dodaj zjazd"}
    </button>
  );
}

export default function TripForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createTrip(formData);
        formRef.current?.reset();
      }}
      className="mt-6 flex flex-col gap-3 rounded-xl border border-black/10 p-5 dark:border-white/10"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="event_date" className="text-sm font-medium">
            Data zjazdu
          </label>
          <input id="event_date" name="event_date" type="date" required className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ticket_reservation_number" className="text-sm font-medium">
            Nr rezerwacji biletu
          </label>
          <input id="ticket_reservation_number" name="ticket_reservation_number" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="accommodation" className="text-sm font-medium">
            Zakwaterowanie
          </label>
          <input id="accommodation" name="accommodation" placeholder="np. Hotel Centrum" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="address" className="text-sm font-medium">
            Adres
          </label>
          <input id="address" name="address" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cost" className="text-sm font-medium">
            Koszt (PLN)
          </label>
          <input id="cost" name="cost" type="number" step="0.01" min="0" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="file" className="text-sm font-medium">
            Bilet (PDF)
          </label>
          <input id="file" name="file" type="file" accept="application/pdf" className="text-sm" />
        </div>
      </div>

      <label htmlFor="paid" className="flex items-center gap-2 text-sm font-medium">
        <input id="paid" name="paid" type="checkbox" className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-700" />
        Opłacone
      </label>

      <SubmitButton />
    </form>
  );
}
