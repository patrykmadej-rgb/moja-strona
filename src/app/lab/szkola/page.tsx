import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, CalendarDays } from "lucide-react";
import SzkolaNav from "@/components/szkola/SzkolaNav";
import NextSessionCard from "@/components/szkola/NextSessionCard";
import SchoolSummaryCards from "@/components/szkola/SchoolSummaryCards";
import { todayDateString } from "@/lib/lab/format";
import { sumByCurrency } from "@/lib/szkola/money";
import type { Currency, SchoolSession, SessionTask } from "@/lib/szkola/types";

export const metadata: Metadata = {
  title: "Szkoła psychoterapii",
};

export default async function SzkolaPulpitPage() {
  const supabase = await createClient();
  const today = todayDateString();
  const currentYear = new Date().getFullYear();

  const [
    { data: upcomingSessions },
    { data: itinerarySessionIds },
    { data: payments },
    { data: expenses },
    { data: calendarChanges },
  ] = await Promise.all([
    supabase
      .from("school_sessions")
      .select("*")
      .neq("status", "anulowany")
      .gte("start_date", today)
      .order("start_date", { ascending: true }),
    supabase.from("travel_itineraries").select("session_id"),
    supabase.from("school_payments").select("amount, currency, paid_date, due_date"),
    supabase.from("expenses").select("amount, currency, expense_date"),
    supabase.from("calendar_changes").select("id, acknowledged"),
  ]);

  const sessions = (upcomingSessions as SchoolSession[] | null) ?? [];
  const nextSession = sessions[0] ?? null;

  let tasks: SessionTask[] = [];
  if (nextSession) {
    const { data: tasksData } = await supabase
      .from("session_tasks")
      .select("*")
      .eq("session_id", nextSession.id)
      .order("sort_order", { ascending: true });
    tasks = (tasksData as SessionTask[] | null) ?? [];
  }

  const preparedTripsCount = new Set((itinerarySessionIds ?? []).map((r) => r.session_id)).size;

  const isThisYear = (dateStr: string | null) => !!dateStr && dateStr.startsWith(String(currentYear));
  const paymentsThisYear = (payments ?? []).filter((p) => isThisYear(p.paid_date) || isThisYear(p.due_date));
  const expensesThisYear = (expenses ?? []).filter((e) => isThisYear(e.expense_date));
  const expensesThisYearSums = sumByCurrency([
    ...(paymentsThisYear as { amount: number; currency: Currency | null }[]),
    ...(expensesThisYear as { amount: number; currency: Currency | null }[]),
  ]);

  const calendarChangesCount = (calendarChanges ?? []).filter((c) => !c.acknowledged).length;

  return (
    <div className="lab-szkola-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="font-[family-name:var(--font-cormorant)] text-[32px] font-semibold leading-[1.1] text-[#201a2b]">
              Szkoła psychoterapii
            </h1>
            <p className="mt-1.5 text-[13px] text-[#706878]">
              Kontroluj zjazdy, podróże, opłaty, materiały i godziny szkoleniowe.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/lab/szkola/kalendarz"
              className="flex h-10 items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-4 text-[13px] font-medium text-[#201a2b] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]"
            >
              <CalendarDays className="h-4 w-4" strokeWidth={1.75} />
              Sprawdź kalendarz
            </Link>
            <Link
              href="/lab/szkola/zjazdy/nowy"
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#32134f]"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Dodaj zjazd
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <SzkolaNav />
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <NextSessionCard session={nextSession ? { ...nextSession, tasks } : null} />

          <SchoolSummaryCards
            nextSessionLabel={
              nextSession ? (nextSession.session_number ? `Zjazd ${nextSession.session_number}` : nextSession.title) : "Brak"
            }
            preparedTripsCount={preparedTripsCount}
            totalSessionsForTravel={sessions.length}
            expensesThisYearSums={expensesThisYearSums}
            calendarChangesCount={calendarChangesCount}
            calendarConnected={false}
          />
        </div>
      </div>
    </div>
  );
}
