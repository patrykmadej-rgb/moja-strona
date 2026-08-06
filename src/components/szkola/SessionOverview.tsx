import { StickyNote } from "lucide-react";
import PreparationChecklistCard from "@/components/szkola/PreparationChecklistCard";
import SessionPlaceholderCard from "@/components/szkola/SessionPlaceholderCard";
import TravelSummaryCard from "@/components/szkola/TravelSummaryCard";
import AccommodationSummaryCard from "@/components/szkola/AccommodationSummaryCard";
import BudgetCard from "@/components/szkola/BudgetCard";
import UpcomingDeadlinesCard from "@/components/szkola/UpcomingDeadlinesCard";
import SessionWarningsCard from "@/components/szkola/SessionWarningsCard";
import ScheduleSummaryCard from "@/components/szkola/ScheduleSummaryCard";
import MaterialsSummaryCard from "@/components/szkola/MaterialsSummaryCard";
import DocumentsSummaryCard from "@/components/szkola/DocumentsSummaryCard";
import HoursSummaryCard from "@/components/szkola/HoursSummaryCard";
import { getSessionWarnings } from "@/lib/szkola/warnings";
import type {
  Accommodation,
  Expense,
  SchoolPayment,
  SchoolSemester,
  SchoolSession,
  SessionDocument,
  SessionMaterial,
  SessionScheduleItem,
  SessionTask,
  TrainingHoursEntry,
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
  scheduleItems,
  materials,
  documents,
  hoursEntries,
  semesters,
  onNavigateTab,
}: {
  session: SchoolSession;
  tasks: SessionTask[];
  segments: TravelSegment[];
  accommodations: Accommodation[];
  payments: SchoolPayment[];
  expenses: Expense[];
  scheduleItems: SessionScheduleItem[];
  materials: SessionMaterial[];
  documents: SessionDocument[];
  hoursEntries: TrainingHoursEntry[];
  semesters: SchoolSemester[];
  onNavigateTab: (tab: SessionTabKey) => void;
}) {
  const semester = semesters.find((s) => s.id === session.semester_id) ?? null;

  const warnings = getSessionWarnings({
    session,
    segments,
    accommodations,
    semester,
    scheduleItems,
  });

  const mainColumn = (
    <>
      <PreparationChecklistCard
        sessionId={session.id}
        lodgingNotNeeded={session.lodging_not_needed}
        segments={segments}
        accommodations={accommodations}
        semester={semester}
        tasks={tasks}
        onNavigateTab={onNavigateTab}
      />
      <TravelSummaryCard segments={segments} onNavigateTab={() => onNavigateTab("podroz")} />
      <ScheduleSummaryCard items={scheduleItems} onNavigateTab={() => onNavigateTab("plan")} />
      <MaterialsSummaryCard materials={materials} onNavigateTab={() => onNavigateTab("materialy")} />
    </>
  );

  const sidebarColumn = (
    <>
      <UpcomingDeadlinesCard tasks={tasks} payments={payments} accommodations={accommodations} />
      <AccommodationSummaryCard accommodations={accommodations} onNavigateTab={() => onNavigateTab("zakwaterowanie")} />
      <BudgetCard session={session} payments={payments} expenses={expenses} />
      <DocumentsSummaryCard documents={documents} onNavigateTab={() => onNavigateTab("dokumenty")} />
      <HoursSummaryCard entries={hoursEntries} onNavigateTab={() => onNavigateTab("godziny")} />
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
