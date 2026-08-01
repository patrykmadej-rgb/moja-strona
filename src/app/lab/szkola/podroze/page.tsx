import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import SzkolaNav from "@/components/szkola/SzkolaNav";
import TravelSegmentsExplorer, { type TravelSegmentRow } from "@/components/szkola/TravelSegmentsExplorer";
import type { SchoolSession, TravelSegment } from "@/lib/szkola/types";

export const metadata: Metadata = { title: "Podróże" };

type SegmentJoinRow = TravelSegment & {
  itinerary: { session_id: string; session: { title: string } | null } | null;
};

export default async function PodrozeSzkolaPage() {
  const supabase = await createClient();

  const [{ data: segmentsData }, { data: sessionsData }] = await Promise.all([
    supabase
      .from("travel_segments")
      .select("*, itinerary:travel_itineraries(session_id, session:school_sessions(title))")
      .order("departure_date", { ascending: true }),
    supabase.from("school_sessions").select("*").order("start_date", { ascending: false }),
  ]);

  const sessions = (sessionsData as SchoolSession[] | null) ?? [];
  const segments: TravelSegmentRow[] = ((segmentsData as unknown as SegmentJoinRow[] | null) ?? []).map((row) => ({
    ...row,
    sessionId: row.itinerary?.session_id ?? null,
    sessionTitle: row.itinerary?.session?.title ?? null,
  }));

  return (
    <div className="lab-szkola-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-[32px] font-semibold leading-[1.1] text-[#201a2b]">
            Podróże
          </h1>
          <p className="mt-1.5 text-[13px] text-[#706878]">Zbiorczy widok odcinków podróży ze wszystkich zjazdów.</p>
        </div>

        <div className="mt-6">
          <SzkolaNav />
        </div>

        <div className="mt-6">
          <TravelSegmentsExplorer segments={segments} sessions={sessions} />
        </div>
      </div>
    </div>
  );
}
