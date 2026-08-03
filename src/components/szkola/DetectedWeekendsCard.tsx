"use client";

import { useState, useTransition } from "react";
import { formatDateTime } from "@/lib/lab/format";
import { formatSessionDateRange } from "@/lib/szkola/format";
import {
  createSessionFromWeekendGroupAction,
  assignWeekendGroupToSessionAction,
  skipWeekendGroupAction,
  createAllConfidentWeekendSessionsAction,
} from "@/app/lab/szkola/kalendarz/actions";
import type { DetectedWeekendGroup, WeekendDetectionSummary } from "@/lib/szkola/calendarWeekendAutomation";
import type { SchoolSession } from "@/lib/szkola/types";

const STATUS_LABELS: Record<DetectedWeekendGroup["status"], string> = {
  new_session: "Nowy zjazd",
  matched_existing: "Dopasowany do istniejącego",
  needs_decision: "Wymaga decyzji",
};

const STATUS_BADGE_CLASS: Record<DetectedWeekendGroup["status"], string> = {
  new_session: "bg-emerald-50 text-emerald-700",
  matched_existing: "bg-sky-50 text-sky-700",
  needs_decision: "bg-amber-50 text-amber-700",
};

function GroupCard({
  group,
  previewSessionNumber,
  sessions,
}: {
  group: DetectedWeekendGroup;
  previewSessionNumber: number | null;
  sessions: SchoolSession[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [pending, startTransition] = useTransition();

  if (dismissed) return null;

  const topic = group.events.find((e) => e.title)?.title ?? null;
  const heading = group.status === "matched_existing" ? group.suggestedSession?.title ?? "Zjazd" : `Zjazd ${previewSessionNumber}`;

  return (
    <li className="rounded-[12px] border border-[#e8e2ec] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#201a2b]">{heading}</p>
          <p className="text-xs text-[#706878]">
            {formatSessionDateRange(group.weekendStart, group.weekendEnd)} · {group.events.length}{" "}
            {group.events.length === 1 ? "wydarzenie" : "wydarzeń"}
            {topic ? ` · ${topic}` : ""}
          </p>
          {group.status === "matched_existing" && group.suggestedSession && (
            <p className="mt-1 text-xs text-[#5b2a86]">Zostanie dopasowany do: {group.suggestedSession.title}</p>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_BADGE_CLASS[group.status]}`}>
          {STATUS_LABELS[group.status]}
        </span>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {expanded && (
        <ul className="mt-3 flex flex-col gap-1.5 border-t border-[#f0ecf5] pt-3">
          {group.events.map((event) => (
            <li key={event.id} className="text-xs text-[#706878]">
              {event.start_at ? formatDateTime(event.start_at) : "—"} — {event.title || "Wydarzenie bez tytułu"}
              {event.location ? ` · ${event.location}` : ""}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {group.status !== "matched_existing" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              const formData = new FormData();
              formData.set("weekend_start", group.weekendStart);
              startTransition(async () => {
                try {
                  await createSessionFromWeekendGroupAction(formData);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Nie udało się utworzyć zjazdu.");
                }
              });
            }}
            className="rounded-[8px] bg-[#5b2a86] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#32134f] disabled:opacity-50"
          >
            Utwórz zjazd
          </button>
        )}

        <form
          action={async (formData) => {
            setError(null);
            try {
              await assignWeekendGroupToSessionAction(formData);
              setDismissed(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Nie udało się przypisać.");
            }
          }}
          className="flex items-center gap-2"
        >
          <input type="hidden" name="weekend_start" value={group.weekendStart} />
          <select
            name="session_id"
            defaultValue={group.suggestedSession?.id ?? ""}
            className="h-8 rounded-[8px] border border-[#e8e2ec] bg-white px-2 text-xs text-[#4f4758]"
          >
            <option value="">Przypisz do istniejącego zjazdu…</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-[8px] border border-[#5b2a86] px-3 py-1.5 text-xs font-medium text-[#5b2a86] hover:bg-[#f3edf9]"
          >
            Przypisz
          </button>
        </form>

        <button type="button" onClick={() => setExpanded((v) => !v)} className="text-xs text-[#5b2a86] hover:underline">
          {expanded ? "Zwiń wydarzenia" : "Rozwiń wydarzenia"}
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            const formData = new FormData();
            formData.set("weekend_start", group.weekendStart);
            startTransition(async () => {
              try {
                await skipWeekendGroupAction(formData);
                setDismissed(true);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Nie udało się pominąć.");
              }
            });
          }}
          className="text-xs text-[#706878] hover:underline disabled:opacity-50"
        >
          Pomiń
        </button>
      </div>
    </li>
  );
}

export default function DetectedWeekendsCard({
  detection,
  sessions,
}: {
  detection: WeekendDetectionSummary;
  sessions: SchoolSession[];
}) {
  const [bulkPending, setBulkPending] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  if (detection.groups.length === 0) return null;

  const confidentCount = detection.newSessionsCount + detection.matchedExistingCount;
  const startingSessionNumber = Math.max(0, ...sessions.map((s) => s.session_number ?? 0)) + 1;
  const previewNumbers = detection.groups.reduce<(number | null)[]>((acc, group) => {
    if (group.status === "matched_existing") return [...acc, null];
    const assignedSoFar = acc.filter((n) => n !== null).length;
    return [...acc, startingSessionNumber + assignedSoFar];
  }, []);

  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <h2 className="text-sm font-semibold text-[#201a2b]">Wykryte weekendy szkoleniowe</h2>
      <p className="mt-1 text-xs text-[#706878]">
        Wykryto {detection.totalWeekends} {detection.totalWeekends === 1 ? "weekend szkoleniowy" : "weekendów szkoleniowych"} —{" "}
        {detection.newSessionsCount} {detection.newSessionsCount === 1 ? "nowy zjazd" : "nowych zjazdów"} do utworzenia,{" "}
        {detection.matchedExistingCount} dopasowanych do istniejących zjazdów, {detection.scheduleItemsToAddCount} wydarzeń zostanie
        dodanych do planów zajęć, {detection.needsDecisionEventsCount} wymaga ręcznej decyzji.
      </p>

      {confidentCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={bulkPending}
            onClick={async () => {
              setBulkError(null);
              setBulkResult(null);
              setBulkPending(true);
              try {
                const result = await createAllConfidentWeekendSessionsAction();
                setBulkResult(
                  `Utworzono ${result.sessionsCreated}, dopasowano ${result.sessionsMatched} zjazdów, dodano ${result.scheduleItemsCreated} punktów planu.`,
                );
              } catch (err) {
                setBulkError(err instanceof Error ? err.message : "Nie udało się utworzyć zjazdów.");
              } finally {
                setBulkPending(false);
              }
            }}
            className="rounded-[10px] bg-[#5b2a86] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
          >
            {bulkPending ? "Przetwarzanie…" : "Utwórz wszystkie pewne zjazdy"}
          </button>
          {bulkResult && <span className="text-xs text-emerald-700">{bulkResult}</span>}
          {bulkError && <span className="text-xs text-red-600">{bulkError}</span>}
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-3">
        {detection.groups.map((group, index) => (
          <GroupCard key={group.weekendStart} group={group} previewSessionNumber={previewNumbers[index]} sessions={sessions} />
        ))}
      </ul>
    </section>
  );
}
