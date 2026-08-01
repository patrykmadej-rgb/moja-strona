import { Clock } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import { formatHours } from "@/lib/szkola/format";
import { TRAINING_HOUR_CATEGORY_LABELS, type TrainingHoursEntry } from "@/lib/szkola/types";

export default function HoursSummaryCard({
  entries,
  onNavigateTab,
}: {
  entries: TrainingHoursEntry[];
  onNavigateTab: () => void;
}) {
  const totalsByCategory = new Map<string, number>();
  for (const entry of entries) {
    totalsByCategory.set(entry.category, (totalsByCategory.get(entry.category) ?? 0) + entry.hours);
  }
  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);

  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-[#201a2b]">Godziny szkoleniowe</h2>
        {entries.length > 0 && (
          <button type="button" onClick={onNavigateTab} className="text-sm font-medium text-[#5b2a86] hover:underline">
            Zobacz godziny →
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Brak wpisów godzinowych"
          subtitle="Dodaj wpis ręcznie albo z planu zajęć."
          action={{ label: "Dodaj wpis", onClick: onNavigateTab }}
          compact
        />
      ) : (
        <div className="mt-3">
          <p className="text-lg font-semibold text-[#201a2b]">{formatHours(totalHours)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Array.from(totalsByCategory.entries()).map(([category, hours]) => (
              <span key={category} className="rounded-full bg-[#f1eafd] px-2.5 py-1 text-xs text-[#5b2a86]">
                {TRAINING_HOUR_CATEGORY_LABELS[category as keyof typeof TRAINING_HOUR_CATEGORY_LABELS]}: {formatHours(hours)}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
