import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import LibraryExplorer from "@/components/lab/LibraryExplorer";
import type { LibraryBook, LibraryLoan } from "@/lib/lab/library-types";

export const metadata: Metadata = {
  title: "Biblioteka",
};

export default async function BibliotekaPage() {
  const supabase = await createClient();

  // RLS (migracja 022) ogranicza wynik do wierszy zalogowanego użytkownika
  // — brak dodatkowego filtra .eq("user_id", ...) jest celowy i spójny
  // z resztą /lab (patrz np. schowek/page.tsx, artykuly/page.tsx).
  const { data: books } = await supabase.from("library_books").select("*").order("created_at", { ascending: false });

  const { data: loans } = await supabase.from("library_loans").select("*").order("loaned_at", { ascending: false });

  return (
    <div className="min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <LibraryExplorer books={(books as LibraryBook[] | null) ?? []} loans={(loans as LibraryLoan[] | null) ?? []} />
      </div>
    </div>
  );
}
