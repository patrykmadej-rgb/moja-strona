"use client";

import { useState } from "react";
import ArticleHeader from "@/components/lab/ArticleHeader";
import ArticleTabs, { type TabKey } from "@/components/lab/ArticleTabs";
import ArticleOverview from "@/components/lab/ArticleOverview";
import EditArticleForm from "@/components/lab/EditArticleForm";
import VersionsTab from "@/components/lab/VersionsTab";
import SourcesTab from "@/components/lab/SourcesTab";
import ScheduleTab from "@/components/lab/ScheduleTab";
import NotesTab from "@/components/lab/NotesTab";
import FilesTab from "@/components/lab/FilesTab";
import EmptyState from "@/components/lab/EmptyState";
import { IconSquareCheck } from "@tabler/icons-react";
import type { ArticleFile } from "@/lib/article-files";
import type { Article, ArticleEvent, ArticleNote, ArticleSource, ArticleVersion } from "@/lib/lab/types";

export default function ArticleWorkspace({
  article,
  versions,
  sources,
  events,
  notes,
  files,
}: {
  article: Article;
  versions: (ArticleVersion & { signedUrl: string | null })[];
  sources: ArticleSource[];
  events: ArticleEvent[];
  notes: ArticleNote[];
  files: ArticleFile[];
}) {
  const [tab, setTab] = useState<TabKey>("przeglad");
  const [editing, setEditing] = useState(false);

  const latestVersion = versions[0] ?? null;

  return (
    <div className="lab-article-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        {editing ? (
          <div>
            <h1 className="font-[family-name:var(--font-cormorant)] text-[22px] font-semibold text-[#5b2a86]">
              Edytuj artykuł
            </h1>
            <div className="mt-4 rounded-[14px] border border-[#e8e2ec] bg-white/95 p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
              <EditArticleForm article={article} onCancel={() => setEditing(false)} />
            </div>
          </div>
        ) : (
          <>
            <ArticleHeader article={article} onEdit={() => setEditing(true)} />

            <div className="mt-6">
              <ArticleTabs tab={tab} onChange={setTab} />
            </div>

            <div className="mt-6">
              {tab === "przeglad" && (
                <ArticleOverview
                  article={article}
                  latestVersion={latestVersion}
                  versionsCount={versions.length}
                  sourcesCount={sources.length}
                  events={events}
                  onNavigateTab={setTab}
                />
              )}
              {tab === "wersje" && <VersionsTab articleId={article.id} versions={versions} />}
              {tab === "zrodla" && <SourcesTab articleId={article.id} sources={sources} />}
              {tab === "harmonogram" && <ScheduleTab articleId={article.id} events={events} />}
              {tab === "notatki" && <NotesTab articleId={article.id} notes={notes} />}
              {tab === "zadania" && (
                <div className="rounded-[14px] border border-[#e8e2ec] bg-white/95 p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
                  <EmptyState
                    icon={IconSquareCheck}
                    title="Zadania pojawią się wkrótce"
                    subtitle="Ta funkcja jest w przygotowaniu."
                  />
                </div>
              )}
              {tab === "pliki" && <FilesTab articleId={article.id} files={files} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
