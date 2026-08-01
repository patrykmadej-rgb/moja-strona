import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import SzkolaNav from "@/components/szkola/SzkolaNav";
import ImportIntakeForms from "@/components/szkola/ImportIntakeForms";
import ImportInboxExplorer, { type ImportListRow } from "@/components/szkola/ImportInboxExplorer";
import type { Currency, ImportDetectedType, ImportStatus, SchoolSession } from "@/lib/szkola/types";

export const metadata: Metadata = { title: "Skrzynka importu" };

type InboxRow = {
  id: string;
  status: ImportStatus;
  detected_type: ImportDetectedType | null;
  confidence_score: number | null;
  original_filename: string | null;
  raw_email_subject: string | null;
  sender_name: string | null;
  received_at: string;
  imported_reservations: {
    id: string;
    session_id: string | null;
    amount: number | null;
    currency: Currency | null;
    session: { title: string } | null;
  }[];
};

export default async function ImportSzkolaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let items: ImportListRow[] = [];
  let sessions: SchoolSession[] = [];

  if (user) {
    const [{ data: inboxData }, { data: sessionsData }] = await Promise.all([
      supabase
        .from("import_inbox_items")
        .select(
          "id, status, detected_type, confidence_score, original_filename, raw_email_subject, sender_name, received_at, imported_reservations(id, session_id, amount, currency, session:school_sessions(title))",
        )
        .eq("user_id", user.id)
        .order("received_at", { ascending: false }),
      supabase.from("school_sessions").select("*").order("start_date", { ascending: false }),
    ]);

    sessions = (sessionsData as SchoolSession[] | null) ?? [];
    items = ((inboxData as unknown as InboxRow[] | null) ?? []).map((row) => {
      const reservation = row.imported_reservations?.[0] ?? null;
      return {
        id: row.id,
        status: row.status,
        detectedType: row.detected_type,
        confidenceScore: row.confidence_score,
        originalFilename: row.original_filename,
        rawEmailSubject: row.raw_email_subject,
        senderName: row.sender_name,
        receivedAt: row.received_at,
        sessionId: reservation?.session_id ?? null,
        sessionTitle: reservation?.session?.title ?? null,
        amount: reservation?.amount ?? null,
        currency: reservation?.currency ?? null,
      };
    });
  }

  return (
    <div className="lab-szkola-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-[32px] font-semibold leading-[1.1] text-[#201a2b]">
            Import rezerwacji i dokumentów
          </h1>
          <p className="mt-1.5 text-[13px] text-[#706878]">
            Prześlij potwierdzenie lotu, hotelu, płatności albo wiadomość organizacyjną. System rozpozna dane i pozwoli
            przypisać je do właściwego zjazdu.
          </p>
        </div>

        <div className="mt-6">
          <SzkolaNav />
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <ImportIntakeForms />
          <ImportInboxExplorer items={items} sessions={sessions} />
        </div>
      </div>
    </div>
  );
}
