import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import SzkolaNav from "@/components/szkola/SzkolaNav";
import SessionsPageHeader from "@/components/szkola/SessionsPageHeader";
import SessionsExplorer from "@/components/szkola/SessionsExplorer";
import { getAutomaticPreparationItems, getAutomaticPreparationMissingLabels, getAutomaticPreparationPercent } from "@/lib/szkola/preparation";
import { sumByCurrency } from "@/lib/szkola/money";
import type { Accommodation, Currency, SchoolSemester, SchoolSession, TravelSegment } from "@/lib/szkola/types";
import type { SessionListItem } from "@/components/szkola/SessionsExplorer";

export const metadata: Metadata = {
  title: "Zjazdy",
};

export default async function ZjazdySzkolaPage() {
  const supabase = await createClient();

  const [
    { data: sessionsData },
    { data: itinerariesData },
    { data: segmentsData },
    { data: accommodationsData },
    { data: semestersData },
    { data: scheduleData },
    { data: paymentsData },
    { data: expensesData },
  ] = await Promise.all([
    supabase.from("school_sessions").select("*").order("start_date", { ascending: true }),
    supabase.from("travel_itineraries").select("id, session_id"),
    supabase.from("travel_segments").select("*"),
    supabase.from("accommodations").select("*"),
    supabase.from("school_semesters").select("*"),
    supabase.from("session_schedule_items").select("id, session_id"),
    supabase.from("school_payments").select("session_id, amount, currency"),
    supabase.from("expenses").select("session_id, amount, currency"),
  ]);

  const sessions = (sessionsData as SchoolSession[] | null) ?? [];
  const itineraries = (itinerariesData as { id: string; session_id: string }[] | null) ?? [];
  const allSegments = (segmentsData as TravelSegment[] | null) ?? [];
  const accommodations = (accommodationsData as Accommodation[] | null) ?? [];
  const semesters = (semestersData as SchoolSemester[] | null) ?? [];
  const scheduleItems = (scheduleData as { id: string; session_id: string }[] | null) ?? [];
  const payments =
    (paymentsData as { session_id: string | null; amount: number; currency: Currency | null }[] | null) ?? [];
  const expenses =
    (expensesData as { session_id: string | null; amount: number; currency: Currency | null }[] | null) ?? [];

  const items: SessionListItem[] = sessions.map((session) => {
    const itineraryId = itineraries.find((it) => it.session_id === session.id)?.id;
    const segments = itineraryId ? allSegments.filter((s) => s.itinerary_id === itineraryId) : [];
    const sessionAccommodations = accommodations.filter((a) => a.session_id === session.id);
    const semester = semesters.find((s) => s.id === session.semester_id) ?? null;
    const prepItems = getAutomaticPreparationItems({
      segments,
      accommodations: sessionAccommodations,
      lodgingNotNeeded: session.lodging_not_needed,
      semester,
    });

    const scheduleCount = scheduleItems.filter((s) => s.session_id === session.id).length;
    const costSums = sumByCurrency([
      ...payments.filter((p) => p.session_id === session.id),
      ...expenses.filter((e) => e.session_id === session.id),
    ]);

    return {
      ...session,
      preparationPercent: getAutomaticPreparationPercent(prepItems),
      taskDoneCount: prepItems.filter((i) => i.kind === "done" || i.kind === "not_needed").length,
      taskTotalCount: prepItems.length,
      missingTaskTitles: getAutomaticPreparationMissingLabels(prepItems),
      scheduleItemCount: scheduleCount,
      costSums,
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
