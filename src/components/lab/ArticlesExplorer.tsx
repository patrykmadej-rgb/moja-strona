"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { IconDots } from "@tabler/icons-react";
import StatusTag from "@/components/lab/StatusTag";
import { deleteArticle } from "@/app/lab/artykuly/actions";
import { formatDate } from "@/lib/lab/format";
import {
  ARTICLE_STATUSES,
  ARTICLE_STATUS_LABELS,
  type Article,
  type ArticleStatus,
} from "@/lib/lab/types";

type BucketKey = "wszystkie" | "w_trakcie" | "wyslane" | "opublikowane";

const BUCKETS: Record<Exclude<BucketKey, "wszystkie">, ArticleStatus[]> = {
  w_trakcie: ["pomysl", "pisanie"],
  wyslane: ["do_wyslania", "w_redakcji", "recenzja", "poprawki", "przyjety"],
  opublikowane: ["opublikowany"],
};

const BUCKET_LABELS: Record<BucketKey, string> = {
  wszystkie: "Wszystkie",
  w_trakcie: "W trakcie",
  wyslane: "Wysłane",
  opublikowane: "Opublikowane",
};

function matchesBucket(status: ArticleStatus, bucket: BucketKey): boolean {
  if (bucket === "wszystkie") return true;
  return BUCKETS[bucket].includes(status);
}

function RowMenu({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu artykułu"
        className="px-2 py-1 text-[#4A3360] hover:text-[#1C1028]"
      >
        <IconDots className="h-4 w-4" stroke={1.75} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-40 border border-[#4A1D6E]/15 bg-white shadow-sm">
            <Link
              href={`/lab/artykuly/${id}`}
              className="block px-3 py-2 text-sm text-[#1C1028] hover:bg-[#EDE6F8]"
            >
              Otwórz
            </Link>
            <form
              action={deleteArticle}
              onSubmit={(e) => {
                if (!confirm(`Usunąć artykuł „${title}”? Tej operacji nie można cofnąć.`)) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={id} />
              <button
                type="submit"
                className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Usuń
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default function ArticlesExplorer({ articles }: { articles: Article[] }) {
  const [bucket, setBucket] = useState<BucketKey>("wszystkie");
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | "">("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"updated_desc" | "title_asc" | "deadline_asc">(
    "updated_desc",
  );

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
    <div>
      <div className="mt-6 flex flex-wrap gap-2">
        {(Object.keys(BUCKET_LABELS) as BucketKey[]).map((key) => {
          const active = bucket === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setBucket(key)}
              className={
                active
                  ? "bg-[#4A1D6E] px-3 py-1.5 text-sm text-white"
                  : "border border-[#4A1D6E]/25 bg-white px-3 py-1.5 text-sm text-[#4A3360] hover:border-[#4A1D6E]/50"
              }
            >
              {BUCKET_LABELS[key]} ({counts[key]})
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj po tytule…"
          className="min-w-[220px] flex-1 border border-[#4A1D6E]/25 bg-white px-3 py-2 text-sm text-[#1C1028] outline-none focus:border-[#4A1D6E]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ArticleStatus | "")}
          className="border border-[#4A1D6E]/25 bg-white px-3 py-2 text-sm text-[#1C1028] outline-none focus:border-[#4A1D6E]"
        >
          <option value="">Wszystkie statusy</option>
          {ARTICLE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ARTICLE_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="border border-[#4A1D6E]/25 bg-white px-3 py-2 text-sm text-[#1C1028] outline-none focus:border-[#4A1D6E]"
        >
          <option value="updated_desc">Ostatnia aktualizacja</option>
          <option value="title_asc">Tytuł A-Z</option>
          <option value="deadline_asc">Deadline</option>
        </select>
      </div>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <div className="border border-[#4A1D6E]/15 bg-white px-6 py-14 text-center">
            {articles.length === 0 ? (
              <>
                <p className="text-sm text-[#4A3360]">
                  Nie masz jeszcze żadnych artykułów. Dodaj pierwszy, żeby zacząć śledzić postępy.
                </p>
                <Link
                  href="/lab/artykuly/nowy"
                  className="mt-4 inline-block bg-[#4A1D6E] px-4 py-2 text-sm font-medium text-white hover:bg-[#4A2073]"
                >
                  + Dodaj artykuł
                </Link>
              </>
            ) : (
              <p className="text-sm text-[#4A3360]">
                Brak artykułów spełniających wybrane kryteria.
              </p>
            )}
          </div>
        ) : (
          <ul>
            {filtered.map((article) => (
              <li
                key={article.id}
                className="flex items-center justify-between gap-4 border-b-[0.5px] border-[#4A1D6E]/20 py-4"
              >
                <Link href={`/lab/artykuly/${article.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#4A1D6E]">{article.title}</p>
                  <p className="mt-0.5 truncate text-xs text-[#4A3360]">
                    {article.target_journal || "Bez wskazanego czasopisma"}
                  </p>
                </Link>
                <StatusTag status={article.status} />
                <span className="hidden shrink-0 text-xs text-[#4A3360] sm:block">
                  {formatDate(article.updated_at)}
                </span>
                <RowMenu id={article.id} title={article.title} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
