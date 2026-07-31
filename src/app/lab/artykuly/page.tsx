import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ArticlesPageHeader from "@/components/lab/ArticlesPageHeader";
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
    <div className="lab-articles-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <ArticlesPageHeader />
        <div className="mt-6">
          <ArticlesExplorer articles={(articles as Article[] | null) ?? []} />
        </div>
      </div>
    </div>
  );
}
