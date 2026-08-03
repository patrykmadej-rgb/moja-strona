"use client";

import { useEffect, useRef, useState } from "react";
import { IconChevronDown, IconSearch } from "@tabler/icons-react";
import { ARTICLE_PRIORITIES, ARTICLE_PRIORITY_LABELS, NO_PRIORITY_LABEL, type ArticlePriorityValue } from "@/lib/lab/types";

export type SortKey = "updated_desc" | "title_asc" | "deadline_asc" | "priority";

const SORT_LABELS: Record<SortKey, string> = {
  updated_desc: "Data aktualizacji",
  title_asc: "Tytuł A-Z",
  deadline_asc: "Deadline",
  priority: "Priorytet",
};

/**
 * Osobny wymiar filtrowania od paska statusów (ArticleStatusFilterBar) —
 * priorytet i status to dwa niezależne osie organizacji (sekcja 9
 * specyfikacji), więc ten filtr nie zastępuje ani nie miesza się z paskiem
 * statusów.
 */
export type PriorityFilterValue = "all" | ArticlePriorityValue | "none";

// Kolejność dokładnie jak w specyfikacji (sekcja 7) — "Bez priorytetu" na końcu.
const PRIORITY_FILTER_OPTIONS: PriorityFilterValue[] = ["all", ...ARTICLE_PRIORITIES, "none"];

const PRIORITY_FILTER_LABELS: Record<PriorityFilterValue, string> = {
  all: "Wszystkie priorytety",
  ...ARTICLE_PRIORITY_LABELS,
  none: NO_PRIORITY_LABEL,
};

function DropdownButton({
  label,
  children,
}: {
  label: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-[38px] w-full items-center justify-between gap-2 rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758] transition-colors hover:border-[#d9cde5] sm:w-auto"
      >
        <span className="truncate">{label}</span>
        <IconChevronDown className="h-3.5 w-3.5 shrink-0 text-[#706878]" stroke={1.75} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-56 rounded-[10px] border border-[#e8e2ec] bg-white py-1 shadow-[0_8px_24px_rgba(49,30,64,0.12)] sm:left-0 sm:right-auto"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={
        active
          ? "flex w-full items-center px-3 py-1.5 text-left text-sm text-[#5b2a86]"
          : "flex w-full items-center px-3 py-1.5 text-left text-sm text-[#201a2b] hover:bg-[#f1eafd] hover:text-[#4c1f72]"
      }
    >
      {children}
    </button>
  );
}

export default function ArticlesToolbar({
  query,
  onQueryChange,
  sort,
  onSortChange,
  priorityFilter,
  onPriorityFilterChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  priorityFilter: PriorityFilterValue;
  onPriorityFilterChange: (value: PriorityFilterValue) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-[380px]">
        <IconSearch
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a79bb0]"
          stroke={1.75}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Szukaj artykułu…"
          className="h-[38px] w-full rounded-[9px] border border-[#e8e2ec] bg-white pl-9 pr-3 text-[13px] text-[#201a2b] outline-none transition-colors focus:border-[#5b2a86] sm:w-[360px]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DropdownButton label={PRIORITY_FILTER_LABELS[priorityFilter]}>
          {(close) => (
            <>
              {PRIORITY_FILTER_OPTIONS.map((value) => (
                <MenuItem
                  key={value}
                  active={priorityFilter === value}
                  onClick={() => {
                    onPriorityFilterChange(value);
                    close();
                  }}
                >
                  {PRIORITY_FILTER_LABELS[value]}
                </MenuItem>
              ))}
            </>
          )}
        </DropdownButton>

        <DropdownButton label={`Sortuj: ${SORT_LABELS[sort]}`}>
          {(close) => (
            <>
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <MenuItem
                  key={key}
                  active={sort === key}
                  onClick={() => {
                    onSortChange(key);
                    close();
                  }}
                >
                  {SORT_LABELS[key]}
                </MenuItem>
              ))}
            </>
          )}
        </DropdownButton>
      </div>
    </div>
  );
}
