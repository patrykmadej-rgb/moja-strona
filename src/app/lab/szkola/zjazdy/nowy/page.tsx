import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SessionForm from "@/components/szkola/SessionForm";
import { createSession } from "@/app/lab/szkola/zjazdy/actions";
import { createClient } from "@/lib/supabase/server";
import type { SchoolSemester } from "@/lib/szkola/types";

export const metadata: Metadata = {
  title: "Nowy zjazd",
};

export default async function NowyZjazdPage() {
  const supabase = await createClient();
  const { data: semestersData } = await supabase.from("school_semesters").select("*").order("start_date", { ascending: false });
  const semesters = (semestersData as SchoolSemester[] | null) ?? [];

  return (
    <div className="lab-szkola-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[760px] px-8 pt-9 pb-16">
        <Link
          href="/lab/szkola/zjazdy"
          className="flex items-center gap-1.5 text-sm text-[#706878] transition-colors hover:text-[#5b2a86]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          Powrót do zjazdów
        </Link>

        <h1 className="mt-4 font-[family-name:var(--font-cormorant)] text-[28px] font-semibold text-[#201a2b]">
          Dodaj zjazd
        </h1>

        <div className="mt-6 rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <SessionForm semesters={semesters} action={createSession} submitLabel="Dodaj zjazd" pendingLabel="Dodawanie…" />
        </div>
      </div>
    </div>
  );
}
