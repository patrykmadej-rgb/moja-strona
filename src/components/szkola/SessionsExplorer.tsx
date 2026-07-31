"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import SessionsTable from "@/components/szkola/SessionsTable";
import {
  matchesSessionFilter,
  SESSION_FILTER_LABELS,
  type SessionFilterKey,
} from "@/lib/szkola/sessionFilters";
import type { Currency, SchoolSession } from "@/lib/szkola/types";

export type SessionListItem = SchoolSession & {
  preparationPercent: number;
  taskDoneCount: number;
  taskTotalCount: number;
  missingTaskTitles: string[];
  scheduleItemCount: number;
  costSums: Partial<Record<Currency, number>>;
};

type SortKey = "date_asc" | "title_asc" | "preparation_asc";

const SORT_LABELS: Record<SortKey, string> = {
  date_asc: "Data zjazdu",
  title_asc: "Tytuł A-Z",
  preparation_asc: "Przygotowanie",
};

export default function SessionsExplorer({ sessions }: { sessions: SessionListItem[] }) {
  const [filter, setFilter] = useState<SessionFilterKey>("wszystkie");
  const [query, setQuery] = useState("");
  const [trainingYear, setTrainingYear] = useState("");
  const [sort, setSort] = useState<SortKey>("date_asc");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const counts = useMemo(() => {
    const result = {} as Record<SessionFilterKey, number>;
    (Object.keys(SESSION_FILTER_LABELS) as SessionFilterKey[]).forEach((key) => {
      result[key] = sessions.filter((s) => matchesSessionFilter(s, key)).length;
    });
    return result;
  }, [sessions]);

  const trainingYears = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.training_year).filter(Boolean))).sort(),
    [sessions],
  ) as string[];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = sessions.filter((s) => matchesSessionFilter(s, filter));
    if (trainingYear) list = list.filter((s) => s.training_year === trainingYear);
    if (q) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.topic ?? "").toLowerCase().includes(q) ||
          (s.city ?? "").toLowerCase().includes(q),
      );
    }

    list = [...list].sort((a, b) => {
      if (sort === "title_asc") return a.title.localeCompare(b.title, "pl");
      if (sort === "preparation_asc") return a.preparationPercent - b.preparationPercent;
      return a.start_date.localeCompare(b.start_date);
    });

    return list;
  }, [sessions, filter, trainingYear, query, sort]);

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex flex-wrap items-center gap-0.5 self-start rounded-[10px] border border-[#e8e2ec] bg-[#fbfafc] p-1">
        {(Object.keys(SESSION_FILTER_LABELS) as SessionFilterKey[]).map((key) => {
          const isActive = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={
                isActive
                  ? "inline-flex h-8 items-center gap-[7px] rounded-[7px] bg-[#f1eafd] px-3 text-[12px] font-medium text-[#5b2a86] transition-colors"
                  : "inline-flex h-8 items-center gap-[7px] rounded-[7px] px-3 text-[12px] font-medium text-[#706878] transition-colors hover:bg-white hover:text-[#4c1f72]"
              }
            >
              {SESSION_FILTER_LABELS[key]}
              <span
                className={
                  isActive
                    ? "rounded-full bg-[#5b2a86]/[0.1] px-[6px] py-[2px] text-[10px] text-[#5b2a86]"
                    : "rounded-full bg-[#5b2a86]/[0.08] px-[6px] py-[2px] text-[10px] text-[#706878]"
                }
              >
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[380px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a79bb0]"
            strokeWidth={1.75}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj zjazdu…"
            className="h-[38px] w-full rounded-[9px] border border-[#e8e2ec] bg-white pl-9 pr-3 text-[13px] text-[#201a2b] outline-none transition-colors focus:border-[#5b2a86] sm:w-[360px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {trainingYears.length > 0 && (
            <select
              value={trainingYear}
              onChange={(e) => setTrainingYear(e.target.value)}
              aria-label="Filtruj po roku szkoleniowym"
              className="h-[38px] rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758] outline-none focus:border-[#5b2a86]"
            >
              <option value="">Wszystkie lata</option>
              {trainingYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setSortMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={sortMenuOpen}
              className="flex h-[38px] items-center gap-2 rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758] transition-colors hover:border-[#d9cde5]"
            >
              Sortuj: {SORT_LABELS[sort]}
            </button>
            {sortMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 w-52 rounded-[10px] border border-[#e8e2ec] bg-white py-1 shadow-[0_8px_24px_rgba(49,30,64,0.12)]"
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setSort(key);
                      setSortMenuOpen(false);
                    }}
                    className={
                      sort === key
                        ? "flex w-full items-center px-3 py-1.5 text-left text-sm text-[#5b2a86]"
                        : "flex w-full items-center px-3 py-1.5 text-left text-sm text-[#201a2b] hover:bg-[#f1eafd] hover:text-[#4c1f72]"
                    }
                  >
                    {SORT_LABELS[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <SessionsTable sessions={filtered} hasAnySessions={sessions.length > 0} />
    </div>
  );
}
