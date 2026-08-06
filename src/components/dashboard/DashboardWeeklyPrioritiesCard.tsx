import Link from "next/link";
import EmptyState from "@/components/lab/EmptyState";
import { Target } from "lucide-react";
import { ATTENTION_SEVERITY_LABELS, type AttentionSeverity, type WeeklyPriority } from "@/lib/dashboard/types";

const SEVERITY_ACCENT: Record<AttentionSeverity, string> = {
  critical: "border-[#f3c9c9] bg-[#fbe9e9] text-[#9a2f2f]",
  urgent: "border-[#f2ddb0] bg-[#fdf1de] text-[#8a5a12]",
  review: "border-[#e3d5f5] bg-[#f1eafd] text-[#5b2a86]",
  info: "border-[#e2dfe4] bg-[#efedf0] text-[#4f4758]",
};

export default function DashboardWeeklyPrioritiesCard({ priorities, error }: { priorities: WeeklyPriority[]; error: string | null }) {
  return (
    <section aria-labelledby="dashboard-weekly-priorities-heading" className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <h2 id="dashboard-weekly-priorities-heading" className="text-sm font-semibold text-[#201a2b]">
        Priorytety na ten tydzień
      </h2>

      {error ? (
        <p className="mt-3 text-xs text-[#9a2f2f]">{error}</p>
      ) : priorities.length === 0 ? (
        <EmptyState icon={Target} title="Brak wyraźnych priorytetów — dobra robota." compact />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 min-[800px]:grid-cols-3">
          {priorities.map((priority) => (
            <div key={priority.rank} className={`rounded-[12px] border p-4 ${SEVERITY_ACCENT[priority.severity]}`}>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold">{priority.rank}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide">{ATTENTION_SEVERITY_LABELS[priority.severity]}</span>
              </div>
              <p className="mt-2 text-sm font-medium text-[#201a2b]">{priority.title}</p>
              <Link href={priority.actionHref} className="mt-2 inline-block text-xs font-medium underline underline-offset-2">
                {priority.actionLabel} →
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
