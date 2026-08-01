import Link from "next/link";
import { AlertTriangle, CalendarClock } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import { CALENDAR_CHANGE_FIELD_LABELS, CALENDAR_CHANGE_TYPE_LABELS, type CalendarChangeType } from "@/lib/szkola/types";

export type DashboardCalendarChange = {
  id: string;
  change_type: CalendarChangeType;
  field_name: string | null;
  impact_level: "none" | "information" | "warning" | "conflict";
  impact_summary: string | null;
  session_title: string | null;
};

function describeChange(change: DashboardCalendarChange): string {
  const subject = change.session_title ?? "Wydarzenie";
  if (change.change_type === "created") return `${subject} — nowe wydarzenie w kalendarzu`;
  if (change.change_type === "cancelled") return `${subject} — zjazd anulowany w kalendarzu`;
  if (change.change_type === "deleted") return `${subject} — wydarzenie usunięte z kalendarza`;
  if (change.field_name) {
    return `${subject} — zmiana: ${CALENDAR_CHANGE_FIELD_LABELS[change.field_name] ?? change.field_name}`;
  }
  return `${subject} — ${CALENDAR_CHANGE_TYPE_LABELS[change.change_type].toLowerCase()}`;
}

export default function CalendarChangesSummaryCard({
  calendarConnected,
  changes,
  totalCount,
}: {
  calendarConnected: boolean;
  changes: DashboardCalendarChange[];
  totalCount: number;
}) {
  const conflicts = changes.filter((c) => c.impact_level === "conflict");

  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-[#201a2b]">Zmiany w kalendarzu</h2>
        {totalCount > 0 && (
          <Link href="/lab/szkola/kalendarz/zmiany" className="text-sm font-medium text-[#5b2a86] hover:underline">
            Zobacz zmiany →
          </Link>
        )}
      </div>

      {!calendarConnected ? (
        <EmptyState
          icon={CalendarClock}
          title="Kalendarz niepołączony"
          subtitle="Połącz Google Calendar, żeby automatycznie śledzić zmiany terminów."
          compact
        />
      ) : totalCount === 0 ? (
        <p className="mt-3 text-sm text-[#706878]">Brak nowych zmian od ostatniej synchronizacji.</p>
      ) : (
        <div className="mt-3">
          <p className="text-lg font-semibold text-[#201a2b]">
            {totalCount} {totalCount === 1 ? "nowa zmiana" : "nowe zmiany"}
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-[#4f4758]">
            {changes.slice(0, 2).map((change) => (
              <li key={change.id}>{describeChange(change)}</li>
            ))}
          </ul>

          {conflicts.length > 0 && (
            <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span>
                Uwaga: {conflicts.length === 1 ? "jedna zmiana może kolidować" : `${conflicts.length} zmiany mogą kolidować`} z
                podróżą lub noclegiem.
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
