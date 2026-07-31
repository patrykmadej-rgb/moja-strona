import { CalendarClock, FolderOpen, Files, StickyNote } from "lucide-react";
import PreparationChecklistCard from "@/components/szkola/PreparationChecklistCard";
import SessionPlaceholderCard from "@/components/szkola/SessionPlaceholderCard";
import TravelSummaryCard from "@/components/szkola/TravelSummaryCard";
import AccommodationSummaryCard from "@/components/szkola/AccommodationSummaryCard";
import BudgetCard from "@/components/szkola/BudgetCard";
import UpcomingDeadlinesCard from "@/components/szkola/UpcomingDeadlinesCard";
import SessionWarningsCard from "@/components/szkola/SessionWarningsCard";
import { getSessionWarnings } from "@/lib/szkola/warnings";
import type {
  Accommodation,
  Expense,
  SchoolPayment,
  SchoolSession,
  SessionTask,
  TravelSegment,
} from "@/lib/szkola/types";
import type { SessionTabKey } from "@/components/szkola/SessionTabs";

export default function SessionOverview({
  session,
  tasks,
  segments,
  accommodations,
  payments,
  expenses,
  onNavigateTab,
}: {
  session: SchoolSession;
  tasks: SessionTask[];
  segments: TravelSegment[];
  accommodations: Accommodation[];
  payments: SchoolPayment[];
  expenses: Expense[];
  onNavigateTab: (tab: SessionTabKey) => void;
}) {
  const warnings = getSessionWarnings({
    session,
    segments,
    accommodations,
    payments,
    scheduleItems: [],
  });

  const mainColumn = (
    <>
      <PreparationChecklistCard sessionId={session.id} tasks={tasks} />
      <TravelSummaryCard segments={segments} onNavigateTab={() => onNavigateTab("podroz")} />
      <SessionPlaceholderCard
        icon={CalendarClock}
        title="Plan zajęć"
        description="Harmonogram dni i punktów programu pojawi się tutaj w kolejnym etapie modułu."
      />
      <SessionPlaceholderCard
        icon={FolderOpen}
        title="Materiały ze zjazdu"
        description="Prezentacje, zdjęcia tablicy i literatura — moduł materiałów jest w przygotowaniu."
      />
    </>
  );

  const sidebarColumn = (
    <>
      <UpcomingDeadlinesCard tasks={tasks} payments={payments} accommodations={accommodations} />
      <AccommodationSummaryCard accommodations={accommodations} onNavigateTab={() => onNavigateTab("zakwaterowanie")} />
      <BudgetCard session={session} payments={payments} expenses={expenses} />
      <SessionPlaceholderCard
        icon={Files}
        title="Dokumenty"
        description="Bilety, rezerwacje i faktury przypisane do tego zjazdu — w przygotowaniu."
      />
      <SessionPlaceholderCard
        icon={StickyNote}
        title="Notatki"
        description="Luźne notatki dotyczące zjazdu — w przygotowaniu."
      />
    </>
  );

  return (
    <div className="flex flex-col gap-5">
      <SessionWarningsCard warnings={warnings} />

      <div className="flex flex-col gap-5 min-[1000px]:hidden">
        {mainColumn}
        {sidebarColumn}
      </div>

      <div className="hidden min-[1000px]:grid min-[1000px]:grid-cols-[minmax(0,1fr)_320px] min-[1000px]:items-start min-[1000px]:gap-5">
        <div className="flex min-w-0 flex-col gap-5">{mainColumn}</div>
        <div className="flex min-w-0 flex-col gap-5">{sidebarColumn}</div>
      </div>
    </div>
  );
}
