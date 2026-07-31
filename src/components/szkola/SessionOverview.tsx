import { CalendarClock, Plane, FolderOpen, Bed, Receipt, Files, StickyNote } from "lucide-react";
import PreparationChecklistCard from "@/components/szkola/PreparationChecklistCard";
import SessionPlaceholderCard from "@/components/szkola/SessionPlaceholderCard";
import type { SchoolSession, SessionTask } from "@/lib/szkola/types";

export default function SessionOverview({
  session,
  tasks,
}: {
  session: SchoolSession;
  tasks: SessionTask[];
}) {
  const mainColumn = (
    <>
      <PreparationChecklistCard sessionId={session.id} tasks={tasks} />
      <SessionPlaceholderCard
        icon={CalendarClock}
        title="Plan zajęć"
        description="Harmonogram dni i punktów programu pojawi się tutaj w kolejnym etapie modułu."
      />
      <SessionPlaceholderCard
        icon={Plane}
        title="Podróż"
        description="Odcinki podróży (loty, pociągi, transfery) będzie można dodawać w kolejnym etapie."
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
      <SessionPlaceholderCard
        icon={CalendarClock}
        title="Najbliższe terminy"
        description="Terminy z checklisty i planu zajęć pojawią się tutaj automatycznie."
      />
      <SessionPlaceholderCard
        icon={Bed}
        title="Zakwaterowanie"
        description="Rezerwacja noclegu, ceny i warunki anulowania — w przygotowaniu."
      />
      <SessionPlaceholderCard
        icon={Receipt}
        title="Budżet i wydatki"
        description="Zestawienie płatności za szkołę i wydatków podróżnych — w przygotowaniu."
      />
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
    <div>
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
