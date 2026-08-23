import Link from "next/link";
import { CalendarRange, CheckCircle2, AlertTriangle, MinusCircle, CircleHelp, MapPin, Plane, Bed } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import { formatSessionDateRange } from "@/lib/szkola/format";
import { formatShortDate } from "@/lib/lab/format";
import { ACCOMMODATION_STATUS_LABELS, SEGMENT_STATUS_LABELS } from "@/lib/szkola/types";
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

          {/* Sekcja 3 briefu (mobilny ekran startowy): konkretne dane lotu/
              noclegu, nie tylko zagregowany status jak wyżej — jeśli ich
              brak, elegancki link do dodania zamiast pustego miejsca. */}
          <div className="mt-3 grid grid-cols-1 gap-2.5 border-t border-[#eee9f2] pt-3 text-xs min-[560px]:grid-cols-2">
            {data.nextSegment ? (
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-medium text-[#201a2b]">
                  <Plane className="h-3.5 w-3.5 shrink-0 text-[#5b2a86]" strokeWidth={1.75} aria-hidden="true" />
                  <span className="min-w-0 truncate">
                    {data.nextSegment.departure_place || "?"} → {data.nextSegment.arrival_place || "?"}
                  </span>
                </p>
                <p className="mt-0.5 truncate text-[#706878]">
                  {[
                    data.nextSegment.departure_date ? formatShortDate(data.nextSegment.departure_date) : null,
                    data.nextSegment.departure_time?.slice(0, 5),
                    data.nextSegment.carrier,
                    SEGMENT_STATUS_LABELS[data.nextSegment.status],
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            ) : (
              <Link
                href={`/lab/szkola/zjazdy/${data.session.id}`}
                className="flex items-center gap-1.5 text-[#706878] transition-colors hover:text-[#5b2a86]"
              >
                <Plane className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                Brak dodanego lotu — dodaj w zjeździe
              </Link>
            )}

            {data.nextAccommodation ? (
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-medium text-[#201a2b]">
                  <Bed className="h-3.5 w-3.5 shrink-0 text-[#5b2a86]" strokeWidth={1.75} aria-hidden="true" />
                  <span className="min-w-0 truncate">{data.nextAccommodation.name}</span>
                </p>
                <p className="mt-0.5 truncate text-[#706878]">
                  {[
                    data.nextAccommodation.check_in && data.nextAccommodation.check_out
                      ? `${formatShortDate(data.nextAccommodation.check_in)} – ${formatShortDate(data.nextAccommodation.check_out)}`
                      : null,
                    ACCOMMODATION_STATUS_LABELS[data.nextAccommodation.payment_status],
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            ) : (
              <Link
                href={`/lab/szkola/zjazdy/${data.session.id}`}
                className="flex items-center gap-1.5 text-[#706878] transition-colors hover:text-[#5b2a86]"
              >
                <Bed className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                Brak dodanego noclegu — dodaj w zjeździe
              </Link>
            )}
          </div>

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
