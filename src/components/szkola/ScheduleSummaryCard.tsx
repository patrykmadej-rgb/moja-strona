import { CalendarClock } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import { formatHours } from "@/lib/szkola/format";
import type { SessionScheduleItem } from "@/lib/szkola/types";

export default function ScheduleSummaryCard({
  items,
  onNavigateTab,
}: {
  items: SessionScheduleItem[];
  onNavigateTab: () => void;
}) {
  const daysCount = new Set(items.map((item) => item.item_date)).size;
  const totalHours = items.reduce((sum, item) => sum + (item.hours ?? 0), 0);

  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-[#201a2b]">Plan zajęć</h2>
        {items.length > 0 && (
          <button type="button" onClick={onNavigateTab} className="text-sm font-medium text-[#5b2a86] hover:underline">
            Zobacz plan →
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Brak punktów planu"
          subtitle="Dodaj harmonogram zajęć dla tego zjazdu."
          action={{ label: "Dodaj punkt planu", onClick: onNavigateTab }}
          compact
        />
      ) : (
        <div className="mt-3 flex gap-6 text-sm">
          <div>
            <p className="text-lg font-semibold text-[#201a2b]">{daysCount}</p>
            <p className="text-xs text-[#706878]">{daysCount === 1 ? "dzień" : "dni"}</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-[#201a2b]">{items.length}</p>
            <p className="text-xs text-[#706878]">punktów programu</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-[#201a2b]">{formatHours(totalHours)}</p>
            <p className="text-xs text-[#706878]">łącznie</p>
          </div>
        </div>
      )}
    </section>
  );
}
