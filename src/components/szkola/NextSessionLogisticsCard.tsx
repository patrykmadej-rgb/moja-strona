import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { formatMoney } from "@/lib/szkola/money";
import type { Accommodation, TravelSegment } from "@/lib/szkola/types";

function TicketStatus({ label, has }: { label: string; has: boolean }) {
  return (
    <span className={has ? "flex items-center gap-1.5 text-[#1e7a42]" : "flex items-center gap-1.5 text-[#9a919f]"}>
      {has ? <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} /> : <Circle className="h-3.5 w-3.5" strokeWidth={1.75} />}
      {label}
    </span>
  );
}

export default function NextSessionLogisticsCard({
  sessionId,
  segments,
  accommodations,
}: {
  sessionId: string;
  segments: TravelSegment[];
  accommodations: Accommodation[];
}) {
  const activeSegments = segments.filter((s) => s.status !== "anulowane");
  const hasOutbound = activeSegments.some((s) => s.direction === "tam");
  const hasReturn = activeSegments.some((s) => s.direction === "powrot");
  const activeAccommodation = accommodations.find((a) => a.payment_status !== "anulowane") ?? null;

  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-[#201a2b]">Podróż i zakwaterowanie</h2>
        <Link href={`/lab/szkola/zjazdy/${sessionId}`} className="text-xs font-medium text-[#5b2a86] hover:underline">
          Zobacz zjazd →
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs">
        <TicketStatus label="Bilet tam" has={hasOutbound} />
        <TicketStatus label="Bilet powrotny" has={hasReturn} />
      </div>

      <div className="mt-4 border-t border-[#eee9f2] pt-3">
        {activeAccommodation ? (
          <div className="text-xs text-[#706878]">
            <p className="text-sm font-medium text-[#201a2b]">{activeAccommodation.name}</p>
            <p className="mt-0.5">
              {[
                activeAccommodation.check_in && activeAccommodation.check_out
                  ? `${activeAccommodation.check_in} → ${activeAccommodation.check_out}`
                  : null,
                activeAccommodation.price != null ? formatMoney(activeAccommodation.price, activeAccommodation.currency) : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {activeAccommodation.free_cancellation_until && (
              <p className="mt-0.5 text-[#9a919f]">Darmowe anulowanie do {activeAccommodation.free_cancellation_until}</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-[#9a919f]">Brak zarezerwowanego noclegu.</p>
        )}
      </div>
    </section>
  );
}
