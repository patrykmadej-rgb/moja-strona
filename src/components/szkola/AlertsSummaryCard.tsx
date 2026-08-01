import Link from "next/link";
import { AlertTriangle, Bell } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import { ALERT_PRIORITY_LABELS, type SchoolAlert } from "@/lib/szkola/types";

const PRIORITY_ORDER: SchoolAlert["priority"][] = ["pilne", "uwaga", "informacja"];

export default function AlertsSummaryCard({ alerts }: { alerts: SchoolAlert[] }) {
  const active = alerts.filter((a) => a.status === "new" || a.status === "seen");
  const sorted = [...active].sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority));
  const urgentCount = active.filter((a) => a.priority === "pilne").length;

  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-[#201a2b]">Alerty</h2>
        {active.length > 0 && (
          <Link href="/lab/szkola/alerty" className="text-xs font-medium text-[#5b2a86] hover:underline">
            Zobacz wszystkie →
          </Link>
        )}
      </div>

      {active.length === 0 ? (
        <EmptyState icon={Bell} title="Brak aktywnych alertów" subtitle="Wszystko wygląda w porządku." compact />
      ) : (
        <div className="mt-3">
          {urgentCount > 0 && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.75} />
              {urgentCount} {urgentCount === 1 ? "pilny alert" : "pilne alerty"}
            </p>
          )}
          <ul className="mt-2 flex flex-col gap-1.5 text-sm text-[#4f4758]">
            {sorted.slice(0, 3).map((alert) => (
              <li key={alert.id} className="truncate">
                <span className="mr-1.5 text-xs text-[#9a919f]">{ALERT_PRIORITY_LABELS[alert.priority]}</span>
                {alert.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
