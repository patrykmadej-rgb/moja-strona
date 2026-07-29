"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search, BookOpen, FileSearch } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Publication } from "@/lib/publications";

const FILTERS = [
  { key: "all", label: "Wszystkie", type: null },
  { key: "artykuly", label: "Artykuły naukowe", type: "Artykuł naukowy" },
  { key: "rozdzialy", label: "Rozdziały", type: "Rozdział w monografii" },
  { key: "recenzje", label: "Recenzje", type: "Recenzja" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function formatMeta(pub: Publication, inPreparationLabel: string): string {
  const year = pub.year ?? (pub.status === "w-trakcie" ? inPreparationLabel : "");
  return [pub.venue, year].filter(Boolean).join(" · ");
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-block w-fit rounded-full bg-[#EDE6F8] px-3 py-1 text-xs font-medium text-[#4A1D6E] dark:bg-purple-900/30 dark:text-purple-300">
      {type}
    </span>
  );
}

function InProgressBadge({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-full border border-amber-300 bg-amber-100 px-3 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-300">
      {label}
    </span>
  );
}

export default function PublicationsExplorer({
  publications,
  inPreparationLabel,
  inProgressLabel,
}: {
  publications: Publication[];
  inPreparationLabel: string;
  inProgressLabel: string;
}) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const featured = useMemo(() => {
    const published = publications
      .filter((p) => p.status === undefined || p.status === "opublikowana")
      .sort((a, b) => (b.year ?? -Infinity) - (a.year ?? -Infinity));
    return published[0];
  }, [publications]);

  const isDefaultView = activeFilter === "all" && query.trim() === "";

  const filtered = useMemo(() => {
    const activeType = FILTERS.find((f) => f.key === activeFilter)?.type ?? null;
    const q = query.trim().toLowerCase();
    return publications.filter((pub) => {
      if (activeType && pub.type !== activeType) return false;
      if (!q) return true;
      return (
        pub.title.toLowerCase().includes(q) ||
        pub.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [publications, activeFilter, query]);

  const groups = useMemo(() => {
    const withYear = filtered.filter((p) => p.year !== undefined);
    const withoutYear = filtered.filter((p) => p.year === undefined);
    const years = Array.from(new Set(withYear.map((p) => p.year as number))).sort((a, b) => b - a);
    const yearGroups = years.map((year) => ({
      key: String(year),
      label: String(year),
      filled: true,
      items: withYear.filter((p) => p.year === year),
    }));
    if (withoutYear.length > 0) {
      yearGroups.push({
        key: "w-przygotowaniu",
        label: inPreparationLabel,
        filled: false,
        items: withoutYear,
      });
    }
    return yearGroups;
  }, [filtered, inPreparationLabel]);

  return (
    <div>
      {/* SZUKAJ + FILTRY */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm dark:bg-neutral-900 sm:flex-row sm:items-center">
        <div className="relative sm:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#4A3360]/50 dark:text-neutral-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj publikacji"
            className="w-full rounded-full border border-[#4A1D6E]/10 bg-[#F5F1EC] py-2.5 pr-4 pl-11 text-sm text-[#1C1028] placeholder:text-[#4A3360]/50 focus:border-[#4A1D6E]/40 focus:outline-none dark:border-white/10 dark:bg-neutral-950 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setActiveFilter(f.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeFilter === f.key
                  ? "bg-[#4A1D6E] text-white"
                  : "border border-[#4A1D6E]/20 text-[#4A3360] hover:border-[#4A1D6E]/40 dark:border-white/10 dark:text-neutral-300 dark:hover:border-purple-400/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* WYRÓŻNIONA PUBLIKACJA */}
      {featured && isDefaultView && (
        <Link
          href={`/publikacje/${featured.slug}`}
          className="group mt-6 flex flex-col gap-5 rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-stretch dark:bg-neutral-900"
        >
          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl sm:w-64">
            {featured.coverImageThumb ?? featured.coverImage ? (
              <Image
                src={(featured.coverImageThumb ?? featured.coverImage) as string}
                alt={featured.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#2E1A42] to-[#4A1D6E]">
                <BookOpen className="h-12 w-12 text-white" />
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col justify-center">
            <TypeBadge type={featured.type} />
            <h2 className="mt-3 text-2xl font-bold text-[#1C1028] dark:text-white">{featured.title}</h2>
            <p className="mt-2 text-sm text-[#4A3360] dark:text-neutral-400">
              {formatMeta(featured, inPreparationLabel)}
            </p>
            <span className="mt-4 inline-flex w-fit items-center gap-2 text-sm font-semibold uppercase text-[#4A1D6E] transition-transform group-hover:translate-x-1 dark:text-purple-400">
              Zobacz publikację →
            </span>
          </div>
          <div className="hidden shrink-0 items-start sm:flex">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EDE6F8] text-[#4A1D6E] dark:bg-purple-900/30 dark:text-purple-300">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
        </Link>
      )}

      {/* OŚ CZASU */}
      <div className="relative mt-10">
        <div className="pointer-events-none absolute top-2 bottom-2 left-[5px] w-px bg-[#4A1D6E]/15 sm:left-[9px] dark:bg-white/10" />

        {groups.length === 0 && (
          <p className="py-12 text-center text-[#4A3360] dark:text-neutral-400">
            Brak publikacji spełniających kryteria wyszukiwania.
          </p>
        )}

        {groups.map((group) => (
          <div key={group.key} className="flex gap-6 py-6">
            <div className="flex w-16 shrink-0 flex-col items-start pt-1 sm:w-24">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  group.filled
                    ? "bg-[#4A1D6E] dark:bg-purple-400"
                    : "border-2 border-[#4A1D6E]/40 bg-[#F5F1EC] dark:border-purple-400/40 dark:bg-neutral-950"
                }`}
              />
              <p className="mt-1 text-lg font-bold text-[#1C1028] dark:text-white">{group.label}</p>
            </div>
            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
              {group.items.map((pub) => (
                <Link
                  key={pub.slug}
                  href={`/publikacje/${pub.slug}`}
                  className="group flex flex-col justify-between rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-neutral-900"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <TypeBadge type={pub.type} />
                      {pub.status === "w-trakcie" && <InProgressBadge label={inProgressLabel} />}
                    </div>
                    <p className="mt-2 line-clamp-2 font-bold text-[#1C1028] dark:text-white">{pub.title}</p>
                    <p className="mt-1 text-sm text-[#4A3360] dark:text-neutral-400">
                      {formatMeta(pub, inPreparationLabel)}
                    </p>
                  </div>
                  <span className="mt-3 self-end text-[#4A1D6E] opacity-0 transition-opacity group-hover:opacity-100 dark:text-purple-400">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {isDefaultView && (
          <div className="mt-2 ml-[88px] flex items-center gap-4 rounded-2xl border-2 border-dashed border-[#4A1D6E]/25 p-5 sm:ml-[120px] dark:border-purple-400/20">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EDE6F8] text-[#4A1D6E] dark:bg-purple-900/30 dark:text-purple-300">
              <FileSearch className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-[#1C1028] dark:text-white">Więcej publikacji wkrótce</p>
              <p className="mt-0.5 text-sm text-[#4A3360] dark:text-neutral-400">
                Artykuły, rozdziały i teksty popularnonaukowe.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
