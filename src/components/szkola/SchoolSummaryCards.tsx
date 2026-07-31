import { CalendarRange, Plane, WalletCards, CalendarClock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SummaryCard = {
  key: string;
  label: string;
  value: string;
  description?: string;
  icon: LucideIcon;
};

export default function SchoolSummaryCards({
  nextSessionLabel,
  preparedTripsCount,
  totalSessionsForTravel,
  expensesThisYear,
  calendarChangesCount,
  calendarConnected,
}: {
  nextSessionLabel: string;
  preparedTripsCount: number;
  totalSessionsForTravel: number;
  expensesThisYear: number;
  calendarChangesCount: number;
  calendarConnected: boolean;
}) {
  const cards: SummaryCard[] = [
    {
      key: "next",
      label: "Najbliższy zjazd",
      value: nextSessionLabel,
      icon: CalendarRange,
    },
    {
      key: "trips",
      label: "Przygotowane podróże",
      value: `${preparedTripsCount} / ${totalSessionsForTravel}`,
      description: "nadchodzących zjazdów",
      icon: Plane,
    },
    {
      key: "expenses",
      label: "Wydatki w tym roku",
      value: `${expensesThisYear.toFixed(0)} zł`,
      icon: WalletCards,
    },
    {
      key: "calendar",
      label: "Zmiany w kalendarzu",
      value: calendarConnected ? String(calendarChangesCount) : "—",
      description: calendarConnected ? "niepotwierdzonych" : "Kalendarz niepołączony",
      icon: CalendarClock,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 min-[700px]:grid-cols-4">
      {cards.map(({ key, label, value, description, icon: Icon }) => (
        <div
          key={key}
          className="min-h-[84px] rounded-[12px] border border-[#e8e2ec] bg-white/95 px-4 py-3.5"
        >
          <div className="flex items-center gap-1.5 text-[#706878]">
            <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            <span className="truncate text-[11px] font-medium">{label}</span>
          </div>
          <p className="mt-1.5 truncate text-2xl font-semibold leading-none text-[#201a2b]">{value}</p>
          {description && <p className="mt-1 truncate text-[10px] text-[#9a919f]">{description}</p>}
        </div>
      ))}
    </div>
  );
}
