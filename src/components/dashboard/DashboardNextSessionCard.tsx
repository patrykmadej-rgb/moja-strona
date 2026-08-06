import Link from "next/link";
import { CalendarRange, CheckCircle2, AlertTriangle, MinusCircle, CircleHelp, MapPin } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import { formatSessionDateRange } from "@/lib/szkola/format";
import type { PrepStatusKind } from "@/lib/szkola/preparation";
import type { NextSessionData } from "@/lib/dashboard/types";

const STATUS_ICON: Record<PrepStatusKind, typeof CheckCircle2> = {
  done: CheckCircle2,
  attention: AlertTriangle,
  not_needed: MinusCircle,
  no_data: CircleHelp,
};

const STATUS_CLASS: Record<PrepStatusKind, string> = {
  done: "text-[#2f7a4c]",
  attention: "text-[#a76616]",
  not_needed: "text-[#9a919f]",
  no_data: "text-[#9a919f]",
};

/** Polska odmiana: 1 wpis, 2-4 wpisy (poza 12-14), reszta (0, 5+, 12-14) wpisów. */
function formatEntryCountLabel(count: number): string {
  if (count === 1) return "wpis";
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14)) return "wpisy";
  return "wpisów";
}

export default function DashboardNextSessionCard({ data, error }: { data: NextSessionData | null; error: string | null }) {
  return (
    <section aria-labelledby="dashboard-next-session-heading" className="flex h-full flex-col rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <h2 id="dashboard-next-session-heading" className="text-sm font-semibold text-[#201a2b]">
        Najbliższy zjazd
      </h2>

      {error ? (
        <p className="mt-3 text-xs text-[#9a2f2f]">{error}</p>
      ) : !data ? (
        <EmptyState
          icon={CalendarRange}
          title="Brak zaplanowanych zjazdów"
          subtitle="Dodaj zjazd albo sprawdź kalendarz."
          compact
        />
      ) : (
        <>
          <div className="mt-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-[#706878]">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              {data.session.city || "Miejsce nieokreślone"} · {data.session.session_number ? `Zjazd ${data.session.session_number}` : data.session.title}
            </p>
            <p className="mt-1 font-[family-name:var(--font-cormorant)] text-[20px] font-semibold leading-tight text-[#201a2b]">
              {formatSessionDateRange(data.session.start_date, data.session.end_date)}
            </p>
            <p className="mt-0.5 text-xs text-[#9a919f]">
              {data.daysUntil === 0 ? "Dziś" : data.daysUntil > 0 ? `Za ${data.daysUntil} dni` : "Trwa"}
            </p>
          </div>

          <ul className="mt-4 flex flex-col gap-1.5 border-t border-[#eee9f2] pt-3 text-xs">
            {[data.transportStatus, data.accommodationStatus, data.paymentStatus].map((status) => {
              const Icon = STATUS_ICON[status.kind];
              return (
                <li key={status.key} className={`flex items-center gap-1.5 ${STATUS_CLASS[status.kind]}`}>
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  {status.detail}
                </li>
              );
            })}
            <li className="flex items-center gap-1.5 text-[#706878]">
              Koszty: {data.costCount} {formatEntryCountLabel(data.costCount)}
            </li>
          </ul>

          {data.schedulePreview.length > 0 && (
            <ul className="mt-3 border-t border-[#eee9f2] pt-3 text-xs text-[#706878]">
              {data.schedulePreview.map((day) => (
                <li key={day.label} className="flex items-center justify-between gap-2 py-0.5">
                  <span>{day.label}</span>
                  <span>{day.time}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/lab/szkola/zjazdy/${data.session.id}`}
              className="rounded-[10px] bg-[#5b2a86] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#32134f]"
            >
              Otwórz zjazd
            </Link>
            <Link
              href="/lab/szkola/podroze"
              className="rounded-[10px] border border-[#e8e2ec] px-4 py-2 text-xs font-medium text-[#201a2b] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]"
            >
              Zobacz podróż
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
