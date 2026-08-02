"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IconFileText } from "@tabler/icons-react";
import ArticleTableRow, { TABLE_GRID_COLS } from "@/components/lab/ArticleTableRow";
import ArticlesPagination from "@/components/lab/ArticlesPagination";
import EmptyState from "@/components/lab/EmptyState";
import type { Article, LatestArticleVersion } from "@/lib/lab/types";

const PAGE_SIZE = 10;

export default function ArticlesTable({
  articles,
  hasAnyArticles,
  latestVersions,
}: {
  articles: Article[];
  hasAnyArticles: boolean;
  latestVersions: Record<string, LatestArticleVersion>;
}) {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageArticles = useMemo(
    () => articles.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [articles, safePage],
  );

  const rangeStart = articles.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, articles.length);

  return (
    <div className="rounded-[14px] border border-[#e8e2ec] bg-white/95 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      {articles.length > 0 && (
        <div
          className={`hidden min-[900px]:grid min-[900px]:h-11 min-[900px]:items-center min-[900px]:gap-4 min-[900px]:border-b min-[900px]:border-[#e8e2ec] min-[900px]:bg-[#fbfafc] min-[900px]:px-4 min-[900px]:text-[11px] min-[900px]:font-semibold min-[900px]:text-[#62596b] ${TABLE_GRID_COLS}`}
        >
          <span>Tytuł</span>
          <span>Status</span>
          <span className="hidden min-[1200px]:block">Ostatnia aktualizacja</span>
          <span>Ostatnia wersja</span>
          <span>ChatGPT</span>
          <span />
        </div>
      )}

      {articles.length === 0 ? (
        <div className="px-6 py-4">
          {hasAnyArticles ? (
            <EmptyState
              icon={IconFileText}
              title="Nie znaleziono artykułów"
              subtitle="Spróbuj zmienić filtry lub utwórz nowy artykuł."
              action={{
                label: "Dodaj artykuł",
                onClick: () => router.push("/lab/artykuly/nowy"),
              }}
            />
          ) : (
            <EmptyState
              icon={IconFileText}
              title="Nie dodano jeszcze artykułów"
              subtitle="Utwórz pierwszy rekord i rozpocznij pracę naukową."
              action={{
                label: "Dodaj pierwszy artykuł",
                onClick: () => router.push("/lab/artykuly/nowy"),
              }}
            />
          )}
        </div>
      ) : (
        <>
          {pageArticles.map((article, i) => (
            <ArticleTableRow
              key={article.id}
              article={article}
              isLast={i === pageArticles.length - 1}
              latestVersion={latestVersions[article.id] ?? null}
            />
          ))}
          <ArticlesPagination
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            total={articles.length}
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
