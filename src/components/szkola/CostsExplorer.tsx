"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, WalletCards } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import { formatCurrencySums, formatMoney, sumByCurrency } from "@/lib/szkola/money";
import type { Currency, SchoolSession } from "@/lib/szkola/types";

export type CostRow = {
  id: string;
  kind: "payment" | "expense";
  name: string;
  category: string;
  amount: number;
  currency: Currency | null;
  date: string | null;
  status: string;
  sessionId: string | null;
  sessionTitle: string | null;
};

export default function CostsExplorer({ costs, sessions }: { costs: CostRow[]; sessions: SchoolSession[] }) {
  const [sessionFilter, setSessionFilter] = useState("");
  const [kindFilter, setKindFilter] = useState<"payment" | "expense" | "">("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return costs
      .filter((c) => !sessionFilter || c.sessionId === sessionFilter)
      .filter((c) => !kindFilter || c.kind === kindFilter)
      .filter((c) => !q || `${c.name} ${c.category}`.toLowerCase().includes(q))
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  }, [costs, sessionFilter, kindFilter, query]);

  const totals = sumByCurrency(filtered.map((c) => ({ amount: c.amount, currency: c.currency })));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative w-full sm:max-w-[280px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a79bb0]" strokeWidth={1.75} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj nazwy lub kategorii…"
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
        <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as "payment" | "expense" | "")} className="h-[38px] rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758]">
          <option value="">Płatności i wydatki</option>
          <option value="payment">Tylko płatności za szkołę</option>
          <option value="expense">Tylko wydatki</option>
        </select>
      </div>

      {Object.keys(totals).length > 0 && (
        <p className="text-xs text-[#706878]">Suma widocznych pozycji: {formatCurrencySums(totals)}</p>
      )}

      {filtered.length === 0 ? (
        <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <EmptyState
            icon={WalletCards}
            title={costs.length === 0 ? "Brak płatności i wydatków" : "Nic nie pasuje do filtrów"}
            subtitle={costs.length === 0 ? "Dodaj płatności i wydatki w widoku danego zjazdu." : "Zmień wyszukiwanie lub filtry."}
          />
        </section>
      ) : (
        <section className="rounded-[16px] border border-[#e8e2ec] bg-white px-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <ul>
            {filtered.map((cost) => (
              <li key={`${cost.kind}-${cost.id}`} className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee9f2] py-4 last:border-b-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#201a2b]">{cost.name}</p>
                  <p className="mt-0.5 truncate text-xs text-[#706878]">
                    {[cost.kind === "payment" ? "Płatność za szkołę" : "Wydatek", cost.category, cost.date].filter(Boolean).join(" · ")}
                  </p>
                  {cost.sessionTitle && (
                    <Link href={`/lab/szkola/zjazdy/${cost.sessionId}`} className="mt-1 inline-block text-xs text-[#5b2a86] hover:underline">
                      {cost.sessionTitle} →
                    </Link>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium text-[#201a2b]">{formatMoney(cost.amount, cost.currency)}</p>
                  <p className="text-xs text-[#706878]">{cost.status}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
