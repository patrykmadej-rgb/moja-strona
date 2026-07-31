"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { addEvent, updateEvent, deleteEvent } from "@/app/lab/artykuly/[id]/actions";
import EventTimeline from "@/components/lab/EventTimeline";
import EventCompletedToggle from "@/components/lab/EventCompletedToggle";
import { formatDateOnly, todayDateString } from "@/lib/lab/format";
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  EVENT_TITLE_SUGGESTIONS,
  type ArticleEvent,
  type EventType,
} from "@/lib/lab/types";

const inputClass =
  "border border-[#4A1D6E]/25 bg-white px-3 py-2 text-sm text-[#1C1028] outline-none focus:border-[#4A1D6E]";

function EventTypeTag({ type }: { type: EventType }) {
  return (
    <span className="inline-flex items-center bg-[#EDE6F8] px-2 py-0.5 text-xs text-[#4A1D6E]">
      {EVENT_TYPE_LABELS[type]}
    </span>
  );
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start bg-[#4A1D6E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4A2073] disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function EventFields({ event }: { event?: ArticleEvent }) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1C1028]">Tytuł</label>
        <input
          name="title"
          list="event-title-suggestions"
          required
          defaultValue={event?.title ?? ""}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1C1028]">Typ</label>
          <select name="event_type" defaultValue={event?.event_type ?? "milestone"} className={inputClass}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1C1028]">Data</label>
          <input
            name="event_date"
            type="date"
            required
            defaultValue={event?.event_date ?? ""}
            className={inputClass}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-[#1C1028]">
        <input type="checkbox" name="is_completed" defaultChecked={event?.is_completed ?? false} className="h-4 w-4" />
        Już zrealizowane
      </label>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1C1028]">Notatka</label>
        <textarea name="notes" rows={2} defaultValue={event?.notes ?? ""} className={inputClass} />
      </div>
    </>
  );
}

export default function ScheduleTab({
  articleId,
  events,
}: {
  articleId: string;
  events: ArticleEvent[];
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const today = todayDateString();
  const upcoming = events
    .filter((e) => e.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const past = events
    .filter((e) => e.event_date < today)
    .sort((a, b) => b.event_date.localeCompare(a.event_date));
  const orderedForList = [...upcoming, ...past];

  return (
    <div className="flex flex-col gap-6">
      <datalist id="event-title-suggestions">
        {EVENT_TITLE_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <section className="border border-[#4A1D6E]/15 bg-white p-6">
        <h2 className="text-sm font-semibold text-[#1C1028]">Oś czasu</h2>
        {events.length === 0 ? (
          <p className="mt-4 text-sm text-[#4A3360]">Brak zaplanowanych wydarzeń.</p>
        ) : (
          <div className="mt-4">
            <EventTimeline events={events} />
          </div>
        )}
      </section>

      <section className="border border-[#4A1D6E]/15 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1C1028]">Wydarzenia</h2>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="border border-[#4A1D6E]/25 px-3 py-1.5 text-sm text-[#4A1D6E] hover:border-[#4A1D6E]/50"
          >
            {showAddForm ? "Anuluj" : "+ Dodaj wydarzenie"}
          </button>
        </div>

        {showAddForm && (
          <form
            ref={formRef}
            action={async (formData) => {
              await addEvent(formData);
              formRef.current?.reset();
              setShowAddForm(false);
            }}
            className="mt-4 flex flex-col gap-3 border border-[#4A1D6E]/15 bg-[#F5F1EC] p-4"
          >
            <input type="hidden" name="article_id" value={articleId} />
            <EventFields />
            <SubmitButton label="Dodaj wydarzenie" pendingLabel="Dodawanie…" />
          </form>
        )}

        <div className="mt-4">
          {orderedForList.length === 0 ? (
            <p className="text-sm text-[#4A3360]">Brak dodanych wydarzeń — dodaj pierwsze powyżej.</p>
          ) : (
            <ul>
              {orderedForList.map((event) =>
                editingId === event.id ? (
                  <li key={event.id} className="border-b-[0.5px] border-[#4A1D6E]/20 py-4">
                    <form
                      action={async (formData) => {
                        await updateEvent(formData);
                        setEditingId(null);
                      }}
                      className="flex flex-col gap-3"
                    >
                      <input type="hidden" name="article_id" value={articleId} />
                      <input type="hidden" name="id" value={event.id} />
                      <EventFields event={event} />
                      <div className="flex gap-3">
                        <SubmitButton label="Zapisz" pendingLabel="Zapisywanie…" />
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="border border-[#4A1D6E]/25 px-4 py-2 text-sm text-[#4A3360] hover:border-[#4A1D6E]/50"
                        >
                          Anuluj
                        </button>
                      </div>
                    </form>
                  </li>
                ) : (
                  <li
                    key={event.id}
                    className="flex items-center justify-between gap-4 border-b-[0.5px] border-[#4A1D6E]/20 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#1C1028]">{event.title}</p>
                      <p className="mt-0.5 text-xs text-[#4A3360]">
                        {formatDateOnly(event.event_date)}
                        {event.notes ? ` · ${event.notes}` : ""}
                      </p>
                    </div>
                    <EventTypeTag type={event.event_type} />
                    <EventCompletedToggle
                      articleId={articleId}
                      eventId={event.id}
                      isCompleted={event.is_completed}
                    />
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingId(event.id)}
                        className="text-sm text-[#4A1D6E] hover:underline"
                      >
                        Edytuj
                      </button>
                      <form
                        action={deleteEvent}
                        onSubmit={(e) => {
                          if (!confirm(`Usunąć wydarzenie „${event.title}”?`)) e.preventDefault();
                        }}
                      >
                        <input type="hidden" name="article_id" value={articleId} />
                        <input type="hidden" name="id" value={event.id} />
                        <button type="submit" className="text-sm text-red-600 hover:underline">
                          Usuń
                        </button>
                      </form>
                    </div>
                  </li>
                ),
              )}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
