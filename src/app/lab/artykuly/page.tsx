import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ArticlesPageHeader from "@/components/lab/ArticlesPageHeader";
import ArticlesExplorer from "@/components/lab/ArticlesExplorer";
import type { Article, LatestArticleVersion } from "@/lib/lab/types";

const VERSIONS_BUCKET = "article-versions";
const SIGNED_URL_TTL_SECONDS = 600;

export const metadata: Metadata = {
  title: "Artykuły",
};

export default async function ArtykulyPage() {
  const supabase = await createClient();

  const [{ data: articles }, { data: versions }] = await Promise.all([
    supabase.from("articles").select("*").order("updated_at", { ascending: false }),
    // Jedno zapytanie o wszystkie wersje zamiast N+1 per artykuł — redukowane
    // niżej do najnowszej wersji na artykuł (po version_number, ten sam
    // porządek co w VersionsTab/page.tsx widoku pojedynczego artykułu).
    supabase
      .from("article_versions")
      .select("article_id, version_number, file_path, file_name")
      .order("version_number", { ascending: false }),
  ]);

  const latestVersions: Record<string, LatestArticleVersion> = {};
  for (const version of versions ?? []) {
    if (!latestVersions[version.article_id]) {
      latestVersions[version.article_id] = {
        version_number: version.version_number,
        file_path: version.file_path,
        file_name: version.file_name,
        signed_url: null,
      };
    }
  }

  // Podpisujemy WSZYSTKIE najnowsze wersje jednym zbiorczym wywołaniem
  // (createSignedUrls), zamiast osobnego podpisywania przy każdym kliknięciu —
  // to też omija realny problem: window.open() wywołane PO await (po
  // odpowiedzi sieciowej) bywa w Chromium traktowane jako spoza zaufanego
  // gestu użytkownika i cicho nie nawiguje otwartej karty. Link z gotowym,
  // podpisanym URL-em (jak "Otwórz chat") działa niezawodnie.
  const pathsToSign = Object.values(latestVersions)
    .map((v) => v.file_path)
    .filter((p): p is string => Boolean(p));

  if (pathsToSign.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from(VERSIONS_BUCKET)
      .createSignedUrls(pathsToSign, SIGNED_URL_TTL_SECONDS, { download: true });

    const signedUrlByPath = new Map((signedUrls ?? []).map((s) => [s.path, s.signedUrl]));
    for (const version of Object.values(latestVersions)) {
      if (version.file_path) {
        version.signed_url = signedUrlByPath.get(version.file_path) ?? null;
      }
    }
  }

  return (
    <div className="lab-articles-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <ArticlesPageHeader />
        <div className="mt-6">
          <ArticlesExplorer articles={(articles as Article[] | null) ?? []} latestVersions={latestVersions} />
        </div>
      </div>
    </div>
  );
}
