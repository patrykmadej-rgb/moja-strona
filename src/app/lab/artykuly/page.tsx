import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ArticlesExplorer from "@/components/lab/ArticlesExplorer";
import type { Article } from "@/lib/lab/types";

export const metadata: Metadata = {
  title: "Artykuły",
};

export default async function ArtykulyPage() {
  const supabase = await createClient();
  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="font-[family-name:var(--font-cormorant)] text-[22px] font-semibold text-[#1C1028]"
          >
            Artykuły naukowe
          </h1>
          <p className="mt-1 text-xs text-[#4A3360]">
            Zarządzaj artykułami i śledź postępy prac
          </p>
        </div>
        <Link
          href="/lab/artykuly/nowy"
          className="shrink-0 bg-[#4A1D6E] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#4A2073]"
        >
          + Dodaj artykuł
        </Link>
      </div>

      <ArticlesExplorer articles={(articles as Article[] | null) ?? []} />
    </div>
  );
}
