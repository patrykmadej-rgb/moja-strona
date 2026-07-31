import { WalletCards } from "lucide-react";
import { formatCurrencySums, formatMoney, sumByCurrency } from "@/lib/szkola/money";
import type { Expense, SchoolPayment, SchoolSession } from "@/lib/szkola/types";

export default function BudgetCard({
  session,
  payments,
  expenses,
}: {
  session: SchoolSession;
  payments: SchoolPayment[];
  expenses: Expense[];
}) {
  const spentSums = sumByCurrency([
    ...payments.filter((p) => p.status === "oplacone"),
    ...expenses.filter((e) => e.status === "oplacony"),
  ]);

  const planned = session.planned_budget;
  const plannedCurrency = session.planned_budget_currency ?? "PLN";
  const spentInPlannedCurrency = spentSums[plannedCurrency] ?? 0;
  const remaining = planned != null ? planned - spentInPlannedCurrency : null;
  const percentUsed = planned && planned > 0 ? Math.min(999, Math.round((spentInPlannedCurrency / planned) * 100)) : null;

  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <div className="flex items-center gap-2">
        <WalletCards className="h-4 w-4 shrink-0 text-[#5b2a86]" strokeWidth={1.75} />
        <h2 className="text-sm font-semibold text-[#201a2b]">Budżet i wydatki</h2>
      </div>

      {planned != null ? (
        <>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-[#706878]">Planowany</span>
            <span className="font-medium text-[#201a2b]">{formatMoney(planned, plannedCurrency)}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-sm">
            <span className="text-[#706878]">Wydany</span>
            <span className="font-medium text-[#201a2b]">{formatMoney(spentInPlannedCurrency, plannedCurrency)}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-sm">
            <span className="text-[#706878]">Pozostały</span>
            <span className={remaining !== null && remaining < 0 ? "font-medium text-red-600" : "font-medium text-[#201a2b]"}>
              {remaining !== null ? formatMoney(remaining, plannedCurrency) : "—"}
            </span>
          </div>

          {percentUsed !== null && (
            <div className="mt-2.5 h-1.5 w-full rounded-full bg-[#eee9f2]">
              <div
                className={
                  percentUsed > 100
                    ? "h-1.5 rounded-full bg-red-500"
                    : "h-1.5 rounded-full bg-gradient-to-r from-[#6c35a1] to-[#8b5bb7]"
                }
                style={{ width: `${Math.min(100, percentUsed)}%` }}
              />
            </div>
          )}
          {percentUsed !== null && <p className="mt-1 text-right text-xs text-[#9a919f]">{percentUsed}% wykorzystania</p>}
        </>
      ) : (
        <p className="mt-3 text-xs italic text-[#9a919f]">
          Nie ustawiono planowanego budżetu — dodaj go w edycji zjazdu.
        </p>
      )}

      <div className="mt-3 border-t border-[#eee9f2] pt-3">
        <p className="text-xs text-[#706878]">Wszystkie wydatki i płatności</p>
        <p className="mt-1 text-sm font-medium text-[#201a2b]">{formatCurrencySums(sumByCurrency([...payments, ...expenses]))}</p>
      </div>
    </section>
  );
}
