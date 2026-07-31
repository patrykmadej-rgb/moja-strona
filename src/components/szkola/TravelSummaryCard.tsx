import { Plane } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import { formatMoney } from "@/lib/szkola/money";
import { SEGMENT_DIRECTION_LABELS, SEGMENT_STATUS_LABELS, type TravelSegment } from "@/lib/szkola/types";

export default function TravelSummaryCard({
  segments,
  onNavigateTab,
}: {
  segments: TravelSegment[];
  onNavigateTab: () => void;
}) {
  const sorted = [...segments].sort((a, b) => (a.departure_date ?? "").localeCompare(b.departure_date ?? ""));

  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-[#201a2b]">Podróż</h2>
        {segments.length > 0 && (
          <button type="button" onClick={onNavigateTab} className="text-sm font-medium text-[#5b2a86] hover:underline">
            Zobacz wszystkie odcinki →
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={Plane}
          title="Brak dodanych odcinków"
          subtitle="Dodaj bilet tam i powrotny."
          action={{ label: "Dodaj odcinek", onClick: onNavigateTab }}
          compact
        />
      ) : (
        <ul className="mt-3">
          {sorted.slice(0, 4).map((segment) => (
            <li key={segment.id} className="flex items-center justify-between gap-3 border-b border-[#eee9f2] py-2 text-sm last:border-b-0">
              <div className="min-w-0">
                <p className="truncate text-[#201a2b]">
                  {segment.direction && (
                    <span className="mr-1 text-xs text-[#5b2a86]">{SEGMENT_DIRECTION_LABELS[segment.direction]} ·</span>
                  )}
                  {segment.departure_place || "?"} → {segment.arrival_place || "?"}
                </p>
                <p className="truncate text-xs text-[#706878]">
                  {[segment.departure_date, segment.price != null ? formatMoney(segment.price, segment.currency) : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <span className="shrink-0 text-xs text-[#706878]">{SEGMENT_STATUS_LABELS[segment.status]}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
