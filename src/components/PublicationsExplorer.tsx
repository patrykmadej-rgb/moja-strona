"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search, BookOpen, FileText } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Publication } from "@/lib/publications";

const TYPE_FILTERS = [
  { key: "all", label: "Wszystkie", type: null },
  { key: "artykuly", label: "Artykuły naukowe", type: "Artykuł naukowy" },
  { key: "rozdzialy", label: "Rozdziały", type: "Rozdział w monografii" },
  { key: "recenzje", label: "Recenzje", type: "Recenzja" },
] as const;

type TypeFilterKey = (typeof TYPE_FILTERS)[number]["key"];

const IN_PREPARATION_KEY = "w-przygotowaniu";

function yearKeyOf(pub: Publication): string {
  return pub.year !== undefined ? String(pub.year) : IN_PREPARATION_KEY;
}

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

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function FeaturedCard({ pub, inPreparationLabel }: { pub: Publication; inPreparationLabel: string }) {
  const thumb = pub.coverImageThumb ?? pub.coverImage;
  return (
    <Link
      href={`/publikacje/${pub.slug}`}
      className="group flex flex-col gap-5 rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-stretch dark:bg-neutral-900"
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl sm:w-64">
        {thumb ? (
          <Image src={thumb} alt={pub.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#2E1A42] to-[#4A1D6E]">
            <BookOpen className="h-12 w-12 text-white" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={pub.type} />
        </div>
        <h2 className="mt-3 text-2xl font-bold text-[#1C1028] dark:text-white">{pub.title}</h2>
        <p className="mt-2 text-sm text-[#4A3360] dark:text-neutral-400">{formatMeta(pub, inPreparationLabel)}</p>
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
  );
}

function CompactCard({
  pub,
  inPreparationLabel,
  inProgressLabel,
}: {
  pub: Publication;
  inPreparationLabel: string;
  inProgressLabel: string;
}) {
  const thumb = pub.coverImageThumb ?? pub.coverImage;
  const yearLabel = pub.year ?? (pub.status === "w-trakcie" ? inPreparationLabel : "");
  return (
    <Link
      href={`/publikacje/${pub.slug}`}
      className="group flex items-start gap-4 rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-neutral-900"
    >
      <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl">
        {thumb ? (
          <Image src={thumb} alt={pub.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2E1A42] to-[#4A1D6E]">
            <FileText className="h-6 w-6 text-white" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={pub.type} />
          {pub.status === "w-trakcie" && <InProgressBadge label={inProgressLabel} />}
        </div>
        <p className="mt-2 line-clamp-3 font-bold text-[#1C1028] dark:text-white">{pub.title}</p>
        <p className="mt-1.5 text-sm text-[#4A3360] dark:text-neutral-400">{pub.type}</p>
        <p className="text-sm text-[#4A3360] dark:text-neutral-400">{yearLabel}</p>
      </div>
      <span className="mt-1 shrink-0 text-[#4A1D6E] opacity-0 transition-opacity group-hover:opacity-100 dark:text-purple-400">
        →
      </span>
    </Link>
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
  const [typeFilter, setTypeFilter] = useState<TypeFilterKey>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  const allTags = useMemo(
    () => Array.from(new Set(publications.flatMap((p) => p.tags))).sort((a, b) => a.localeCompare(b, "pl")),
    [publications],
  );

  const allYearOptions = useMemo(() => {
    const years = Array.from(new Set(publications.filter((p) => p.year !== undefined).map((p) => p.year as number)))
      .sort((a, b) => b - a)
      .map((y) => ({ key: String(y), label: String(y) }));
    const hasInProgress = publications.some((p) => p.year === undefined);
    return hasInProgress ? [...years, { key: IN_PREPARATION_KEY, label: inPreparationLabel }] : years;
  }, [publications, inPreparationLabel]);

  const featured = useMemo(() => {
    return publications
      .filter((p) => p.status === undefined || p.status === "opublikowana")
      .sort((a, b) => (b.year ?? -Infinity) - (a.year ?? -Infinity))
      .slice(0, 3);
  }, [publications]);
  const featuredSlugs = useMemo(() => new Set(featured.map((p) => p.slug)), [featured]);

  const isDefaultView =
    query.trim() === "" && typeFilter === "all" && selectedTags.length === 0 && selectedYears.length === 0;

  const filtered = useMemo(() => {
    const activeType = TYPE_FILTERS.find((f) => f.key === typeFilter)?.type ?? null;
    const q = query.trim().toLowerCase();
    return publications.filter((pub) => {
      if (activeType && pub.type !== activeType) return false;
      if (selectedTags.length > 0 && !pub.tags.some((tag) => selectedTags.includes(tag))) return false;
      if (selectedYears.length > 0 && !selectedYears.includes(yearKeyOf(pub))) return false;
      if (q && !pub.title.toLowerCase().includes(q) && !pub.tags.some((tag) => tag.toLowerCase().includes(q))) {
        return false;
      }
      return true;
    });
  }, [publications, typeFilter, selectedTags, selectedYears, query]);

  const gridItems = isDefaultView ? publications.filter((p) => !featuredSlugs.has(p.slug)) : filtered;

  return (
    <div>
      {/* HERO */}
      <section className="border-b border-[#4A1D6E]/10 pt-16 pb-10 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <div>
              <p className="mb-4 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
                Publikacje
              </p>
              <h1 className="text-5xl font-semibold tracking-tight text-[#1C1028] dark:text-white">
                Dorobek naukowy
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#4A3360] dark:text-neutral-300">
                Artykuły naukowe, rozdziały w monografiach i teksty popularnonaukowe
                z obszaru kryminologii, wiktymologii i psychologii bezpieczeństwa.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#4A1D6E]/30 px-5 py-2.5 text-sm font-semibold text-[#4A1D6E] transition-colors hover:bg-[#4A1D6E]/5 dark:border-purple-400/30 dark:text-purple-300 dark:hover:bg-purple-400/10"
                >
                  Google Scholar ↗
                </a>
                <a
                  href="https://orcid.org/0000-0002-7185-2441"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#4A1D6E]/30 px-5 py-2.5 text-sm font-semibold text-[#4A1D6E] transition-colors hover:bg-[#4A1D6E]/5 dark:border-purple-400/30 dark:text-purple-300 dark:hover:bg-purple-400/10"
                >
                  ORCID ↗
                </a>
              </div>

              {/* SZUKAJ + FILTR TYPU */}
              <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm sm:flex-row sm:items-center dark:bg-neutral-900">
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
                  {TYPE_FILTERS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setTypeFilter(f.key)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        typeFilter === f.key
                          ? "bg-[#4A1D6E] text-white"
                          : "border border-[#4A1D6E]/20 text-[#4A3360] hover:border-[#4A1D6E]/40 dark:border-white/10 dark:text-neutral-300 dark:hover:border-purple-400/40"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dekoracyjna ilustracja — widoczna od lg wzwyż, lekko wychodząca poza kolumnę */}
            <div className="hidden lg:block">
              <div className="-mt-8 -mr-10 scale-110">
                <Image
                  src="/publikacje-hero-book.png"
                  alt="Ilustracja przedstawiająca otwartą książkę, mapę i sieć neuronową symbolizujące dorobek naukowy"
                  width={1672}
                  height={941}
                  priority
                  className="h-auto w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* 3 WYRÓŻNIONE PUBLIKACJE */}
        {isDefaultView && (
          <div className="flex flex-col gap-4">
            {featured.map((pub) => (
              <FeaturedCard key={pub.slug} pub={pub} inPreparationLabel={inPreparationLabel} />
            ))}
          </div>
        )}

        {/* POZOSTAŁE / WYNIKI FILTROWANIA */}
        <div className={isDefaultView ? "mt-8" : ""}>
          {gridItems.length === 0 ? (
            <p className="py-12 text-center text-[#4A3360] dark:text-neutral-400">
              Brak publikacji spełniających kryteria wyszukiwania.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {gridItems.map((pub) => (
                <CompactCard
                  key={pub.slug}
                  pub={pub}
                  inPreparationLabel={inPreparationLabel}
                  inProgressLabel={inProgressLabel}
                />
              ))}
            </div>
          )}
        </div>

        {/* FILTRY: TAGI + LATA */}
        <div className="mt-10 space-y-5 border-t border-[#4A1D6E]/10 pt-8 dark:border-white/10">
          <div>
            <p className="mb-3 text-xs font-semibold tracking-[0.2em] uppercase text-[#4A3360] dark:text-neutral-400">
              Tematy
            </p>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTags((prev) => toggleValue(prev, tag))}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-[#4A1D6E] text-white"
                      : "border border-[#4A1D6E]/20 text-[#4A3360] hover:border-[#4A1D6E]/40 dark:border-white/10 dark:text-neutral-300 dark:hover:border-purple-400/40"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold tracking-[0.2em] uppercase text-[#4A3360] dark:text-neutral-400">
              Rok
            </p>
            <div className="flex flex-wrap gap-2">
              {allYearOptions.map((y) => (
                <button
                  key={y.key}
                  type="button"
                  onClick={() => setSelectedYears((prev) => toggleValue(prev, y.key))}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    selectedYears.includes(y.key)
                      ? "bg-[#4A1D6E] text-white"
                      : "border border-[#4A1D6E]/20 text-[#4A3360] hover:border-[#4A1D6E]/40 dark:border-white/10 dark:text-neutral-300 dark:hover:border-purple-400/40"
                  }`}
                >
                  {y.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
