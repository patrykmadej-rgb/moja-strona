"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import { CalendarClock } from "lucide-react";
import { formatDateTime } from "@/lib/lab/format";
import {
  applyChange,
  dismissChange,
  markChangeReviewed,
} from "@/app/lab/szkola/kalendarz/actions";
import {
  CALENDAR_CHANGE_FIELD_LABELS,
  CALENDAR_CHANGE_STATUS_LABELS,
  CALENDAR_CHANGE_TYPES,
  CALENDAR_CHANGE_TYPE_LABELS,
  CALENDAR_IMPACT_LEVELS,
  CALENDAR_IMPACT_LEVEL_LABELS,
  CALENDAR_CHANGE_STATUSES,
  type CalendarChangeStatus,
  type CalendarChangeType,
  type CalendarImpactLevel,
  type SchoolSession,
} from "@/lib/szkola/types";

export type CalendarChangeRow = {
  id: string;
  change_type: CalendarChangeType;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  detected_at: string;
  status: CalendarChangeStatus;
  impact_level: CalendarImpactLevel;
  impact_summary: string | null;
  session_id: string | null;
  calendar_event: { google_event_id: string; html_link: string | null; title: string | null } | null;
  session: { id: string; title: string; session_number: number | null } | null;
};

function formatFieldValue(fieldName: string | null, value: string | null): string {
  if (value === null) return "—";
  if (fieldName === "start_at" || fieldName === "end_at") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return formatDateTime(date.toISOString());
  }
  if (value.length > 140) return `${value.slice(0, 140)}…`;
  return value;
}

const IMPACT_BADGE_CLASS: Record<CalendarImpactLevel, string> = {
  none: "bg-[#f1eafd] text-[#5b2a86]",
  information: "bg-[#e6f0fb] text-[#2a5b86]",
  warning: "bg-[#fdf1de] text-[#8a5a12]",
  conflict: "bg-[#fbe9e9] text-[#9a2f2f]",
};

