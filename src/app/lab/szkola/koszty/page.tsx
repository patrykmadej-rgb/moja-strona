import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import SzkolaNav from "@/components/szkola/SzkolaNav";
import CostsExplorer, { type CostRow } from "@/components/szkola/CostsExplorer";
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  PAYMENT_CATEGORY_LABELS,
  PAYMENT_STATUS_LABELS,
  type Currency,
  type Expense,
  type SchoolPayment,
  type SchoolSession,
} from "@/lib/szkola/types";

export const metadata: Metadata = { title: "Koszty" };

export default async function KosztySzkolaPage() {
  const supabase = await createClient();

  const [{ data: paymentsData }, { data: expensesData }, { data: sessionsData }] = await Promise.all([
    supabase.from("school_payments").select("*, session:school_sessions(title)"),
    supabase.from("expenses").select("*, session:school_sessions(title)"),
    supabase.from("school_sessions").select("*").order("start_date", { ascending: false }),
  ]);

  const sessions = (sessionsData as SchoolSession[] | null) ?? [];

  const payments = ((paymentsData as unknown as (SchoolPayment & { session: { title: string } | null })[] | null) ?? []).map(
    (p): CostRow => ({
      id: p.id,
      kind: "payment",
      name: PAYMENT_CATEGORY_LABELS[p.category],
      category: PAYMENT_CATEGORY_LABELS[p.category],
      amount: p.amount,
      currency: p.currency as Currency | null,
      date: p.paid_date ?? p.due_date,
      status: PAYMENT_STATUS_LABELS[p.status],
      sessionId: p.session_id,
      sessionTitle: p.session?.title ?? null,
    }),
  );

  const expenses = ((expensesData as unknown as (Expense & { session: { title: string } | null })[] | null) ?? []).map(
    (e): CostRow => ({
      id: e.id,
      kind: "expense",
      name: e.name,
      category: EXPENSE_CATEGORY_LABELS[e.category],
      amount: e.amount,
      currency: e.currency as Currency | null,
      date: e.expense_date,
      status: EXPENSE_STATUS_LABELS[e.status],
      sessionId: e.session_id,
      sessionTitle: e.session?.title ?? null,
    }),
  );

  return (
    <div className="lab-szkola-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-[32px] font-semibold leading-[1.1] text-[#201a2b]">
            Koszty
          </h1>
          <p className="mt-1.5 text-[13px] text-[#706878]">Zbiorcze zestawienie płatności za szkołę i wydatków ze wszystkich zjazdów.</p>
        </div>

        <div className="mt-6">
          <SzkolaNav />
        </div>

        <div className="mt-6">
          <CostsExplorer costs={[...payments, ...expenses]} sessions={sessions} />
        </div>
      </div>
    </div>
  );
}
