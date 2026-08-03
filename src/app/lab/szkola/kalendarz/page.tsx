import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCalendarConnectionSummary } from "@/lib/szkola/calendarConnectionStatus";
import { isGoogleCalendarConfigured } from "@/lib/szkola/googleCalendar";
import SzkolaNav from "@/components/szkola/SzkolaNav";
import CalendarConnectionCard from "@/components/szkola/CalendarConnectionCard";
import CalendarBufferSettingsCard from "@/components/szkola/CalendarBufferSettingsCard";
import UnassignedCalendarEventsCard, { type UnassignedEventRow } from "@/components/szkola/UnassignedCalendarEventsCard";
import DetectedWeekendsCard from "@/components/szkola/DetectedWeekendsCard";
import { matchEventToSession } from "@/lib/szkola/calendarMatching";
import { buildWeekendDetection, type WeekendDetectionSummary } from "@/lib/szkola/calendarWeekendAutomation";
import {
  DEFAULT_CALENDAR_SETTINGS,
  type CalendarConnectionSummary,
  type SchoolCalendarSettings,
  type SchoolCalendarSyncRun,
  type SchoolSession,
} from "@/lib/szkola/types";

export const metadata: Metadata = { title: "Kalendarz" };

export default async function KalendarzSzkolaPage({
  searchParams,
}: {
  searchParams: Promise<{ calendar_error?: string }>;
}) {
  const { calendar_error: calendarError } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const googleConfigured = isGoogleCalendarConfigured();

  let connection: CalendarConnectionSummary | null = null;
  let adminConfigured = true;
  let eventsCount = 0;
  let pendingChangesCount = 0;
  let conflictsCount = 0;
  let latestSyncRun: SchoolCalendarSyncRun | null = null;
  let unassignedEvents: UnassignedEventRow[] = [];
  let sessions: SchoolSession[] = [];
  let settings: SchoolCalendarSettings = {
    id: "",
    user_id: user?.id ?? "",
    created_at: "",
    updated_at: "",
    ...DEFAULT_CALENDAR_SETTINGS,
  };
  let weekendDetection: WeekendDetectionSummary | null = null;

  if (user) {
    try {
      const lookup = await getCalendarConnectionSummary(user.id);
      connection = lookup.connection;
      adminConfigured = lookup.adminConfigured;

      const { data: settingsRow } = await supabase
        .from("school_calendar_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (settingsRow) settings = settingsRow as SchoolCalendarSettings;

      if (connection) {
        // Od tego miejsca w dół — zwykły klient (RLS "authenticated"), nie admin.
        // Klucz service_role jest potrzebny wyłącznie do tabeli connections
        // (jedynej bez polityki RLS dla ról anon/authenticated).
        const [{ count: eventsCountResult }, { count: pendingCountResult }, { count: conflictsCountResult }, { data: syncRuns }] =
          await Promise.all([
            supabase
              .from("school_calendar_events")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id)
              .is("deleted_at", null),
            supabase
              .from("school_calendar_changes")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("status", "new"),
            supabase
              .from("school_calendar_changes")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("status", "new")
              .eq("impact_level", "conflict"),
            supabase
              .from("school_calendar_sync_runs")
              .select("*")
              .eq("user_id", user.id)
              .order("started_at", { ascending: false })
              .limit(1),
          ]);
        eventsCount = eventsCountResult ?? 0;
        pendingChangesCount = pendingCountResult ?? 0;
        conflictsCount = conflictsCountResult ?? 0;
        latestSyncRun = (syncRuns as SchoolCalendarSyncRun[] | null)?.[0] ?? null;

        const { data: sessionsData } = await supabase.from("school_sessions").select("*");
        sessions = (sessionsData as SchoolSession[] | null) ?? [];

        weekendDetection = await buildWeekendDetection(supabase, user.id, settings.default_timezone);

        // "Wydarzenia do przypisania" pokazuje wyłącznie to, czego NIE obejmuje
        // sekcja "Wykryte weekendy szkoleniowe" (sekcja 8 specyfikacji): sieroty
        // poniedziałek-czwartek + pojedyncze/niepewne wydarzenia weekendowe.
        // Grupy o statusie "new_session"/"matched_existing" znikają stąd, bo
        // mają już własną, dedykowaną kartę z akcjami.
        const needsDecisionEvents = weekendDetection.groups.filter((g) => g.status === "needs_decision").flatMap((g) => g.events);
        const rawUnassigned = [...weekendDetection.manualReviewEvents, ...needsDecisionEvents].slice(0, 20);
        unassignedEvents = rawUnassigned.map((event) => {
          const match = matchEventToSession(event, sessions);
          return { id: event.id, title: event.title, location: event.location, start_at: event.start_at, suggestedSession: match ? match.session : null };
        });
      }
    } catch {
      // Strona kalendarza musi się renderować niezależnie od stanu bazy/konfiguracji —
      // brakująca tabela, sekret albo wiersz nie może wywalić całego widoku.
      connection = null;
      adminConfigured = true;
      eventsCount = 0;
      pendingChangesCount = 0;
      conflictsCount = 0;
      latestSyncRun = null;
      unassignedEvents = [];
      weekendDetection = null;
    }
  }

  return (
    <div className="lab-szkola-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-[32px] font-semibold leading-[1.1] text-[#201a2b]">
            Kalendarz
          </h1>
          <p className="mt-1.5 text-[13px] text-[#706878]">
            Synchronizacja z dedykowanym Google Calendar szkoły psychoterapii — raz w tygodniu automatycznie, albo
            ręcznie w każdej chwili.
          </p>
        </div>

        <div className="mt-6">
          <SzkolaNav />
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <CalendarConnectionCard
            googleConfigured={googleConfigured}
            adminConfigured={adminConfigured}
            connection={connection}
            eventsCount={eventsCount}
            pendingChangesCount={pendingChangesCount}
            conflictsCount={conflictsCount}
            latestSyncRun={latestSyncRun}
            calendarErrorCode={calendarError}
          />

          {connection && weekendDetection && <DetectedWeekendsCard detection={weekendDetection} sessions={sessions} />}

          {connection && <UnassignedCalendarEventsCard events={unassignedEvents} sessions={sessions} />}

          {connection && <CalendarBufferSettingsCard settings={settings} />}
        </div>
      </div>
    </div>
  );
}
