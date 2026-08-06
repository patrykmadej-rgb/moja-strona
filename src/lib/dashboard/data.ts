import "server-only";
import { createClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/lab/format";
import { buildDashboardAttentionItems } from "@/lib/dashboard/attention";
import { buildWeeklyPriorities } from "@/lib/dashboard/priorities";
import { selectActiveArticles } from "@/lib/dashboard/articles";
import { buildUpcomingDeadlines } from "@/lib/dashboard/deadlines";
import { buildRecentActivity } from "@/lib/dashboard/activity";
import { buildNextSessionData } from "@/lib/dashboard/nextSession";
import type { Article } from "@/lib/lab/types";
import type { Accommodation, SchoolAlert, SchoolSemester, SchoolSession, TravelSegment } from "@/lib/szkola/types";
import type { DashboardData, NextSessionData, SectionResult } from "@/lib/dashboard/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Nigdy nie rzuca — pojedyncze zapytanie, które się nie uda, nie może wywalić
 * reszty pulpitu (sekcja 16 briefu). `failed` mówi wywołującemu, czy
 * fallback jest "naprawdę pusty" czy "pusty, bo zapytanie padło" — sekcje
 * zależne od danej tabeli używają tego do ustawienia własnego komunikatu
 * błędu zamiast pokazywać mylący pusty stan.
 */
async function safeFetch<T>(promise: PromiseLike<{ data: T | null; error: unknown }>, fallback: T): Promise<{ data: T; failed: boolean }> {
  try {
    const { data, error } = await promise;
    if (error) return { data: fallback, failed: true };
    return { data: data ?? fallback, failed: false };
  } catch {
    return { data: fallback, failed: true };
  }
}

const GENERIC_ERROR = "Nie udało się wczytać danych tej sekcji.";

async function fetchRawData(supabase: SupabaseServerClient, userId: string) {
  const today = todayDateString();

  const [
    upcomingSessions,
    schoolAlerts,
    unassignedSegments,
    unassignedAccommodations,
    upcomingSegments,
    upcomingAccommodations,
    needsReviewImports,
    semesters,
    recentSegments,
    recentAccommodations,
    recentExpenses,
    recentAssignedImports,
    openTasks,
    articles,
    articleVersions,
    milestoneEvents,
    deadlineEvents,
  ] = await Promise.all([
    safeFetch<SchoolSession[]>(
      supabase.from("school_sessions").select("*").neq("status", "anulowany").gte("start_date", today).order("start_date", { ascending: true }).limit(5),
      [],
    ),
    safeFetch<SchoolAlert[]>(
      supabase.from("school_alerts").select("*").eq("user_id", userId).in("status", ["new", "seen"]).order("detected_at", { ascending: false }),
      [],
    ),
    safeFetch<{ id: string; departure_place: string | null; arrival_place: string | null; created_at: string }[]>(
      supabase.from("travel_segments").select("id, departure_place, arrival_place, created_at").is("session_id", null).order("created_at", { ascending: false }).limit(10),
      [],
    ),
    safeFetch<{ id: string; name: string; created_at: string }[]>(
      supabase.from("accommodations").select("id, name, created_at").is("session_id", null).order("created_at", { ascending: false }).limit(10),
      [],
    ),
    // "Nadchodzące terminy" (sekcja 9) — odcinki/noclegi z terminem w
    // przyszłości, ŚWIADOMIE osobne zapytanie od unassigned/recent powyżej:
    // te dwa filtrują po session_id/created_at, tu potrzebujemy dat podróży.
    safeFetch<{ id: string; departure_place: string | null; arrival_place: string | null; departure_date: string | null; departure_time: string | null; status: string }[]>(
      supabase
        .from("travel_segments")
        .select("id, departure_place, arrival_place, departure_date, departure_time, status")
        .gte("departure_date", today)
        .order("departure_date", { ascending: true })
        .limit(10),
      [],
    ),
    safeFetch<{ id: string; name: string; check_in: string | null; payment_status: string }[]>(
      supabase.from("accommodations").select("id, name, check_in, payment_status").gte("check_in", today).order("check_in", { ascending: true }).limit(10),
      [],
    ),
    safeFetch<{ id: string; original_filename: string | null; raw_email_subject: string | null; status: string; ocr_status: string | null; received_at: string }[]>(
      supabase
        .from("import_inbox_items")
        .select("id, original_filename, raw_email_subject, status, ocr_status, received_at")
        .eq("user_id", userId)
        .in("status", ["needs_review", "error"])
        .order("received_at", { ascending: false })
        .limit(10),
      [],
    ),
    safeFetch<SchoolSemester[]>(supabase.from("school_semesters").select("*"), []),
    safeFetch<{ id: string; departure_place: string | null; arrival_place: string | null; segment_type: string; created_at: string }[]>(
      supabase.from("travel_segments").select("id, departure_place, arrival_place, segment_type, created_at").order("created_at", { ascending: false }).limit(5),
      [],
    ),
    safeFetch<{ id: string; name: string; created_at: string }[]>(
      supabase.from("accommodations").select("id, name, created_at").order("created_at", { ascending: false }).limit(5),
      [],
    ),
    safeFetch<{ id: string; name: string; created_at: string }[]>(
      supabase.from("expenses").select("id, name, created_at").order("created_at", { ascending: false }).limit(5),
      [],
    ),
    safeFetch<{ id: string; reservation_type: string; provider: string | null; updated_at: string }[]>(
      supabase.from("imported_reservations").select("id, reservation_type, provider, updated_at").not("session_id", "is", null).order("updated_at", { ascending: false }).limit(5),
      [],
    ),
    safeFetch<{ id: string; session_id: string; title: string; due_date: string | null; is_done: boolean }[]>(
      supabase.from("session_tasks").select("id, session_id, title, due_date, is_done").not("due_date", "is", null).eq("is_done", false).order("due_date", { ascending: true }).limit(10),
      [],
    ),
    safeFetch<Article[]>(supabase.from("articles").select("*").order("updated_at", { ascending: false }), []),
    safeFetch<{ id: string; article_id: string; version_number: number; uploaded_at: string }[]>(
      supabase.from("article_versions").select("id, article_id, version_number, uploaded_at"),
      [],
    ),
    safeFetch<{ id: string; article_id: string; title: string; created_at: string }[]>(
      supabase.from("article_events").select("id, article_id, title, created_at").eq("event_type", "milestone").order("created_at", { ascending: false }).limit(5),
      [],
    ),
    safeFetch<{ id: string; article_id: string; title: string; event_date: string; is_completed: boolean }[]>(
      supabase.from("article_events").select("id, article_id, title, event_date, is_completed").eq("event_type", "deadline").eq("is_completed", false).order("event_date", { ascending: true }).limit(10),
      [],
    ),
  ]);

  return {
    upcomingSessions,
    schoolAlerts,
    unassignedSegments,
    unassignedAccommodations,
    upcomingSegments,
    upcomingAccommodations,
    needsReviewImports,
    semesters,
    recentSegments,
    recentAccommodations,
    recentExpenses,
    recentAssignedImports,
    openTasks,
    articles,
    articleVersions,
    milestoneEvents,
    deadlineEvents,
  };
}

async function fetchNextSessionDetails(
  supabase: SupabaseServerClient,
  session: SchoolSession,
): Promise<{ data: NextSessionData | null; failed: boolean }> {
  try {
    const [{ data: itinerary }, accommodationsRes, paymentsCountRes, expensesCountRes, scheduleRes, semesterRes] = await Promise.all([
      supabase.from("travel_itineraries").select("id").eq("session_id", session.id).maybeSingle(),
      supabase.from("accommodations").select("*").eq("session_id", session.id),
      supabase.from("school_payments").select("id", { count: "exact", head: true }).eq("session_id", session.id),
      supabase.from("expenses").select("id", { count: "exact", head: true }).eq("session_id", session.id),
      supabase.from("session_schedule_items").select("item_date, start_time, end_time").eq("session_id", session.id),
      session.semester_id ? supabase.from("school_semesters").select("*").eq("id", session.semester_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    let segments: TravelSegment[] = [];
    if (itinerary) {
      const { data: segmentsData } = await supabase.from("travel_segments").select("*").eq("itinerary_id", itinerary.id);
      segments = (segmentsData as TravelSegment[] | null) ?? [];
    }

    const data = buildNextSessionData({
      session,
      segments,
      accommodations: (accommodationsRes.data as Accommodation[] | null) ?? [],
      semester: (semesterRes.data as SchoolSemester | null) ?? null,
      costCount: (paymentsCountRes.count ?? 0) + (expensesCountRes.count ?? 0),
      scheduleItems: (scheduleRes.data as { item_date: string; start_time: string | null; end_time: string | null }[] | null) ?? [],
    });
    return { data, failed: false };
  } catch {
    return { data: null, failed: true };
  }
}

function section<T>(data: T, failed: boolean): SectionResult<T> {
  return { data, error: failed ? GENERIC_ERROR : null };
}

/**
 * Sekcja 15 briefu: jedna funkcja agregująca, równoległe zapytania, tylko
 * potrzebne kolumny, limity rekordów. Nigdy nie pobiera raw_text OCR, treści
 * wersji artykułów ani innych dużych pól.
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = await createClient();
  const raw = await fetchRawData(supabase, userId);

  const nextSession = raw.upcomingSessions.data[0]
    ? await fetchNextSessionDetails(supabase, raw.upcomingSessions.data[0])
    : { data: null, failed: false };

  const articleTitleById = new Map(raw.articles.data.map((a) => [a.id, a.title]));
  const versionCountByArticle = new Map<string, number>();
  for (const version of raw.articleVersions.data) {
    versionCountByArticle.set(version.article_id, (versionCountByArticle.get(version.article_id) ?? 0) + 1);
  }

  const attentionItems = buildDashboardAttentionItems({
    schoolAlerts: raw.schoolAlerts.data,
    unassignedSegments: raw.unassignedSegments.data,
    unassignedAccommodations: raw.unassignedAccommodations.data,
    needsReviewImports: raw.needsReviewImports.data,
    articles: raw.articles.data,
    articleVersionCounts: versionCountByArticle,
  });

  const activeArticles = selectActiveArticles(raw.articles.data);

  const upcomingDeadlines = buildUpcomingDeadlines({
    sessions: raw.upcomingSessions.data,
    segments: raw.upcomingSegments.data,
    accommodations: raw.upcomingAccommodations.data,
    semesters: raw.semesters.data,
    articles: raw.articles.data.map((a) => ({ id: a.id, title: a.title, deadline: a.deadline })),
    articleEvents: raw.deadlineEvents.data.map((e) => ({ ...e, article_title: articleTitleById.get(e.article_id) ?? "Artykuł" })),
    tasks: raw.openTasks.data,
  });

  const recentActivity = buildRecentActivity({
    newSegments: raw.recentSegments.data,
    newAccommodations: raw.recentAccommodations.data,
    newExpenses: raw.recentExpenses.data,
    newVersions: raw.articleVersions.data
      .slice()
      .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at))
      .slice(0, 5)
      .map((v) => ({ ...v, article_title: articleTitleById.get(v.article_id) ?? "Artykuł" })),
    statusChanges: raw.milestoneEvents.data.map((e) => ({ ...e, article_title: articleTitleById.get(e.article_id) ?? "Artykuł" })),
    paidSemesters: raw.semesters.data.filter((s) => s.payment_status === "oplacone").map((s) => ({ id: s.id, name: s.name, updated_at: s.updated_at })),
    assignedImports: raw.recentAssignedImports.data.map((r) => ({ id: r.id, label: r.provider ?? r.reservation_type, updated_at: r.updated_at })),
  });

  const weeklyPriorities = buildWeeklyPriorities({
    attentionItems,
    upcomingDeadlines,
    activeArticles,
  });

  return {
    attentionItems: section(attentionItems, raw.schoolAlerts.failed && raw.articles.failed),
    nextSession: section(nextSession.data, nextSession.failed),
    activeArticles: section(activeArticles, raw.articles.failed),
    upcomingDeadlines: section(upcomingDeadlines, raw.upcomingSessions.failed && raw.articles.failed),
    recentActivity: section(
      recentActivity,
      raw.recentSegments.failed && raw.recentAccommodations.failed && raw.recentExpenses.failed && raw.articleVersions.failed,
    ),
    weeklyPriorities: section(weeklyPriorities, false),
  };
}
