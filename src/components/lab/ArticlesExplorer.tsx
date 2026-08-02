"use client";

import { useMemo, useState } from "react";
import ArticlesSummaryCards from "@/components/lab/ArticlesSummaryCards";
import ArticleStatusTabs from "@/components/lab/ArticleStatusTabs";
import ArticlesToolbar, { type SortKey } from "@/components/lab/ArticlesToolbar";
import ArticlesTable from "@/components/lab/ArticlesTable";
import { BUCKETS, matchesBucket, type BucketKey } from "@/lib/lab/articleBuckets";
import type { Article, ArticleStatus, LatestArticleVersion } from "@/lib/lab/types";

export default function ArticlesExplorer({
  articles,
  latestVersions,
}: {
  articles: Article[];
  latestVersions: Record<string, LatestArticleVersion>;
}) {
  const [bucket, setBucket] = useState<BucketKey>("wszystkie");
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | "">("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("updated_desc");

  const counts = useMemo(() => {
    const result: Record<BucketKey, number> = {
      wszystkie: articles.length,
      w_trakcie: 0,
      wyslane: 0,
      opublikowane: 0,
    };
    for (const article of articles) {
      for (const key of Object.keys(BUCKETS) as (keyof typeof BUCKETS)[]) {
        if (matchesBucket(article.status, key)) result[key] += 1;
      }
    }
    return result;
  }, [articles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = articles.filter((a) => matchesBucket(a.status, bucket));
    if (statusFilter) list = list.filter((a) => a.status === statusFilter);
    if (q) list = list.filter((a) => a.title.toLowerCase().includes(q));

    list = [...list].sort((a, b) => {
      if (sort === "title_asc") return a.title.localeCompare(b.title, "pl");
      if (sort === "deadline_asc") {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      }
      return b.updated_at.localeCompare(a.updated_at);
    });

    return list;
  }, [articles, bucket, statusFilter, query, sort]);

  return (
    <div className="flex flex-col gap-5">
      <ArticlesSummaryCards counts={counts} activeBucket={bucket} onSelect={setBucket} />

      <div className="flex flex-col gap-3">
        <ArticleStatusTabs active={bucket} counts={counts} onChange={setBucket} />
        <ArticlesToolbar
          query={query}
          onQueryChange={setQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sort={sort}
          onSortChange={setSort}
        />
      </div>

      <ArticlesTable articles={filtered} hasAnyArticles={articles.length > 0} latestVersions={latestVersions} />
    </div>
  );
}
