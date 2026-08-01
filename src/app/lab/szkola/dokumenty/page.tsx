import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import SzkolaNav from "@/components/szkola/SzkolaNav";
import DocumentsExplorer from "@/components/szkola/DocumentsExplorer";
import type { SchoolSession, SessionDocument } from "@/lib/szkola/types";

export const metadata: Metadata = { title: "Dokumenty" };

export default async function DokumentySzkolaPage() {
  const supabase = await createClient();

  const [{ data: sessionsData }, { data: documentsData }] = await Promise.all([
    supabase.from("school_sessions").select("*").order("start_date", { ascending: false }),
    supabase.from("session_documents").select("*").order("created_at", { ascending: false }),
  ]);

  const sessions = (sessionsData as SchoolSession[] | null) ?? [];
  const documents = (documentsData as SessionDocument[] | null) ?? [];

  return (
    <div className="lab-szkola-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-[32px] font-semibold leading-[1.1] text-[#201a2b]">
            Dokumenty
          </h1>
          <p className="mt-1.5 text-[13px] text-[#706878]">
            Bilety, rezerwacje, faktury i zaświadczenia ze wszystkich zjazdów.
          </p>
        </div>
        <div className="mt-6">
          <SzkolaNav />
        </div>
        <div className="mt-6">
          <DocumentsExplorer sessions={sessions} documents={documents} />
        </div>
      </div>
    </div>
  );
}
