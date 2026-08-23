import Link from "next/link";
import { CalendarClock } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import { formatDateOnly, formatDateTime } from "@/lib/lab/format";
import type { DashboardSource, UpcomingDeadline } from "@/lib/dashboard/types";

const SOURCE_DOT_CLASS: Record<DashboardSource, string> = {
  school: "bg-[#5b2a86]",
  article: "bg-[#c3963b]",
};

const SOURCE_LABELS: Record<DashboardSource, string> = {
  school: "Szkoła",
  article: "Artykuł",
};

function formatDeadlineShort(date: string): string {
  return date.length > 10 ? formatDateTime(date) : formatDateOnly(date);
}

/**
 * Poprawka nakładania się nazwy i daty na telefonie (np. "Aarhus →
 * Kopenhaga" + godzina lotu): poniżej 560px tytuł dostaje osobny, pełnej
 * szerokości pierwszy wiersz, a kategoria+data schodzą do drugiego wiersza
 * — zamiast dzielić jedną wąską linię, gdzie oba traciły miejsce. Od 560px
 * wzwyż układ jest DOSŁOWNIE tą samą strukturą/klasami co wcześniej
 * (jeden wiersz: kropka, tytuł+kategoria, data) — desktop bez zmian.
 * Oba warianty renderują się zawsze (przełączane samym CSS `hidden`/
 * `min-[560px]:*`), więc nie ma ryzyka niezgodności SSR/hydratacji.
 */
function DeadlineRow({ deadline }: { deadline: UpcomingDeadline }) {
  const dot = <span className={`h-2 w-2 shrink-0 rounded-full ${SOURCE_DOT_CLASS[deadline.source]}`} aria-hidden="true" />;
  const badge = (
    <span className="shrink-0 rounded-full bg-[#efedf0] px-1.5 py-0.5 font-medium text-[#4f4758]">{SOURCE_LABELS[deadline.source]}</span>
  );
  const dateText = <span className="shrink-0 text-xs font-medium text-[#706878]">{formatDeadlineShort(deadline.date)}</span>;

  return (
    <li className="border-b border-[#eee9f2] py-2.5 last:border-b-0">
      {/* Mobile (<560px): tytuł w pełnej szerokości, kategoria+data pod spodem. */}
      <div className="flex items-center gap-2.5 min-[560px]:hidden">
        {dot}
        <Link href={deadline.actionHref} className="min-w-0 flex-1 truncate text-sm text-[#201a2b] hover:text-[#5b2a86]">
          {deadline.title}
        </Link>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 pl-[18px] min-[560px]:hidden">
        <p className="flex min-w-0 items-center gap-1.5 text-[11px] text-[#9a919f]">
          {badge}
          <span className="truncate">{deadline.kindLabel}</span>
        </p>
        {dateText}
      </div>

      {/* Desktop (≥560px): oryginalny jednowierszowy układ, bez zmian. */}
      <div className="hidden items-center gap-2.5 min-[560px]:flex">
        {dot}
        <div className="min-w-0 flex-1">
          <Link href={deadline.actionHref} className="block truncate text-sm text-[#201a2b] hover:text-[#5b2a86]">
            {deadline.title}
          </Link>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#9a919f]">
            {badge}
            {deadline.kindLabel}
          </p>
        </div>
        {dateText}
      </div>
    </li>
  );
}

export default function DashboardDeadlinesCard({ deadlines, error }: { deadlines: UpcomingDeadline[]; error: string | null }) {
  return (
    <section aria-labelledby="dashboard-deadlines-heading" className="flex h-full flex-col rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <h2 id="dashboard-deadlines-heading" className="text-sm font-semibold text-[#201a2b]">
        Nadchodzące terminy
      </h2>

      {error ? (
        <p className="mt-3 text-xs text-[#9a2f2f]">{error}</p>
      ) : deadlines.length === 0 ? (
        <EmptyState icon={CalendarClock} title="Brak nadchodzących terminów" compact />
      ) : (
        <ul className="mt-3">
          {deadlines.map((deadline) => (
            <DeadlineRow key={deadline.id} deadline={deadline} />
          ))}
        </ul>
      )}
    </section>
  );
}
