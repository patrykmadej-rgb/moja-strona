"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Bus,
  Car,
  CarTaxiFront,
  Footprints,
  Package,
  Plane,
  Train,
} from "lucide-react";
import { addSegment, deleteSegment, updateSegment } from "@/app/lab/szkola/zjazdy/[id]/actions";
import EmptyState from "@/components/lab/EmptyState";
import { formatMoney } from "@/lib/szkola/money";
import {
  CURRENCIES,
  SEGMENT_DIRECTIONS,
  SEGMENT_DIRECTION_LABELS,
  SEGMENT_STATUSES,
  SEGMENT_STATUS_LABELS,
  SEGMENT_TYPES,
  SEGMENT_TYPE_LABELS,
  type SegmentType,
  type TravelSegment,
} from "@/lib/szkola/types";

const inputClass =
  "rounded-[10px] border border-[#e8e2ec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86]";
const labelClass = "text-xs font-medium text-[#201a2b]";

const SEGMENT_ICONS: Record<SegmentType, typeof Plane> = {
  samolot: Plane,
  pociag: Train,
  autobus: Bus,
  samochod: Car,
  taxi: CarTaxiFront,
  komunikacja_miejska: Bus,
  pieszo: Footprints,
  inne: Package,
};

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

function SegmentFields({ segment }: { segment?: TravelSegment }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Typ</label>
          <select name="segment_type" defaultValue={segment?.segment_type ?? "samolot"} className={inputClass}>
            {SEGMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {SEGMENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Kierunek</label>
          <select name="direction" defaultValue={segment?.direction ?? ""} className={inputClass}>
            <option value="">Nie określono</option>
            {SEGMENT_DIRECTIONS.map((d) => (
              <option key={d} value={d}>
                {SEGMENT_DIRECTION_LABELS[d]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Miejsce wyjazdu</label>
          <input name="departure_place" defaultValue={segment?.departure_place ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Miejsce przyjazdu</label>
          <input name="arrival_place" defaultValue={segment?.arrival_place ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Data i godzina wyjazdu</label>
          <div className="flex gap-2">
            <input name="departure_date" type="date" defaultValue={segment?.departure_date ?? ""} className={inputClass} />
            <input
              name="departure_time"
              type="time"
              defaultValue={segment?.departure_time?.slice(0, 5) ?? ""}
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Data i godzina przyjazdu</label>
          <div className="flex gap-2">
            <input name="arrival_date" type="date" defaultValue={segment?.arrival_date ?? ""} className={inputClass} />
            <input
              name="arrival_time"
              type="time"
              defaultValue={segment?.arrival_time?.slice(0, 5) ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Przewoźnik</label>
          <input name="carrier" defaultValue={segment?.carrier ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Nr lotu / pociągu</label>
          <input name="transport_number" defaultValue={segment?.transport_number ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Nr rezerwacji</label>
          <input name="reservation_number" defaultValue={segment?.reservation_number ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Miejsce</label>
          <input name="seat" defaultValue={segment?.seat ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Bagaż</label>
          <input name="baggage" defaultValue={segment?.baggage ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_90px_1fr]">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Cena</label>
          <input name="price" type="number" min={0} step="0.01" defaultValue={segment?.price ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Waluta</label>
          <select name="currency" defaultValue={segment?.currency ?? "PLN"} className={inputClass}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Status</label>
          <select name="status" defaultValue={segment?.status ?? "do_zakupu"} className={inputClass}>
            {SEGMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {SEGMENT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Link (potwierdzenie / bilet online)</label>
        <input name="link" type="url" defaultValue={segment?.link ?? ""} className={inputClass} />
      </div>
    </>
  );
}

function SegmentCard({ sessionId, segment }: { sessionId: string; segment: TravelSegment }) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const Icon = SEGMENT_ICONS[segment.segment_type];

  if (isEditing) {
    return (
      <li className="border-b border-[#eee9f2] py-4 last:border-b-0">
        <form
          action={async (formData) => {
            setError(null);
            try {
              await updateSegment(formData);
              setIsEditing(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Nie udało się zapisać odcinka.");
            }
          }}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="id" value={segment.id} />
          <SegmentFields segment={segment} />
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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#f1eafd] text-[#5b2a86]">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#201a2b]">
            {segment.direction && (
              <span className="mr-1.5 text-xs font-normal text-[#5b2a86]">
                {SEGMENT_DIRECTION_LABELS[segment.direction]} ·
              </span>
            )}
            {segment.departure_place || "?"} → {segment.arrival_place || "?"}
          </p>
          <p className="mt-0.5 truncate text-xs text-[#706878]">
            {[
              segment.departure_date && `${segment.departure_date}${segment.departure_time ? ` ${segment.departure_time.slice(0, 5)}` : ""}`,
              segment.carrier,
              segment.price != null ? formatMoney(segment.price, segment.currency) : null,
              SEGMENT_STATUS_LABELS[segment.status],
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button type="button" onClick={() => setIsEditing(true)} className="text-sm text-[#5b2a86] hover:underline">
          Edytuj
        </button>
        <form
          action={deleteSegment}
          onSubmit={(e) => {
            if (!confirm("Usunąć ten odcinek podróży?")) e.preventDefault();
          }}
        >
          <input type="hidden" name="session_id" value={sessionId} />
          <input type="hidden" name="id" value={segment.id} />
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Usuń
          </button>
        </form>
      </div>
    </li>
  );
}

export default function TravelTab({ sessionId, segments }: { sessionId: string; segments: TravelSegment[] }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const sorted = [...segments].sort((a, b) => {
    if (a.direction !== b.direction) return (a.direction ?? "z").localeCompare(b.direction ?? "z");
    return (a.departure_date ?? "").localeCompare(b.departure_date ?? "");
  });

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-[#201a2b]">Odcinki podróży</h2>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="rounded-[10px] border border-[#e8e2ec] px-3 py-1.5 text-sm text-[#5b2a86] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]"
          >
            {showAddForm ? "Anuluj" : "+ Dodaj odcinek"}
          </button>
        </div>

        {showAddForm && (
          <form
            ref={formRef}
            action={async (formData) => {
              setError(null);
              try {
                await addSegment(formData);
                formRef.current?.reset();
                setShowAddForm(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Nie udało się dodać odcinka.");
              }
            }}
            className="mt-4 flex flex-col gap-3 rounded-[10px] border border-[#e8e2ec] bg-[#f7f4ef] p-4"
          >
            <input type="hidden" name="session_id" value={sessionId} />
            <SegmentFields />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <SubmitButton label="Dodaj odcinek" pendingLabel="Dodawanie…" />
          </form>
        )}

        <div className="mt-4">
          {sorted.length === 0 ? (
            <EmptyState
              icon={Plane}
              title="Brak dodanych odcinków podróży"
              subtitle="Dodaj bilet tam i powrotny, żeby śledzić status i koszt."
              action={{ label: "Dodaj odcinek", onClick: () => setShowAddForm(true) }}
              compact
            />
          ) : (
            <ul>
              {sorted.map((segment) => (
                <SegmentCard key={segment.id} sessionId={sessionId} segment={segment} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
