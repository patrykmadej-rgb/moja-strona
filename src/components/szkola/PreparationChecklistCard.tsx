"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, MinusCircle, CircleHelp, Plus, Trash2 } from "lucide-react";
import { addTask, deleteTask, toggleTask, toggleLodgingNotNeeded } from "@/app/lab/szkola/zjazdy/[id]/actions";
import { getAutomaticPreparationItems, type PrepItem, type PrepStatusKind } from "@/lib/szkola/preparation";
import { formatDateOnly } from "@/lib/lab/format";
import { LEGACY_CHECKLIST_TITLES, type Accommodation, type SchoolSemester, type SessionTask, type TravelSegment } from "@/lib/szkola/types";
import type { SessionTabKey } from "@/components/szkola/SessionTabs";

const STATUS_STYLES: Record<PrepStatusKind, { icon: typeof CheckCircle2; iconClass: string }> = {
  done: { icon: CheckCircle2, iconClass: "text-[#2f7a4c]" },
  attention: { icon: AlertTriangle, iconClass: "text-[#a76616]" },
  not_needed: { icon: MinusCircle, iconClass: "text-[#9a919f]" },
  no_data: { icon: CircleHelp, iconClass: "text-[#9a919f]" },
};

function StatusRow({ item, cta }: { item: PrepItem; cta?: ReactNode }) {
  const { icon: Icon, iconClass } = STATUS_STYLES[item.kind];
  return (
    <li className="flex items-start justify-between gap-3 border-b border-[#eee9f2] py-3 last:border-b-0">
      <div className="flex min-w-0 items-start gap-2.5">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} strokeWidth={1.75} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#201a2b]">{item.title}</p>
          <p className="mt-0.5 text-xs text-[#706878]">{item.detail}</p>
        </div>
      </div>
      {cta && <div className="flex shrink-0 flex-col items-end gap-1">{cta}</div>}
    </li>
  );
}

function CtaLink({ children, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <Link {...props} className="text-xs font-medium text-[#5b2a86] hover:underline">
      {children}
    </Link>
  );
}

function CtaButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props} className="text-xs font-medium text-[#5b2a86] hover:underline disabled:opacity-50">
      {children}
    </button>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Dodaj zadanie"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#5b2a86] text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
    >
      <Plus className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}

