import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import SzkolaNav from "@/components/szkola/SzkolaNav";
import AccommodationsExplorer from "@/components/szkola/AccommodationsExplorer";
import type { Accommodation, SchoolSession } from "@/lib/szkola/types";

export const metadata: Metadata = { title: "Zakwaterowanie" };

export default async function ZakwaterowanieSzkolaPage() {
  const supabase = await createClient();

  const [{ data: accommodationsData }, { data: sessionsData }] = await Promise.all([
    supabase.from("accommodations").select("*").order("check_in", { ascending: true }),
    supabase.from("school_sessions").select("*").order("start_date", { ascending: false }),
  ]);

  const sessions = (sessionsData as SchoolSession[] | null) ?? [];
  const accommodations = (accommodationsData as Accommodation[] | null) ?? [];

  return (
    <div className="lab-szkola-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-[32px] font-semibold leading-[1.1] text-[#201a2b]">
            Zakwaterowanie
          </h1>
          <p className="mt-1.5 text-[13px] text-[#706878]">
            Zbiorczy widok noclegów ze wszystkich zjazdów — dodawaj rezerwacje bez otwierania konkretnego zjazdu.
          </p>
        </div>

        <div className="mt-6">
          <SzkolaNav />
        </div>

        <div className="mt-6">
          <AccommodationsExplorer accommodations={accommodations} sessions={sessions} />
        </div>
      </div>
    </div>
  );
}
