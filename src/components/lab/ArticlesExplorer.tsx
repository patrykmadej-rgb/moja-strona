"use client";

import { useMemo, useState } from "react";
import ArticleStatusFilterBar, { type StatusFilterValue } from "@/components/lab/ArticleStatusFilterBar";
import ArticlesToolbar, { type SortKey } from "@/components/lab/ArticlesToolbar";
import ArticlesTable from "@/components/lab/ArticlesTable";
import { ARTICLE_STATUSES, type Article, type ArticleStatus, type LatestArticleVersion } from "@/lib/lab/types";

export default function ArticlesExplorer({
  articles,
  latestVersions,
}: {
  articles: Article[];
  latestVersions: Record<string, LatestArticleVersion>;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("updated_desc");

  const counts = useMemo(() => {
    const result = Object.fromEntries(ARTICLE_STATUSES.map((status) => [status, 0])) as Record<
      ArticleStatus,
      number
    >;
    for (const article of articles) {
      result[article.status] = (result[article.status] ?? 0) + 1;
    }
    return result;
  }, [articles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = statusFilter === "all" ? articles : articles.filter((a) => a.status === statusFilter);
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
  }, [articles, statusFilter, query, sort]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <ArticleStatusFilterBar
          active={statusFilter}
          counts={counts}
          total={articles.length}
          onChange={setStatusFilter}
        />
        <ArticlesToolbar query={query} onQueryChange={setQuery} sort={sort} onSortChange={setSort} />
      </div>

      <ArticlesTable articles={filtered} hasAnyArticles={articles.length > 0} latestVersions={latestVersions} />
    </div>
  );
}
