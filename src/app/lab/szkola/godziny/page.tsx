import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import SzkolaNav from "@/components/szkola/SzkolaNav";
import HoursAggregatePanel from "@/components/szkola/HoursAggregatePanel";
import HoursExplorer from "@/components/szkola/HoursExplorer";
import type {
  SchoolSession,
  SessionScheduleItem,
  TrainingHoursEntry,
  TrainingHourRequirement,
} from "@/lib/szkola/types";

export const metadata: Metadata = { title: "Godziny szkoleniowe" };

export default async function GodzinySzkolaPage() {
  const supabase = await createClient();

  const [{ data: sessionsData }, { data: entriesData }, { data: requirementsData }, { data: scheduleItemsData }] =
    await Promise.all([
      supabase.from("school_sessions").select("*").order("start_date", { ascending: false }),
      supabase.from("training_hours_entries").select("*").order("entry_date", { ascending: false }),
      supabase.from("training_hour_requirements").select("*").order("sort_order", { ascending: true }),
      supabase.from("session_schedule_items").select("*"),
    ]);

  const sessions = (sessionsData as SchoolSession[] | null) ?? [];
  const entries = (entriesData as TrainingHoursEntry[] | null) ?? [];
  const requirements = (requirementsData as TrainingHourRequirement[] | null) ?? [];
  const scheduleItems = (scheduleItemsData as SessionScheduleItem[] | null) ?? [];

  return (
    <div className="lab-szkola-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-[32px] font-semibold leading-[1.1] text-[#201a2b]">
            Godziny szkoleniowe
          </h1>
          <p className="mt-1.5 text-[13px] text-[#706878]">
            Rejestr godzin: teoria, doświadczenie własne, superwizja, praktyka kliniczna, warsztat, terapia własna.
          </p>
        </div>
        <div className="mt-6">
          <SzkolaNav />
        </div>
        <div className="mt-6">
          <HoursAggregatePanel entries={entries} requirements={requirements} scheduleItems={scheduleItems} />
        </div>
        <div className="mt-6">
          <HoursExplorer sessions={sessions} entries={entries} />
        </div>
      </div>
    </div>
  );
}
