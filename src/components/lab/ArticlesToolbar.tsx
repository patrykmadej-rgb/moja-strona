"use client";

import { useEffect, useRef, useState } from "react";
import { IconChevronDown, IconSearch } from "@tabler/icons-react";
import { ARTICLE_STATUSES, ARTICLE_STATUS_LABELS, type ArticleStatus } from "@/lib/lab/types";

export type SortKey = "updated_desc" | "title_asc" | "deadline_asc";

const SORT_LABELS: Record<SortKey, string> = {
  updated_desc: "Data aktualizacji",
  title_asc: "Tytuł A-Z",
  deadline_asc: "Deadline",
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
  statusFilter,
  onStatusFilterChange,
  sort,
  onSortChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: ArticleStatus | "";
  onStatusFilterChange: (value: ArticleStatus | "") => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
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
        <DropdownButton label={statusFilter ? ARTICLE_STATUS_LABELS[statusFilter] : "Status"}>
          {(close) => (
            <>
              <MenuItem
                active={statusFilter === ""}
                onClick={() => {
                  onStatusFilterChange("");
                  close();
                }}
              >
                Wszystkie statusy
              </MenuItem>
              {ARTICLE_STATUSES.map((s) => (
                <MenuItem
                  key={s}
                  active={statusFilter === s}
                  onClick={() => {
                    onStatusFilterChange(s);
                    close();
                  }}
                >
                  {ARTICLE_STATUS_LABELS[s]}
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
