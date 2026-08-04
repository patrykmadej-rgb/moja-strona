"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Inbox, Search } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import { formatDateTime } from "@/lib/lab/format";
import { formatMoney } from "@/lib/szkola/money";
import { isStuckProcessing } from "@/lib/szkola/import/staleness";
import {
  IMPORT_DETECTED_TYPE_LABELS,
  IMPORT_DETECTED_TYPES,
  IMPORT_STATUS_LABELS,
  type Currency,
  type ImportDetectedType,
  type ImportStatus,
  type OcrStatus,
  type SchoolSession,
} from "@/lib/szkola/types";

export type ImportListRow = {
  id: string;
  status: ImportStatus;
  ocrStatus: OcrStatus | null;
  updatedAt: string;
  detectedType: ImportDetectedType | null;
  confidenceScore: number | null;
  originalFilename: string | null;
  rawEmailSubject: string | null;
  senderName: string | null;
  receivedAt: string;
  sessionId: string | null;
  sessionTitle: string | null;
  amount: number | null;
  currency: Currency | null;
};

type TabKey = "nowe" | "wymagaja_sprawdzenia" | "gotowe" | "przypisane" | "odrzucone" | "wszystkie";

const TABS: { key: TabKey; label: string }[] = [
  { key: "nowe", label: "Nowe" },
  { key: "wymagaja_sprawdzenia", label: "Wymagają sprawdzenia" },
  { key: "gotowe", label: "Gotowe do zatwierdzenia" },
  { key: "przypisane", label: "Przypisane" },
  { key: "odrzucone", label: "Odrzucone" },
  { key: "wszystkie", label: "Wszystkie" },
];

function matchesTab(status: ImportStatus, tab: TabKey): boolean {
  if (tab === "wszystkie") return true;
  if (tab === "nowe") return status === "new" || status === "processing";
  if (tab === "wymagaja_sprawdzenia") return status === "needs_review" || status === "error";
  if (tab === "gotowe") return status === "recognized" || status === "ready";
  if (tab === "przypisane") return status === "assigned";
  if (tab === "odrzucone") return status === "rejected";
  return false;
}

const STATUS_BADGE_CLASS: Record<ImportStatus, string> = {
  new: "bg-[#f1eafd] text-[#5b2a86]",
  processing: "bg-[#f1eafd] text-[#5b2a86]",
  recognized: "bg-[#e6f0fb] text-[#2a5b86]",
  needs_review: "bg-[#fdf1de] text-[#8a5a12]",
  ready: "bg-[#e9f7ee] text-[#1e7a42]",
  assigned: "bg-[#efedf0] text-[#4f4758]",
  rejected: "bg-[#fbe9e9] text-[#9a2f2f]",
  error: "bg-[#fbe9e9] text-[#9a2f2f]",
};

export default function ImportInboxExplorer({ items, sessions }: { items: ImportListRow[]; sessions: SchoolSession[] }) {
  const [tab, setTab] = useState<TabKey>("wymagaja_sprawdzenia");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ImportDetectedType | "">("");
  const [sessionFilter, setSessionFilter] = useState("");

  const counts = useMemo(() => {
    const result = {} as Record<TabKey, number>;
    for (const t of TABS) result[t.key] = items.filter((i) => matchesTab(i.status, t.key)).length;
    return result;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((item) => matchesTab(item.status, tab))
      .filter((item) => !typeFilter || item.detectedType === typeFilter)
      .filter((item) => !sessionFilter || item.sessionId === sessionFilter)
      .filter((item) => {
        if (!q) return true;
        const haystack = `${item.originalFilename ?? ""} ${item.rawEmailSubject ?? ""} ${item.senderName ?? ""}`.toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  }, [items, tab, typeFilter, sessionFilter, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex flex-wrap items-center gap-0.5 self-start rounded-[10px] border border-[#e8e2ec] bg-[#fbfafc] p-1">
        {TABS.map((t) => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={
                isActive
                  ? "inline-flex h-8 items-center gap-[7px] rounded-[7px] bg-[#f1eafd] px-3 text-[12px] font-medium text-[#5b2a86] transition-colors"
                  : "inline-flex h-8 items-center gap-[7px] rounded-[7px] px-3 text-[12px] font-medium text-[#706878] transition-colors hover:bg-white hover:text-[#4c1f72]"
              }
            >
              {t.label}
              <span
                className={
                  isActive
                    ? "rounded-full bg-[#5b2a86]/[0.1] px-[6px] py-[2px] text-[10px] text-[#5b2a86]"
                    : "rounded-full bg-[#5b2a86]/[0.08] px-[6px] py-[2px] text-[10px] text-[#706878]"
                }
              >
                {counts[t.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative w-full sm:max-w-[280px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a79bb0]" strokeWidth={1.75} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj po nazwie, temacie, nadawcy…"
            className="h-[38px] w-full rounded-[9px] border border-[#e8e2ec] bg-white pl-9 pr-3 text-[13px] text-[#201a2b] outline-none focus:border-[#5b2a86]"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ImportDetectedType | "")}
          aria-label="Filtruj po typie"
          className="h-[38px] rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758]"
        >
          <option value="">Wszystkie typy</option>
          {IMPORT_DETECTED_TYPES.map((t) => (
            <option key={t} value={t}>
              {IMPORT_DETECTED_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
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
      </div>

      {filtered.length === 0 ? (
        <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <EmptyState
            icon={Inbox}
            title={items.length === 0 ? "Skrzynka jest pusta" : "Nic nie pasuje do filtrów"}
            subtitle={
              items.length === 0
                ? "Prześlij plik, wklej treść wiadomości albo zaimportuj EML powyżej."
                : "Zmień wyszukiwanie, filtry albo zakładkę."
            }
          />
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((item) => (
            <li key={item.id}>
              <Link
                href={`/lab/szkola/import/${item.id}`}
                className="flex flex-col gap-2 rounded-[14px] border border-[#e8e2ec] bg-white p-4 transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]/40 min-[560px]:flex-row min-[560px]:items-center min-[560px]:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-[#201a2b]">
                      {item.originalFilename ?? item.rawEmailSubject ?? "Import bez nazwy"}
                    </span>
                    {isStuckProcessing({ status: item.status, ocr_status: item.ocrStatus, updated_at: item.updatedAt }) ? (
                      <span className="rounded-full bg-[#fdf1de] px-2 py-0.5 text-[11px] text-[#8a5a12]">Przerwane</span>
                    ) : (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS_BADGE_CLASS[item.status]}`}>
                        {IMPORT_STATUS_LABELS[item.status]}
                      </span>
                    )}
                    {item.detectedType && (
                      <span className="rounded-full bg-[#f1eafd] px-2 py-0.5 text-[11px] text-[#5b2a86]">
                        {IMPORT_DETECTED_TYPE_LABELS[item.detectedType]}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[#706878]">
                    {[
                      item.senderName,
                      formatDateTime(item.receivedAt),
                      item.sessionTitle,
                      item.amount != null ? formatMoney(item.amount, item.currency) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                {item.confidenceScore != null && (
                  <span className="shrink-0 text-xs text-[#9a919f]">Pewność: {Math.round(item.confidenceScore * 100)}%</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
