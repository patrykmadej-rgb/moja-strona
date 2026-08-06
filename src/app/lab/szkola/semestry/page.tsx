import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import SzkolaNav from "@/components/szkola/SzkolaNav";
import SemestersExplorer from "@/components/szkola/SemestersExplorer";
import type { SchoolSemester } from "@/lib/szkola/types";

export const metadata: Metadata = {
  title: "Semestry",
};

export default async function SemestrySzkolaPage() {
  const supabase = await createClient();

  const [{ data: semestersData }, { data: sessionsData }] = await Promise.all([
    supabase.from("school_semesters").select("*").order("start_date", { ascending: false }),
    supabase.from("school_sessions").select("semester_id"),
  ]);

  const semesters = (semestersData as SchoolSemester[] | null) ?? [];
  const sessions = (sessionsData as { semester_id: string | null }[] | null) ?? [];

  const sessionCounts: Record<string, number> = {};
  for (const session of sessions) {
    if (!session.semester_id) continue;
    sessionCounts[session.semester_id] = (sessionCounts[session.semester_id] ?? 0) + 1;
  }

  return (
    <div className="lab-szkola-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-[28px] font-semibold text-[#201a2b]">
            Semestry
          </h1>
          <p className="mt-1.5 text-[13px] text-[#706878]">
            Zarządzaj semestralnymi opłatami za szkołę i przypisaniem zjazdów do semestrów.
          </p>
        </div>

        <div className="mt-6">
          <SzkolaNav />
        </div>

        <div className="mt-6">
          <SemestersExplorer semesters={semesters} sessionCounts={sessionCounts} />
        </div>
      </div>
    </div>
  );
}
