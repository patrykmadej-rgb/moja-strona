import { Bed } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import { formatMoney } from "@/lib/szkola/money";
import { ACCOMMODATION_STATUS_LABELS, type Accommodation } from "@/lib/szkola/types";

export default function AccommodationSummaryCard({
  accommodations,
  onNavigateTab,
}: {
  accommodations: Accommodation[];
  onNavigateTab: () => void;
}) {
  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-[#201a2b]">Zakwaterowanie</h2>
        {accommodations.length > 0 && (
          <button type="button" onClick={onNavigateTab} className="text-sm font-medium text-[#5b2a86] hover:underline">
            Zobacz →
          </button>
        )}
      </div>

      {accommodations.length === 0 ? (
        <EmptyState
          icon={Bed}
          title="Brak zarezerwowanego noclegu"
          action={{ label: "Dodaj nocleg", onClick: onNavigateTab }}
          compact
        />
      ) : (
        <ul className="mt-3">
          {accommodations.map((accommodation) => (
            <li key={accommodation.id} className="border-b border-[#eee9f2] py-2 text-sm last:border-b-0">
              <p className="truncate text-[#201a2b]">{accommodation.name}</p>
              <p className="truncate text-xs text-[#706878]">
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
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
