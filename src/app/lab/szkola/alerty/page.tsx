import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import SzkolaNav from "@/components/szkola/SzkolaNav";
import AlertsExplorer from "@/components/szkola/AlertsExplorer";
import AutomationRunsHistory from "@/components/szkola/AutomationRunsHistory";
import type { SchoolAlert, SchoolAutomationRun, SchoolSession } from "@/lib/szkola/types";

export const metadata: Metadata = { title: "Alerty" };

export default async function AlertySzkolaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let alerts: SchoolAlert[] = [];
  let sessions: SchoolSession[] = [];
  let automationRuns: SchoolAutomationRun[] = [];

  if (user) {
    const [{ data: alertsData }, { data: sessionsData }, { data: runsData }] = await Promise.all([
      supabase.from("school_alerts").select("*").eq("user_id", user.id).order("detected_at", { ascending: false }),
      supabase.from("school_sessions").select("*").order("start_date", { ascending: false }),
      supabase
        .from("school_automation_runs")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(20),
    ]);
    alerts = (alertsData as SchoolAlert[] | null) ?? [];
    sessions = (sessionsData as SchoolSession[] | null) ?? [];
    automationRuns = (runsData as SchoolAutomationRun[] | null) ?? [];
  }

  return (
    <div className="lab-szkola-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-[32px] font-semibold leading-[1.1] text-[#201a2b]">
            Centrum alertów
          </h1>
          <p className="mt-1.5 text-[13px] text-[#706878]">
            Wszystko, co wymaga Twojej uwagi — podróż, zakwaterowanie, płatności, kalendarz, import i godziny w jednym miejscu.
          </p>
        </div>

        <div className="mt-6">
          <SzkolaNav />
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <AlertsExplorer alerts={alerts} sessions={sessions} />
          <AutomationRunsHistory runs={automationRuns} />
        </div>
      </div>
    </div>
  );
}
