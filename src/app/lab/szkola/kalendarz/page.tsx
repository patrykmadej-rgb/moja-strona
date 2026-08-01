import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isGoogleCalendarConfigured } from "@/lib/szkola/googleCalendar";
import SzkolaNav from "@/components/szkola/SzkolaNav";
import CalendarConnectionCard from "@/components/szkola/CalendarConnectionCard";
import CalendarBufferSettingsCard from "@/components/szkola/CalendarBufferSettingsCard";
import UnassignedCalendarEventsCard, { type UnassignedEventRow } from "@/components/szkola/UnassignedCalendarEventsCard";
import { matchEventToSession } from "@/lib/szkola/calendarMatching";
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

  if (user) {
    const admin = createAdminClient();

    const { data: connectionRow } = await admin
      .from("school_calendar_connections")
      .select(
        "id, connection_type, calendar_id, calendar_name, calendar_color, masked_ics_url, sync_enabled, sync_frequency, last_synced_at, next_sync_at, last_successful_fetch_at, last_http_status, last_error, created_at",
      )
      .eq("user_id", user.id)
      .eq("provider", "google")
      .maybeSingle();
    connection = (connectionRow as CalendarConnectionSummary | null) ?? null;

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

      const [{ data: unassignedData }, { data: sessionsData }] = await Promise.all([
        supabase
          .from("school_calendar_events")
          .select("id, title, location, start_at, end_at")
          .eq("user_id", user.id)
          .is("session_id", null)
          .is("deleted_at", null)
          .eq("ignored", false)
          .neq("status", "cancelled")
          .order("start_at", { ascending: true })
          .limit(20),
        supabase.from("school_sessions").select("*"),
      ]);
      sessions = (sessionsData as SchoolSession[] | null) ?? [];
      const rawUnassigned =
        (unassignedData as
          | { id: string; title: string | null; location: string | null; start_at: string | null; end_at: string | null }[]
          | null) ?? [];
      unassignedEvents = rawUnassigned.map((event) => {
        const match = matchEventToSession(event, sessions);
        return { ...event, suggestedSession: match ? match.session : null };
      });
    }

    const { data: settingsRow } = await supabase
      .from("school_calendar_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (settingsRow) settings = settingsRow as SchoolCalendarSettings;
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
            connection={connection}
            eventsCount={eventsCount}
            pendingChangesCount={pendingChangesCount}
            conflictsCount={conflictsCount}
            latestSyncRun={latestSyncRun}
            calendarErrorCode={calendarError}
          />

          {connection && <UnassignedCalendarEventsCard events={unassignedEvents} sessions={sessions} />}

          {connection && <CalendarBufferSettingsCard settings={settings} />}
        </div>
      </div>
    </div>
  );
}