function ChangeCard({ change }: { change: CalendarChangeRow }) {
  const [status, setStatus] = useState(change.status);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: (formData: FormData) => Promise<void>, label: string, nextStatus: CalendarChangeStatus) => {
    setError(null);
    setPending(label);
    const formData = new FormData();
    formData.set("id", change.id);
    try {
      await action(formData);
      setStatus(nextStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się wykonać akcji.");
    } finally {
      setPending(null);
    }
  };

  return (
    <li className="rounded-[14px] border border-[#e8e2ec] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-[#201a2b]">
              {change.session ? change.session.title : change.calendar_event?.title || "Wydarzenie bez tytułu"}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] ${IMPACT_BADGE_CLASS[change.impact_level]}`}>
              {CALENDAR_IMPACT_LEVEL_LABELS[change.impact_level]}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#706878]">
            {CALENDAR_CHANGE_TYPE_LABELS[change.change_type]}
            {change.field_name && ` · ${CALENDAR_CHANGE_FIELD_LABELS[change.field_name] ?? change.field_name}`}
            {" · "}
            {formatDateTime(change.detected_at)}
          </p>
        </div>
        <span className="shrink-0 text-xs text-[#9a919f]">{CALENDAR_CHANGE_STATUS_LABELS[status]}</span>
      </div>

      {(change.old_value !== null || change.new_value !== null) && (
        <div className="mt-3 grid grid-cols-1 gap-2 min-[560px]:grid-cols-2">
          <div className="rounded-[10px] bg-[#f7f4ef] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#9a919f]">Było</p>
            <p className="mt-1 text-sm text-[#201a2b]">{formatFieldValue(change.field_name, change.old_value)}</p>
          </div>
          <div className="rounded-[10px] bg-[#f1eafd] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#5b2a86]">Jest</p>
            <p className="mt-1 text-sm text-[#201a2b]">{formatFieldValue(change.field_name, change.new_value)}</p>
          </div>
        </div>
      )}

      {change.impact_summary && (
        <p className="mt-3 text-xs text-[#706878]">{change.impact_summary}</p>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        {status === "new" && (
          <>
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => run(applyChange, "apply", "accepted")}
              className="font-medium text-[#5b2a86] hover:underline disabled:opacity-50"
            >
              {pending === "apply" ? "Stosowanie…" : "Zastosuj zmianę"}
            </button>
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => run(markChangeReviewed, "review", "reviewed")}
              className="text-[#706878] hover:underline disabled:opacity-50"
            >
              Oznacz jako przejrzaną
            </button>
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => run(dismissChange, "dismiss", "ignored")}
              className="text-red-600 hover:underline disabled:opacity-50"
            >
              Odrzuć
            </button>
          </>
        )}
        {change.session_id && (
          <Link href={`/lab/szkola/zjazdy/${change.session_id}`} className="text-[#5b2a86] hover:underline">
            Otwórz zjazd
          </Link>
        )}
        {change.calendar_event?.html_link && (
          <a
            href={change.calendar_event.html_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#706878] hover:underline"
          >
            <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
            Otwórz w Google Calendar
          </a>
        )}
      </div>
    </li>
  );
}

export default function CalendarChangesExplorer({
  changes,
  sessions,
}: {
  changes: CalendarChangeRow[];
  sessions: SchoolSession[];
}) {
  const [sessionFilter, setSessionFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<CalendarChangeType | "">("");
  const [impactFilter, setImpactFilter] = useState<CalendarImpactLevel | "">("");
  const [statusFilter, setStatusFilter] = useState<CalendarChangeStatus | "">("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return changes.filter((c) => {
      if (sessionFilter && c.session_id !== sessionFilter) return false;
      if (typeFilter && c.change_type !== typeFilter) return false;
      if (impactFilter && c.impact_level !== impactFilter) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (q) {
        const haystack = `${c.session?.title ?? ""} ${c.calendar_event?.title ?? ""} ${c.old_value ?? ""} ${c.new_value ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [changes, sessionFilter, typeFilter, impactFilter, statusFilter, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative w-full sm:max-w-[280px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a79bb0]" strokeWidth={1.75} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj zmiany…"
            className="h-[38px] w-full rounded-[9px] border border-[#e8e2ec] bg-white pl-9 pr-3 text-[13px] text-[#201a2b] outline-none focus:border-[#5b2a86]"
          />
        </div>
        <select
          value={sessionFilter}
          onChange={(e) => setSessionFilter(e.target.value)}
          aria-label="Filtruj po zjeździe"
          className="h-[38px] rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758]"
        >
          <option value="">Wszystkie zjazdy</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as CalendarChangeType | "")}
          aria-label="Filtruj po typie zmiany"
          className="h-[38px] rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758]"
        >
          <option value="">Wszystkie typy</option>
          {CALENDAR_CHANGE_TYPES.map((t) => (
            <option key={t} value={t}>
              {CALENDAR_CHANGE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select
          value={impactFilter}
          onChange={(e) => setImpactFilter(e.target.value as CalendarImpactLevel | "")}
          aria-label="Filtruj po wpływie"
          className="h-[38px] rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758]"
        >
          <option value="">Wszystkie poziomy wpływu</option>
          {CALENDAR_IMPACT_LEVELS.map((level) => (
            <option key={level} value={level}>
              {CALENDAR_IMPACT_LEVEL_LABELS[level]}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CalendarChangeStatus | "")}
          aria-label="Filtruj po statusie"
          className="h-[38px] rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758]"
        >
          <option value="">Wszystkie statusy</option>
          {CALENDAR_CHANGE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CALENDAR_CHANGE_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <EmptyState
            icon={CalendarClock}
            title={changes.length === 0 ? "Brak zmian" : "Nic nie pasuje do filtrów"}
            subtitle={changes.length === 0 ? "Pojawią się tutaj po pierwszej synchronizacji." : "Zmień wyszukiwanie lub filtry."}
          />
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((change) => (
            <ChangeCard key={change.id} change={change} />
          ))}
        </ul>
      )}
    </div>
  );
}
