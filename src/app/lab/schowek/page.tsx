import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ClipboardExplorer from "@/components/lab/ClipboardExplorer";
import type { ClipboardItem } from "@/lib/lab/clipboard-types";

export const metadata: Metadata = {
  title: "Schowek",
};

export default async function SchowekPage() {
  const supabase = await createClient();

  // RLS (migracja 021) i tak ogranicza wynik do wpisów zalogowanego
  // użytkownika — brak dodatkowego filtra .eq("user_id", ...) jest tu
  // celowy i spójny z resztą /lab (patrz np. articles w artykuly/page.tsx).
  const { data: items } = await supabase
    .from("clipboard_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  return (
    <div className="min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <ClipboardExplorer items={(items as ClipboardItem[] | null) ?? []} />
      </div>
    </div>
  );
}
