"use client";

import { useState } from "react";
import { formatDateTime } from "@/lib/lab/format";
import { assignEventToSession, createSessionFromCalendarEvent, ignoreCalendarEvent } from "@/app/lab/szkola/kalendarz/actions";
import type { SchoolSession } from "@/lib/szkola/types";

export type UnassignedEventRow = {
  id: string;
  title: string | null;
  location: string | null;
  start_at: string | null;
  suggestedSession: SchoolSession | null;
};

function UnassignedEventRowItem({ event, sessions }: { event: UnassignedEventRow; sessions: SchoolSession[] }) {
  const [creatingNew, setCreatingNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <li className="rounded-[12px] border border-[#e8e2ec] p-3">
      <p className="text-sm font-medium text-[#201a2b]">{event.title || "Wydarzenie bez tytułu"}</p>
      <p className="mt-0.5 text-xs text-[#706878]">
        {[event.start_at ? formatDateTime(event.start_at) : null, event.location].filter(Boolean).join(" · ")}
      </p>
      {event.suggestedSession && (
        <p className="mt-1 text-xs text-[#5b2a86]">
          To wydarzenie prawdopodobnie dotyczy: <span className="font-medium">{event.suggestedSession.title}</span>
        </p>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {creatingNew ? (
        <form
          action={async (formData) => {
            setError(null);
            try {
              await createSessionFromCalendarEvent(formData);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Nie udało się utworzyć zjazdu.");
            }
          }}
          className="mt-2 flex flex-wrap items-center gap-2"
        >
          <input type="hidden" name="event_id" value={event.id} />
          <input
            name="title"
            required
            defaultValue={event.title ?? ""}
            placeholder="Tytuł nowego zjazdu"
            className="h-8 rounded-[8px] border border-[#e8e2ec] bg-white px-2 text-xs text-[#201a2b] outline-none focus:border-[#5b2a86]"
          />
          <button type="submit" className="rounded-[8px] bg-[#5b2a86] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#32134f]">
            Utwórz zjazd
          </button>
          <button type="button" onClick={() => setCreatingNew(false)} className="text-xs text-[#706878] hover:underline">
            Anuluj
          </button>
        </form>
      ) : (
        <form
          action={async (formData) => {
            setError(null);
            try {
              await assignEventToSession(formData);
              setDismissed(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Nie udało się przypisać.");
            }
          }}
          className="mt-2 flex flex-wrap items-center gap-2"
        >
          <input type="hidden" name="event_id" value={event.id} />
          <select
            name="session_id"
            defaultValue={event.suggestedSession?.id ?? ""}
            className="h-8 rounded-[8px] border border-[#e8e2ec] bg-white px-2 text-xs text-[#4f4758]"
          >
            <option value="">Wybierz zjazd…</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-[8px] bg-[#5b2a86] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#32134f]">
            Przypisz
          </button>
          <button type="button" onClick={() => setCreatingNew(true)} className="text-xs text-[#5b2a86] hover:underline">
            Utwórz nowy zjazd
          </button>
          <button
            type="button"
            onClick={async () => {
              setError(null);
              const formData = new FormData();
              formData.set("event_id", event.id);
              try {
                await ignoreCalendarEvent(formData);
                setDismissed(true);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Nie udało się zignorować.");
              }
            }}
            className="text-xs text-[#706878] hover:underline"
          >
            Ignoruj
          </button>
        </form>
      )}
    </li>
  );
}

export default function UnassignedCalendarEventsCard({
  events,
  sessions,
}: {
  events: UnassignedEventRow[];
  sessions: SchoolSession[];
}) {
  if (events.length === 0) return null;

  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <h2 className="text-sm font-semibold text-[#201a2b]">Wydarzenia do przypisania</h2>
      <p className="mt-1 text-xs text-[#706878]">
        Te wydarzenia z Google Calendar nie zostały automatycznie dopasowane do żadnego zjazdu.
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {events.map((event) => (
          <UnassignedEventRowItem key={event.id} event={event} sessions={sessions} />
        ))}
      </ul>
    </section>
  );
}
