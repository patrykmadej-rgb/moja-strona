import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCalendarConnectionSummary, isCalendarConnectionActive } from "@/lib/szkola/calendarConnectionStatus";
import { Plus, CalendarDays } from "lucide-react";
import SzkolaNav from "@/components/szkola/SzkolaNav";
import NextSessionCard from "@/components/szkola/NextSessionCard";
import SchoolSummaryCards from "@/components/szkola/SchoolSummaryCards";
import CalendarChangesSummaryCard, { type DashboardCalendarChange } from "@/components/szkola/CalendarChangesSummaryCard";
import NextSessionLogisticsCard from "@/components/szkola/NextSessionLogisticsCard";
import ImportSummaryCard from "@/components/szkola/ImportSummaryCard";
import AlertsSummaryCard from "@/components/szkola/AlertsSummaryCard";
import { todayDateString } from "@/lib/lab/format";
import { sumByCurrency } from "@/lib/szkola/money";
import type { Accommodation, Currency, SchoolAlert, SchoolSemester, SchoolSession, TravelSegment } from "@/lib/szkola/types";

export const metadata: Metadata = {
  title: "Szkoła psychoterapii",
};

export default async function SzkolaPulpitPage() {
  const supabase = await createClient();
  const today = todayDateString();
  const currentYear = new Date().getFullYear();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: upcomingSessions }, { data: itinerarySessionIds }, { data: payments }, { data: expenses }] =
    await Promise.all([
      supabase
        .from("school_sessions")
        .select("*")
        .neq("status", "anulowany")
        .gte("start_date", today)
        .order("start_date", { ascending: true }),
      supabase.from("travel_itineraries").select("session_id"),
      supabase.from("school_payments").select("amount, currency, paid_date, due_date"),
      supabase.from("expenses").select("amount, currency, expense_date"),
    ]);

  let calendarConnected = false;
  let dashboardChanges: DashboardCalendarChange[] = [];
  let calendarChangesCount = 0;

  if (user) {
    try {
      const { connection } = await getCalendarConnectionSummary(user.id);
      calendarConnected = isCalendarConnectionActive(connection);

      if (calendarConnected) {
        const { count } = await supabase
          .from("school_calendar_changes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "new");
        calendarChangesCount = count ?? 0;

        const { data: changesData } = await supabase
          .from("school_calendar_changes")
          .select("id, change_type, field_name, impact_level, impact_summary, session:school_sessions(title)")
          .eq("user_id", user.id)
          .eq("status", "new")
          .order("detected_at", { ascending: false })
          .limit(5);

        dashboardChanges = ((changesData as unknown as
          | { id: string; change_type: DashboardCalendarChange["change_type"]; field_name: string | null; impact_level: DashboardCalendarChange["impact_level"]; impact_summary: string | null; session: { title: string } | null }[]
          | null) ?? []
        ).map((row) => ({
          id: row.id,
          change_type: row.change_type,
          field_name: row.field_name,
          impact_level: row.impact_level,
          impact_summary: row.impact_summary,
          session_title: row.session?.title ?? null,
        }));
      }
    } catch {
      // Pulpit szkoły musi się renderować niezależnie od stanu integracji
      // kalendarza — brak konfiguracji/danych nie może wywalić całej strony.
      calendarConnected = false;
      calendarChangesCount = 0;
      dashboardChanges = [];
    }
  }

  const sessions = (upcomingSessions as SchoolSession[] | null) ?? [];
  const nextSession = sessions[0] ?? null;

  let nextSessionSegments: TravelSegment[] = [];
  let nextSessionAccommodations: Accommodation[] = [];
  let nextSessionSemester: SchoolSemester | null = null;
  if (nextSession) {
    const [{ data: itinerary }, { data: accommodationsData }, { data: semesterData }] = await Promise.all([
      supabase.from("travel_itineraries").select("id").eq("session_id", nextSession.id).maybeSingle(),
      supabase.from("accommodations").select("*").eq("session_id", nextSession.id),
      nextSession.semester_id
        ? supabase.from("school_semesters").select("*").eq("id", nextSession.semester_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    nextSessionAccommodations = (accommodationsData as Accommodation[] | null) ?? [];
    nextSessionSemester = (semesterData as SchoolSemester | null) ?? null;
    if (itinerary) {
      const { data: segmentsData } = await supabase.from("travel_segments").select("*").eq("itinerary_id", itinerary.id);
      nextSessionSegments = (segmentsData as TravelSegment[] | null) ?? [];
    }
  }

  let importNewCount = 0;
  let importNeedsReviewCount = 0;
  let importReadyCount = 0;
  let alerts: SchoolAlert[] = [];

  if (user) {
    const [{ count: newCount }, { count: reviewCount }, { count: readyCount }, { data: alertsData }] = await Promise.all([
      supabase
        .from("import_inbox_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["new", "processing"]),
      supabase
        .from("import_inbox_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["needs_review", "error"]),
      supabase
        .from("import_inbox_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["recognized", "ready"]),
      supabase.from("school_alerts").select("*").eq("user_id", user.id).in("status", ["new", "seen"]),
    ]);
    importNewCount = newCount ?? 0;
    importNeedsReviewCount = reviewCount ?? 0;
    importReadyCount = readyCount ?? 0;
    alerts = (alertsData as SchoolAlert[] | null) ?? [];
  }

  const preparedTripsCount = new Set((itinerarySessionIds ?? []).map((r) => r.session_id)).size;

  const isThisYear = (dateStr: string | null) => !!dateStr && dateStr.startsWith(String(currentYear));
  const paymentsThisYear = (payments ?? []).filter((p) => isThisYear(p.paid_date) || isThisYear(p.due_date));
  const expensesThisYear = (expenses ?? []).filter((e) => isThisYear(e.expense_date));
  const expensesThisYearSums = sumByCurrency([
    ...(paymentsThisYear as { amount: number; currency: Currency | null }[]),
    ...(expensesThisYear as { amount: number; currency: Currency | null }[]),
  ]);

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
          <div className="flex flex-wrap items-center gap-2">
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
          <NextSessionCard
            session={
              nextSession
                ? {
                    ...nextSession,
                    segments: nextSessionSegments,
                    accommodations: nextSessionAccommodations,
                    semester: nextSessionSemester,
                  }
                : null
            }
          />

          {nextSession && (
            <NextSessionLogisticsCard
              sessionId={nextSession.id}
              segments={nextSessionSegments}
              accommodations={nextSessionAccommodations}
            />
          )}

          <SchoolSummaryCards
            nextSessionLabel={
              nextSession ? (nextSession.session_number ? `Zjazd ${nextSession.session_number}` : nextSession.title) : "Brak"
            }
            preparedTripsCount={preparedTripsCount}
            totalSessionsForTravel={sessions.length}
            expensesThisYearSums={expensesThisYearSums}
            calendarChangesCount={calendarChangesCount}
            calendarConnected={calendarConnected}
          />

          <CalendarChangesSummaryCard
            calendarConnected={calendarConnected}
            changes={dashboardChanges}
            totalCount={calendarChangesCount}
          />

          <div className="grid grid-cols-1 gap-5 min-[700px]:grid-cols-2">
            <ImportSummaryCard newCount={importNewCount} needsReviewCount={importNeedsReviewCount} readyCount={importReadyCount} />
            <AlertsSummaryCard alerts={alerts} />
          </div>
        </div>
      </div>
    </div>
  );
}
