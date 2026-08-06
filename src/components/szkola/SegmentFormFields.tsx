"use client";

import {
  CURRENCIES,
  SEGMENT_DIRECTIONS,
  SEGMENT_DIRECTION_LABELS,
  SEGMENT_STATUSES,
  SEGMENT_STATUS_LABELS,
  SEGMENT_TYPES,
  SEGMENT_TYPE_LABELS,
  type TravelSegment,
} from "@/lib/szkola/types";

export const inputClass =
  "rounded-[10px] border border-[#e8e2ec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86]";
export const labelClass = "text-xs font-medium text-[#201a2b]";

/** Wspólne pola formularza odcinka podróży (sekcja 2 briefu) — używane zarówno w zakładce Podróże danego zjazdu, jak i w ogólnej zakładce /lab/szkola/podroze (bez zjazdu). */
export default function SegmentFormFields({ segment }: { segment?: TravelSegment }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Typ transportu</label>
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
          <label className={labelClass}>Miejsce rozpoczęcia</label>
          <input name="departure_place" defaultValue={segment?.departure_place ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Miejsce zakończenia</label>
          <input name="arrival_place" defaultValue={segment?.arrival_place ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Data i godzina rozpoczęcia</label>
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
          <label className={labelClass}>Data i godzina zakończenia</label>
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
          <label className={labelClass}>Nr lotu / pociągu / rezerwacji</label>
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
        <label className={labelClass}>Notatka</label>
        <textarea name="notes" rows={2} defaultValue={segment?.notes ?? ""} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Dokument / bilet (link)</label>
        <input name="link" type="url" placeholder="https://…" defaultValue={segment?.link ?? ""} className={inputClass} />
      </div>
    </>
  );
}