function TaskRow({ sessionId, task }: { sessionId: string; task: SessionTask }) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center gap-3 border-b border-[#eee9f2] py-2.5 last:border-b-0">
      <input
        type="checkbox"
        id={`task-${task.id}`}
        defaultChecked={task.is_done}
        disabled={isPending}
        onChange={(e) => {
          const checked = e.target.checked;
          startTransition(() => {
            toggleTask(sessionId, task.id, checked);
          });
        }}
        className="h-4 w-4 shrink-0 accent-[#5b2a86]"
      />
      <label
        htmlFor={`task-${task.id}`}
        className={
          task.is_done
            ? "min-w-0 flex-1 truncate text-sm text-[#9a919f] line-through"
            : "min-w-0 flex-1 truncate text-sm text-[#201a2b]"
        }
      >
        {task.title}
      </label>
      {task.due_date && (
        <span className="shrink-0 text-[11px] text-[#706878]">{formatDateOnly(task.due_date)}</span>
      )}
      <form action={deleteTask}>
        <input type="hidden" name="session_id" value={sessionId} />
        <input type="hidden" name="id" value={task.id} />
        <button
          type="submit"
          aria-label={`Usuń zadanie: ${task.title}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center text-[#9a919f] transition-colors hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </form>
    </li>
  );
}

export default function PreparationChecklistCard({
  sessionId,
  lodgingNotNeeded,
  segments,
  accommodations,
  semester,
  tasks,
  onNavigateTab,
}: {
  sessionId: string;
  lodgingNotNeeded: boolean;
  segments: TravelSegment[];
  accommodations: Accommodation[];
  semester: SchoolSemester | null;
  tasks: SessionTask[];
  onNavigateTab: (tab: SessionTabKey) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isTogglingLodging, startLodgingTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const [transport, nocleg, platnosc] = getAutomaticPreparationItems({
    segments,
    accommodations,
    lodgingNotNeeded,
    semester,
  });

  // Sekcja 8 briefu: stare rekordy (Rejestracja/Ubezpieczenie/Materiały/bilety/
  // itd. z poprzedniej wersji domyślnej checklisty) zostają w bazie, ale
  // przestają się pokazywać w "Moje zadania" — te obszary są teraz pokryte
  // przez automatyczne statusy powyżej albo w ogóle przestały być elementem
  // przygotowań (patrz LEGACY_CHECKLIST_TITLES).
  const visibleTasks = tasks.filter((t) => !LEGACY_CHECKLIST_TITLES.has(t.title));
  const taskDoneCount = visibleTasks.filter((t) => t.is_done).length;
  const sortedTasks = [...visibleTasks].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <h2 className="text-sm font-semibold text-[#201a2b]">Status przygotowań</h2>

      {/* Sekcja A: automatyczne podsumowanie danych już zapisanych w systemie —
          bez checkboxów, bez ręcznego odhaczania (sekcja 5/9 briefu). */}
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-[#9a919f]">
        Przygotowania automatyczne
      </p>
      <ul className="mt-1">
        <StatusRow
          item={transport}
          cta={
            transport.kind === "attention" ? (
              <CtaButton onClick={() => onNavigateTab("podroz")}>Dodaj podróż</CtaButton>
            ) : undefined
          }
        />
        <StatusRow
          item={nocleg}
          cta={
            nocleg.kind === "attention" ? (
              <>
                <CtaButton onClick={() => onNavigateTab("zakwaterowanie")}>Dodaj nocleg</CtaButton>
                <button
                  type="button"
                  disabled={isTogglingLodging}
                  onClick={() => startLodgingTransition(() => toggleLodgingNotNeeded(sessionId, true))}
                  className="text-[11px] text-[#9a919f] hover:text-[#5b2a86] hover:underline disabled:opacity-50"
                >
                  Nocleg nie jest potrzebny
                </button>
              </>
            ) : nocleg.kind === "not_needed" ? (
              <button
                type="button"
                disabled={isTogglingLodging}
                onClick={() => startLodgingTransition(() => toggleLodgingNotNeeded(sessionId, false))}
                className="text-[11px] text-[#9a919f] hover:text-[#5b2a86] hover:underline disabled:opacity-50"
              >
                Cofnij
              </button>
            ) : undefined
          }
        />
        <StatusRow
          item={platnosc}
          cta={
            platnosc.kind !== "done" ? (
              <CtaLink href="/lab/szkola/semestry">
                {platnosc.kind === "no_data" ? "Przypisz semestr" : "Zarządzaj semestrem"}
              </CtaLink>
            ) : undefined
          }
        />
      </ul>

      {/* Sekcja B: wyłącznie ręczne, niestandardowe zadania — rozdzielone od
          danych systemowych (sekcja 6 briefu), jedyne miejsce z checkboxami. */}
      <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#eee9f2] pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a919f]">
          Moje zadania {visibleTasks.length > 0 && `(${taskDoneCount}/${visibleTasks.length})`}
        </p>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="text-sm font-medium text-[#5b2a86] hover:underline"
        >
          {showAddForm ? "Anuluj" : "+ Dodaj zadanie"}
        </button>
      </div>

      {showAddForm && (
        <form
          ref={formRef}
          action={async (formData) => {
            await addTask(formData);
            formRef.current?.reset();
            setShowAddForm(false);
          }}
          className="mt-3 flex items-end gap-2 rounded-[10px] border border-[#e8e2ec] bg-[#f7f4ef] p-3"
        >
          <input type="hidden" name="session_id" value={sessionId} />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <label htmlFor="new-task-title" className="text-xs font-medium text-[#201a2b]">
              Nowe zadanie
            </label>
            <input
              id="new-task-title"
              name="title"
              required
              placeholder="np. Wypełnić formularz przed zjazdem"
              className="rounded-[10px] border border-[#e8e2ec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-task-due" className="text-xs font-medium text-[#201a2b]">
              Termin
            </label>
            <input
              id="new-task-due"
              name="due_date"
              type="date"
              className="rounded-[10px] border border-[#e8e2ec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86]"
            />
          </div>
          <SubmitButton />
        </form>
      )}

      {sortedTasks.length === 0 ? (
        <p className="mt-3 text-sm italic text-[#9a919f]">Brak własnych zadań.</p>
      ) : (
        <ul className="mt-2">
          {sortedTasks.map((task) => (
            <TaskRow key={task.id} sessionId={sessionId} task={task} />
          ))}
        </ul>
      )}
    </section>
  );
}
