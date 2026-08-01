"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plane, Search } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import { formatMoney } from "@/lib/szkola/money";
import {
  SEGMENT_DIRECTION_LABELS,
  SEGMENT_STATUSES,
  SEGMENT_STATUS_LABELS,
  SEGMENT_TYPES,
  SEGMENT_TYPE_LABELS,
  type SchoolSession,
  type SegmentStatus,
  type SegmentType,
  type TravelSegment,
} from "@/lib/szkola/types";

export type TravelSegmentRow = TravelSegment & { sessionId: string | null; sessionTitle: string | null };

export default function TravelSegmentsExplorer({ segments, sessions }: { segments: TravelSegmentRow[]; sessions: SchoolSession[] }) {
  const [sessionFilter, setSessionFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<SegmentType | "">("");
  const [statusFilter, setStatusFilter] = useState<SegmentStatus | "">("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return segments
      .filter((s) => !sessionFilter || s.sessionId === sessionFilter)
      .filter((s) => !typeFilter || s.segment_type === typeFilter)
      .filter((s) => !statusFilter || s.status === statusFilter)
      .filter((s) => {
        if (!q) return true;
        return `${s.departure_place ?? ""} ${s.arrival_place ?? ""} ${s.carrier ?? ""}`.toLowerCase().includes(q);
      })
      .sort((a, b) => (a.departure_date ?? "").localeCompare(b.departure_date ?? ""));
  }, [segments, sessionFilter, typeFilter, statusFilter, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative w-full sm:max-w-[280px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a79bb0]" strokeWidth={1.75} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj miejsca lub przewoźnika…"
            className="h-[38px] w-full rounded-[9px] border border-[#e8e2ec] bg-white pl-9 pr-3 text-[13px] text-[#201a2b] outline-none focus:border-[#5b2a86]"
          />
        </div>
        <select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)} className="h-[38px] rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758]">
          <option value="">Wszystkie zjazdy</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as SegmentType | "")} className="h-[38px] rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758]">
          <option value="">Wszystkie środki transportu</option>
          {SEGMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {SEGMENT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as SegmentStatus | "")} className="h-[38px] rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758]">
          <option value="">Wszystkie statusy</option>
          {SEGMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {SEGMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <EmptyState
            icon={Plane}
            title={segments.length === 0 ? "Brak odcinków podróży" : "Nic nie pasuje do filtrów"}
            subtitle={segments.length === 0 ? "Dodaj odcinki podróży w widoku danego zjazdu." : "Zmień wyszukiwanie lub filtry."}
          />
        </section>
      ) : (
        <section className="rounded-[16px] border border-[#e8e2ec] bg-white px-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <ul>
            {filtered.map((segment) => (
              <li key={segment.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee9f2] py-4 last:border-b-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#201a2b]">
                    {segment.direction && <span className="mr-1 text-xs text-[#5b2a86]">{SEGMENT_DIRECTION_LABELS[segment.direction]} ·</span>}
                    {segment.departure_place || "?"} → {segment.arrival_place || "?"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[#706878]">
                    {[SEGMENT_TYPE_LABELS[segment.segment_type], segment.departure_date, segment.carrier, segment.price != null ? formatMoney(segment.price, segment.currency) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {segment.sessionTitle && (
                    <Link href={`/lab/szkola/zjazdy/${segment.sessionId}`} className="mt-1 inline-block text-xs text-[#5b2a86] hover:underline">
                      {segment.sessionTitle} →
                    </Link>
                  )}
                </div>
                <span className="shrink-0 text-xs text-[#706878]">{SEGMENT_STATUS_LABELS[segment.status]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
