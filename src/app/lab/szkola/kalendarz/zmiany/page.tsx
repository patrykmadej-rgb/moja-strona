import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import CalendarChangesExplorer, { type CalendarChangeRow } from "@/components/szkola/CalendarChangesExplorer";
import type { SchoolSession } from "@/lib/szkola/types";

export const metadata: Metadata = { title: "Zmiany w kalendarzu" };

export default async function KalendarzZmianyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let changes: CalendarChangeRow[] = [];
  let sessions: SchoolSession[] = [];

  if (user) {
    const [{ data: changesData }, { data: sessionsData }] = await Promise.all([
      supabase
        .from("school_calendar_changes")
        .select(
          "id, change_type, field_name, old_value, new_value, detected_at, status, impact_level, impact_summary, session_id, calendar_event:school_calendar_events(google_event_id, html_link, title), session:school_sessions(id, title, session_number)",
        )
        .eq("user_id", user.id)
        .order("detected_at", { ascending: false })
        .limit(500),
      supabase.from("school_sessions").select("*").order("start_date", { ascending: false }),
    ]);

    changes = (changesData as unknown as CalendarChangeRow[] | null) ?? [];
    sessions = (sessionsData as SchoolSession[] | null) ?? [];
  }

  return (
    <div className="lab-szkola-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <div>
          <Link href="/lab/szkola/kalendarz" className="flex items-center gap-1.5 text-xs text-[#706878] hover:text-[#5b2a86]">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
            Kalendarz
          </Link>
          <h1 className="mt-2 font-[family-name:var(--font-cormorant)] text-[32px] font-semibold leading-[1.1] text-[#201a2b]">
            Zmiany w kalendarzu
          </h1>
          <p className="mt-1.5 text-[13px] text-[#706878]">
            Wszystkie wykryte zmiany wydarzeń Google Calendar — nowe, przejrzane, zignorowane i konflikty.
          </p>
        </div>

        <div className="mt-6">
          <CalendarChangesExplorer changes={changes} sessions={sessions} />
        </div>
      </div>
    </div>
  );
}
