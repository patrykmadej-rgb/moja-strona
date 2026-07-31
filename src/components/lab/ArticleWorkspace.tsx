"use client";

import { useState } from "react";
import Link from "next/link";
import { IconLock } from "@tabler/icons-react";
import StatusTag from "@/components/lab/StatusTag";
import EditArticleForm from "@/components/lab/EditArticleForm";
import OverviewTab from "@/components/lab/OverviewTab";
import VersionsTab from "@/components/lab/VersionsTab";
import SourcesTab from "@/components/lab/SourcesTab";
import { formatDate } from "@/lib/lab/format";
import type { Article, ArticleSource, ArticleVersion } from "@/lib/lab/types";

type TabKey = "przeglad" | "wersje" | "zrodla" | "harmonogram" | "notatki" | "pliki";

const TABS: { key: TabKey; label: string; enabled: boolean }[] = [
  { key: "przeglad", label: "Przegląd", enabled: true },
  { key: "wersje", label: "Wersje", enabled: true },
  { key: "zrodla", label: "Źródła", enabled: true },
  { key: "harmonogram", label: "Harmonogram", enabled: false },
  { key: "notatki", label: "Notatki", enabled: false },
  { key: "pliki", label: "Pliki", enabled: false },
];

export default function ArticleWorkspace({
  article,
  versions,
  sources,
}: {
  article: Article;
  versions: (ArticleVersion & { signedUrl: string | null })[];
  sources: ArticleSource[];
}) {
  const [tab, setTab] = useState<TabKey>("przeglad");
  const [editing, setEditing] = useState(false);

  const latestVersion = versions[0] ?? null;

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <Link href="/lab/artykuly" className="text-sm text-[#4A3360] hover:text-[#4A1D6E]">
        ← Powrót do listy
      </Link>

      {editing ? (
        <div className="mt-4">
          <h1
            className="font-[family-name:var(--font-cormorant)] text-[22px] font-semibold text-[#4A1D6E]"
          >
            Edytuj artykuł
          </h1>
          <div className="mt-4">
            <EditArticleForm article={article} onCancel={() => setEditing(false)} />
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-start justify-between gap-4">
            <h1
              className="font-[family-name:var(--font-cormorant)] text-[26px] font-semibold text-[#4A1D6E]"
            >
              {article.title}
            </h1>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="shrink-0 border border-[#4A1D6E]/30 px-4 py-2 text-sm font-medium text-[#4A1D6E] hover:border-[#4A1D6E]/60"
            >
              Edytuj artykuł
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <StatusTag status={article.status} />
            {article.is_private && (
              <span className="flex items-center gap-1 text-xs text-[#4A3360]">
                <IconLock className="h-3.5 w-3.5" stroke={1.75} />
                Utajniony projekt
              </span>
            )}
            <span className="text-xs text-[#4A3360]">
              Utworzono {formatDate(article.created_at)} · Aktualizacja {formatDate(article.updated_at)}
            </span>
          </div>

          <div className="mt-6 flex gap-6 border-b-[0.5px] border-[#4A1D6E]/20">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={
                  tab === t.key
                    ? "border-b-2 border-[#4A1D6E] px-1 pb-2 text-sm font-medium text-[#4A1D6E]"
                    : t.enabled
                      ? "px-1 pb-2 text-sm text-[#4A3360] hover:text-[#4A1D6E]"
                      : "px-1 pb-2 text-sm text-[#4A3360]/50"
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {tab === "przeglad" && (
              <OverviewTab
                article={article}
                latestVersion={latestVersion}
                versionsCount={versions.length}
                sourcesCount={sources.length}
                onNavigateTab={setTab}
              />
            )}
            {tab === "wersje" && <VersionsTab articleId={article.id} versions={versions} />}
            {tab === "zrodla" && <SourcesTab articleId={article.id} sources={sources} />}
            {(tab === "harmonogram" || tab === "notatki" || tab === "pliki") && (
              <div className="border border-[#4A1D6E]/15 bg-white px-6 py-14 text-center">
                <p className="text-sm text-[#4A3360]">Ta funkcja pojawi się wkrótce.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
