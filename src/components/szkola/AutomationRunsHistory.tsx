"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatDateTime } from "@/lib/lab/format";
import type { SchoolAutomationRun } from "@/lib/szkola/types";

const STATUS_LABELS: Record<SchoolAutomationRun["status"], string> = {
  running: "W toku",
  success: "Zakończone sukcesem",
  partial: "Częściowo zakończone",
  failed: "Zakończone błędem",
};

const STATUS_CLASS: Record<SchoolAutomationRun["status"], string> = {
  running: "bg-[#f1eafd] text-[#5b2a86]",
  success: "bg-[#e9f7ee] text-[#1e7a42]",
  partial: "bg-[#fdf1de] text-[#8a5a12]",
  failed: "bg-[#fbe9e9] text-[#9a2f2f]",
};

export default function AutomationRunsHistory({ runs }: { runs: SchoolAutomationRun[] }) {
  const [expanded, setExpanded] = useState(false);
  if (runs.length === 0) return null;

  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <button type="button" onClick={() => setExpanded((v) => !v)} className="flex w-full items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[#201a2b]">Historia automatyzacji (sprawdzenia dzienne)</h2>
        <ChevronDown className={`h-4 w-4 text-[#706878] transition-transform ${expanded ? "rotate-180" : ""}`} strokeWidth={1.75} />
      </button>

      {expanded && (
        <ul className="mt-3 flex flex-col gap-2">
          {runs.slice(0, 10).map((run) => (
            <li key={run.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eee9f2] pb-2 text-xs last:border-b-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 ${STATUS_CLASS[run.status]}`}>{STATUS_LABELS[run.status]}</span>
                <span className="text-[#706878]">{formatDateTime(run.started_at)}</span>
              </div>
              <span className="text-[#9a919f]">
                {run.records_processed} sprawdzonych · {run.alerts_created} nowych alertów
                {run.error_message ? ` · ${run.error_message}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
