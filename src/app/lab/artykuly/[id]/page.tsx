import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ArticleWorkspace from "@/components/lab/ArticleWorkspace";
import type { Article, ArticleSource, ArticleVersion } from "@/lib/lab/types";

const VERSIONS_BUCKET = "article-versions";
const SIGNED_URL_TTL_SECONDS = 300;

export const metadata: Metadata = {
  title: "Artykuł",
};

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!article) notFound();

  const [{ data: versionsData }, { data: sourcesData }] = await Promise.all([
    supabase
      .from("article_versions")
      .select("*")
      .eq("article_id", id)
      .order("version_number", { ascending: false }),
    supabase
      .from("article_sources")
      .select("*")
      .eq("article_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const rawVersions = (versionsData as ArticleVersion[] | null) ?? [];

  const versions = await Promise.all(
    rawVersions.map(async (version) => {
      let signedUrl: string | null = null;
      if (version.file_path) {
        const { data } = await supabase.storage
          .from(VERSIONS_BUCKET)
          .createSignedUrl(version.file_path, SIGNED_URL_TTL_SECONDS);
        signedUrl = data?.signedUrl ?? null;
      }
      return { ...version, signedUrl };
    }),
  );

  return (
    <ArticleWorkspace
      article={article as Article}
      versions={versions}
      sources={(sourcesData as ArticleSource[] | null) ?? []}
    />
  );
}
