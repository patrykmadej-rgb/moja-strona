import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SessionWorkspace from "@/components/szkola/SessionWorkspace";
import type {
  Accommodation,
  Expense,
  SchoolCalendarEvent,
  SchoolPayment,
  SchoolSession,
  SessionDocument,
  SessionMaterial,
  SessionScheduleItem,
  SessionTask,
  TrainingHoursEntry,
  TravelSegment,
} from "@/lib/szkola/types";

export const metadata: Metadata = {
  title: "Zjazd",
};

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("school_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!session) notFound();

  const [
    { data: tasksData },
    { data: itinerary },
    { data: accommodationsData },
    { data: paymentsData },
    { data: expensesData },
    { data: scheduleItemsData },
    { data: materialsData },
    { data: documentsData },
    { data: hoursEntriesData },
    { data: googleEventsData },
  ] = await Promise.all([
    supabase.from("session_tasks").select("*").eq("session_id", id).order("sort_order", { ascending: true }),
    supabase.from("travel_itineraries").select("id").eq("session_id", id).maybeSingle(),
    supabase.from("accommodations").select("*").eq("session_id", id).order("check_in", { ascending: true }),
    supabase.from("school_payments").select("*").eq("session_id", id).order("due_date", { ascending: true }),
    supabase.from("expenses").select("*").eq("session_id", id).order("expense_date", { ascending: true }),
    supabase
      .from("session_schedule_items")
      .select("*")
      .eq("session_id", id)
      .order("item_date", { ascending: true })
      .order("sort_order", { ascending: true }),
    supabase.from("session_materials").select("*").eq("session_id", id).order("created_at", { ascending: false }),
    supabase.from("session_documents").select("*").eq("session_id", id).order("created_at", { ascending: false }),
    supabase
      .from("training_hours_entries")
      .select("*")
      .eq("session_id", id)
      .order("entry_date", { ascending: true }),
    supabase
      .from("school_calendar_events")
      .select("*")
      .eq("session_id", id)
      .is("deleted_at", null)
      .order("start_at", { ascending: true }),
  ]);

  let segments: TravelSegment[] = [];
  if (itinerary) {
    const { data: segmentsData } = await supabase
      .from("travel_segments")
      .select("*")
      .eq("itinerary_id", itinerary.id)
      .order("sort_order", { ascending: true });
    segments = (segmentsData as TravelSegment[] | null) ?? [];
  }

  const scheduleItems = (scheduleItemsData as SessionScheduleItem[] | null) ?? [];
  const importedGoogleEventIds = new Set(scheduleItems.map((item) => item.google_event_id).filter(Boolean));
  const googleEvents = (googleEventsData as SchoolCalendarEvent[] | null) ?? [];
  const importableGoogleEvents = googleEvents.filter(
    (event) => event.status !== "cancelled" && !importedGoogleEventIds.has(event.google_event_id),
  );

  return (
    <SessionWorkspace
      session={session as SchoolSession}
      tasks={(tasksData as SessionTask[] | null) ?? []}
      segments={segments}
      accommodations={(accommodationsData as Accommodation[] | null) ?? []}
      payments={(paymentsData as SchoolPayment[] | null) ?? []}
      expenses={(expensesData as Expense[] | null) ?? []}
      scheduleItems={scheduleItems}
      materials={(materialsData as SessionMaterial[] | null) ?? []}
      documents={(documentsData as SessionDocument[] | null) ?? []}
      hoursEntries={(hoursEntriesData as TrainingHoursEntry[] | null) ?? []}
      importableGoogleEvents={importableGoogleEvents}
    />
  );
}
