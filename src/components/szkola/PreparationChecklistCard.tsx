"use client";

import { useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Trash2 } from "lucide-react";
import { addTask, deleteTask, toggleTask } from "@/app/lab/szkola/zjazdy/[id]/actions";
import { getPreparationPercent } from "@/lib/szkola/preparation";
import { formatDateOnly } from "@/lib/lab/format";
import type { SessionTask } from "@/lib/szkola/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Dodaj pozycję checklisty"
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
          aria-label={`Usuń pozycję: ${task.title}`}
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
  tasks,
}: {
  sessionId: string;
  tasks: SessionTask[];
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const percent = getPreparationPercent(tasks);
  const doneCount = tasks.filter((t) => t.is_done).length;
  const sorted = [...tasks].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-[#201a2b]">Status przygotowań</h2>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="text-sm font-medium text-[#5b2a86] hover:underline"
        >
          {showAddForm ? "Anuluj" : "+ Dodaj pozycję"}
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[#201a2b]">
          {doneCount} / {tasks.length} wykonanych
        </span>
        <span className="text-sm font-medium text-[#5b2a86]">{percent}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-[#eee9f2]">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-[#6c35a1] to-[#8b5bb7]"
          style={{ width: `${percent}%` }}
        />
      </div>

      {showAddForm && (
        <form
          ref={formRef}
          action={async (formData) => {
            await addTask(formData);
            formRef.current?.reset();
            setShowAddForm(false);
          }}
          className="mt-4 flex items-end gap-2 rounded-[10px] border border-[#e8e2ec] bg-[#f7f4ef] p-3"
        >
          <input type="hidden" name="session_id" value={sessionId} />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <label htmlFor="new-task-title" className="text-xs font-medium text-[#201a2b]">
              Nowa pozycja
            </label>
            <input
              id="new-task-title"
              name="title"
              required
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

      {sorted.length === 0 ? (
        <p className="mt-4 text-sm italic text-[#9a919f]">Brak pozycji checklisty.</p>
      ) : (
        <ul className="mt-3">
          {sorted.map((task) => (
            <TaskRow key={task.id} sessionId={sessionId} task={task} />
          ))}
        </ul>
      )}
    </section>
  );
}
