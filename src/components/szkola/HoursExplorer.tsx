"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock, Search } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import { formatHours } from "@/lib/szkola/format";
import {
  TRAINING_HOUR_CATEGORIES,
  TRAINING_HOUR_CATEGORY_LABELS,
  type SchoolSession,
  type TrainingHoursEntry,
  type TrainingHourCategory,
} from "@/lib/szkola/types";

export default function HoursExplorer({
  sessions,
  entries,
}: {
  sessions: SchoolSession[];
  entries: TrainingHoursEntry[];
}) {
  const [sessionFilter, setSessionFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TrainingHourCategory | "">("");
  const [yearFilter, setYearFilter] = useState("");
  const [query, setQuery] = useState("");

  const sessionsById = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);
  const trainingYears = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.training_year).filter(Boolean))).sort(),
    [sessions],
  ) as string[];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (sessionFilter && entry.session_id !== sessionFilter) return false;
      if (categoryFilter && entry.category !== categoryFilter) return false;
      if (yearFilter && (entry.session_id ? sessionsById.get(entry.session_id)?.training_year : null) !== yearFilter)
        return false;
      if (q) {
        const matchesQuery =
          (entry.trainer ?? "").toLowerCase().includes(q) || (entry.notes ?? "").toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      return true;
    });
  }, [entries, sessionFilter, categoryFilter, yearFilter, query, sessionsById]);

  const totalHours = filtered.reduce((sum, e) => sum + e.hours, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative w-full sm:max-w-[280px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a79bb0]" strokeWidth={1.75} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj po prowadzącym lub notatce…"
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
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as TrainingHourCategory | "")}
          aria-label="Filtruj po kategorii"
          className="h-[38px] rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758]"
        >
          <option value="">Wszystkie kategorie</option>
          {TRAINING_HOUR_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {TRAINING_HOUR_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        {trainingYears.length > 0 && (
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            aria-label="Filtruj po roku szkoleniowym"
            className="h-[38px] rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758]"
          >
            <option value="">Wszystkie lata</option>
            {trainingYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <EmptyState
            icon={Clock}
            title={entries.length === 0 ? "Brak wpisów godzinowych" : "Nic nie pasuje do filtrów"}
            subtitle={entries.length === 0 ? "Dodaj wpisy w widoku danego zjazdu." : "Zmień wyszukiwanie lub filtry."}
          />
        </section>
      ) : (
        <section className="rounded-[16px] border border-[#e8e2ec] bg-white px-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <div className="flex items-center justify-between border-b border-[#eee9f2] py-3 text-xs text-[#706878]">
            <span>{filtered.length} wpisów</span>
            <span className="font-medium text-[#201a2b]">{formatHours(totalHours)} łącznie</span>
          </div>
          <ul>
            {filtered.map((entry) => {
              const session = entry.session_id ? sessionsById.get(entry.session_id) : null;
              return (
                <li key={entry.id} className="flex items-center justify-between gap-4 border-b border-[#eee9f2] py-4 last:border-b-0">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#f1eafd]">
                      <Clock className="h-4 w-4 text-[#5b2a86]" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#201a2b]">
                        {TRAINING_HOUR_CATEGORY_LABELS[entry.category]} · {formatHours(entry.hours)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[#706878]">
                        {[entry.entry_date, entry.trainer, entry.attended ? "obecność" : "nieobecność"]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {session && (
                        <Link
                          href={`/lab/szkola/zjazdy/${session.id}`}
                          className="mt-1 inline-block truncate text-xs text-[#5b2a86] hover:underline"
                        >
                          {session.title} →
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
