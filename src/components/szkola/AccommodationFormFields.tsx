"use client";

import { ACCOMMODATION_STATUSES, ACCOMMODATION_STATUS_LABELS, CURRENCIES, type Accommodation } from "@/lib/szkola/types";
import { inputClass, labelClass } from "@/components/szkola/SegmentFormFields";

/** Wspólne pola formularza zakwaterowania (sekcja 3 briefu) — używane zarówno w zakładce Zakwaterowanie danego zjazdu, jak i w ogólnej zakładce /lab/szkola/zakwaterowanie (bez zjazdu). */
export default function AccommodationFormFields({ accommodation }: { accommodation?: Accommodation }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Nazwa obiektu *</label>
          <input name="name" required defaultValue={accommodation?.name ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Miasto</label>
          <input name="city" defaultValue={accommodation?.city ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Adres</label>
        <input name="address" defaultValue={accommodation?.address ?? ""} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Zameldowanie</label>
          <input name="check_in" type="date" defaultValue={accommodation?.check_in ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Wymeldowanie</label>
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
        <label className={labelClass}>Notatka</label>
        <textarea name="notes" rows={2} defaultValue={accommodation?.notes ?? ""} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Dokument rezerwacji (link)</label>
        <input name="link" type="url" placeholder="https://…" defaultValue={accommodation?.link ?? ""} className={inputClass} />
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
