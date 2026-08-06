import { History, GraduationCap, FileText } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import { formatRelativeTime } from "@/lib/lab/format";
import type { ActivityItem, DashboardSource } from "@/lib/dashboard/types";

const SOURCE_ICONS: Record<DashboardSource, typeof GraduationCap> = {
  school: GraduationCap,
  article: FileText,
};

export default function DashboardActivityCard({ items, error }: { items: ActivityItem[]; error: string | null }) {
  return (
    <section aria-labelledby="dashboard-activity-heading" className="flex h-full flex-col rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <h2 id="dashboard-activity-heading" className="text-sm font-semibold text-[#201a2b]">
        Ostatnia aktywność
      </h2>

      {error ? (
        <p className="mt-3 text-xs text-[#9a2f2f]">{error}</p>
      ) : items.length === 0 ? (
        <EmptyState icon={History} title="Brak ostatniej aktywności" compact />
      ) : (
        <ul className="mt-3">
          {items.map((item) => {
            const Icon = SOURCE_ICONS[item.source];
            return (
              <li key={item.id} className="flex items-start gap-2.5 border-b border-[#eee9f2] py-2.5 last:border-b-0">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-[#f1eafd] text-[#5b2a86]">
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-[#201a2b]">{item.description}</p>
                  <p className="mt-0.5 text-[11px] text-[#9a919f]">{formatRelativeTime(item.at)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
