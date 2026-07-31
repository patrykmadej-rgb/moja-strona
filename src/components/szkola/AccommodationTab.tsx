"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Bed, ExternalLink } from "lucide-react";
import { addAccommodation, deleteAccommodation, updateAccommodation } from "@/app/lab/szkola/zjazdy/[id]/actions";
import EmptyState from "@/components/lab/EmptyState";
import { formatMoney } from "@/lib/szkola/money";
import { getDaysUntil } from "@/lib/szkola/preparation";
import {
  ACCOMMODATION_STATUSES,
  ACCOMMODATION_STATUS_LABELS,
  CURRENCIES,
  type Accommodation,
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

function AccommodationFields({ accommodation }: { accommodation?: Accommodation }) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Nazwa obiektu *</label>
        <input name="name" required defaultValue={accommodation?.name ?? ""} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Adres</label>
        <input name="address" defaultValue={accommodation?.address ?? ""} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Check-in</label>
          <input name="check_in" type="date" defaultValue={accommodation?.check_in ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Check-out</label>
          <input name="check_out" type="date" defaultValue={accommodation?.check_out ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_90px_1fr]">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Cena</label>
          <input
            name="price"
            type="number"
            min={0}
            step="0.01"
            defaultValue={accommodation?.price ?? ""}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Waluta</label>
          <select name="currency" defaultValue={accommodation?.currency ?? "PLN"} className={inputClass}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Status płatności</label>
          <select
            name="payment_status"
            defaultValue={accommodation?.payment_status ?? "do_znalezienia"}
            className={inputClass}
          >
            {ACCOMMODATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ACCOMMODATION_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Nr rezerwacji</label>
          <input
            name="reservation_number"
            defaultValue={accommodation?.reservation_number ?? ""}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Bezpłatne anulowanie do</label>
          <input
            name="free_cancellation_until"
            type="date"
            defaultValue={accommodation?.free_cancellation_until ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Warunki anulowania</label>
        <input
          name="cancellation_policy"
          defaultValue={accommodation?.cancellation_policy ?? ""}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Odległość od szkoły</label>
          <input
            name="distance_to_venue"
            defaultValue={accommodation?.distance_to_venue ?? ""}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Czas dojazdu</label>
          <input
            name="travel_time_to_venue"
            defaultValue={accommodation?.travel_time_to_venue ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Link do rezerwacji</label>
        <input name="link" type="url" defaultValue={accommodation?.link ?? ""} className={inputClass} />
      </div>

      <label className="flex items-center gap-2 text-sm text-[#201a2b]">
        <input
          type="checkbox"
          name="breakfast_included"
          defaultChecked={accommodation?.breakfast_included ?? false}
          className="h-4 w-4 accent-[#5b2a86]"
        />
        Śniadanie wliczone
      </label>
    </>
  );
}

function AccommodationCard({ sessionId, accommodation }: { sessionId: string; accommodation: Accommodation }) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const daysUntilFreeCancellation = accommodation.free_cancellation_until
    ? getDaysUntil(accommodation.free_cancellation_until)
    : null;
  const cancellationSoon =
    accommodation.payment_status !== "anulowane" &&
    daysUntilFreeCancellation !== null &&
    daysUntilFreeCancellation >= 0 &&
    daysUntilFreeCancellation <= 3;

  if (isEditing) {
    return (
      <li className="border-b border-[#eee9f2] py-4 last:border-b-0">
        <form
          action={async (formData) => {
            setError(null);
            try {
              await updateAccommodation(formData);
              setIsEditing(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Nie udało się zapisać noclegu.");
            }
          }}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="id" value={accommodation.id} />
          <AccommodationFields accommodation={accommodation} />
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
    <li className="border-b border-[#eee9f2] py-4 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#f1eafd] text-[#5b2a86]">
            <Bed className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#201a2b]">{accommodation.name}</p>
            <p className="mt-0.5 truncate text-xs text-[#706878]">
              {[
                accommodation.check_in && accommodation.check_out
                  ? `${accommodation.check_in} → ${accommodation.check_out}`
                  : null,
                accommodation.price != null ? formatMoney(accommodation.price, accommodation.currency) : null,
                ACCOMMODATION_STATUS_LABELS[accommodation.payment_status],
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {accommodation.link && (
            <a
              href={accommodation.link}
              target="_blank"
              rel="noreferrer"
              className="text-[#706878] hover:text-[#5b2a86]"
              aria-label="Otwórz link do rezerwacji"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
            </a>
          )}
          <button type="button" onClick={() => setIsEditing(true)} className="text-sm text-[#5b2a86] hover:underline">
            Edytuj
          </button>
          <form
            action={deleteAccommodation}
            onSubmit={(e) => {
              if (!confirm(`Usunąć nocleg „${accommodation.name}”?`)) e.preventDefault();
            }}
          >
            <input type="hidden" name="session_id" value={sessionId} />
            <input type="hidden" name="id" value={accommodation.id} />
            <button type="submit" className="text-sm text-red-600 hover:underline">
              Usuń
            </button>
          </form>
        </div>
      </div>
      {cancellationSoon && (
        <p className="mt-2 rounded-[10px] bg-[#fff2d9] px-3 py-2 text-xs text-[#a76616]">
          Bezpłatne anulowanie kończy się{" "}
          {daysUntilFreeCancellation === 0 ? "dziś" : `za ${daysUntilFreeCancellation} dni`}.
        </p>
      )}
    </li>
  );
}

export default function AccommodationTab({
  sessionId,
  accommodations,
}: {
  sessionId: string;
  accommodations: Accommodation[];
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-[#201a2b]">Zakwaterowanie</h2>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="rounded-[10px] border border-[#e8e2ec] px-3 py-1.5 text-sm text-[#5b2a86] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]"
          >
            {showAddForm ? "Anuluj" : "+ Dodaj nocleg"}
          </button>
        </div>

        {showAddForm && (
          <form
            ref={formRef}
            action={async (formData) => {
              setError(null);
              try {
                await addAccommodation(formData);
                formRef.current?.reset();
                setShowAddForm(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Nie udało się dodać noclegu.");
              }
            }}
            className="mt-4 flex flex-col gap-3 rounded-[10px] border border-[#e8e2ec] bg-[#f7f4ef] p-4"
          >
            <input type="hidden" name="session_id" value={sessionId} />
            <AccommodationFields />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <SubmitButton label="Dodaj nocleg" pendingLabel="Dodawanie…" />
          </form>
        )}

        <div className="mt-4">
          {accommodations.length === 0 ? (
            <EmptyState
              icon={Bed}
              title="Brak dodanego noclegu"
              subtitle="Dodaj rezerwację, żeby śledzić cenę i terminy anulowania."
              action={{ label: "Dodaj nocleg", onClick: () => setShowAddForm(true) }}
              compact
            />
          ) : (
            <ul>
              {accommodations.map((accommodation) => (
                <AccommodationCard key={accommodation.id} sessionId={sessionId} accommodation={accommodation} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
