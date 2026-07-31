import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import SzkolaNav from "@/components/szkola/SzkolaNav";
import SessionsPageHeader from "@/components/szkola/SessionsPageHeader";
import SessionsExplorer from "@/components/szkola/SessionsExplorer";
import { getMissingTaskTitles, getPreparationPercent } from "@/lib/szkola/preparation";
import type { SchoolSession, SessionTask } from "@/lib/szkola/types";
import type { SessionListItem } from "@/components/szkola/SessionsExplorer";

export const metadata: Metadata = {
  title: "Zjazdy",
};

export default async function ZjazdySzkolaPage() {
  const supabase = await createClient();

  const [{ data: sessionsData }, { data: tasksData }, { data: scheduleData }, { data: paymentsData }, { data: expensesData }] =
    await Promise.all([
      supabase.from("school_sessions").select("*").order("start_date", { ascending: true }),
      supabase.from("session_tasks").select("*"),
      supabase.from("session_schedule_items").select("id, session_id"),
      supabase.from("school_payments").select("session_id, amount"),
      supabase.from("expenses").select("session_id, amount"),
    ]);

  const sessions = (sessionsData as SchoolSession[] | null) ?? [];
  const allTasks = (tasksData as SessionTask[] | null) ?? [];
  const scheduleItems = (scheduleData as { id: string; session_id: string }[] | null) ?? [];
  const payments = (paymentsData as { session_id: string | null; amount: number }[] | null) ?? [];
  const expenses = (expensesData as { session_id: string | null; amount: number }[] | null) ?? [];

  const items: SessionListItem[] = sessions.map((session) => {
    const tasks = allTasks.filter((t) => t.session_id === session.id);
    const scheduleCount = scheduleItems.filter((s) => s.session_id === session.id).length;
    const costSum =
      payments.filter((p) => p.session_id === session.id).reduce((sum, p) => sum + Number(p.amount), 0) +
      expenses.filter((e) => e.session_id === session.id).reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      ...session,
      preparationPercent: getPreparationPercent(tasks),
      taskDoneCount: tasks.filter((t) => t.is_done).length,
      taskTotalCount: tasks.length,
      missingTaskTitles: getMissingTaskTitles(tasks),
      scheduleItemCount: scheduleCount,
      totalCostAmount: costSum,
    };
  });

  return (
    <div className="lab-szkola-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <SessionsPageHeader />
        <div className="mt-6">
          <SzkolaNav />
        </div>
        <div className="mt-6">
          <SessionsExplorer sessions={items} />
        </div>
      </div>
    </div>
  );
}
