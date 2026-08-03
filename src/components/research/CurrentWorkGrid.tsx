"use client";

import { useMemo, useState } from "react";
import { FlaskConical } from "lucide-react";
import type { LocalizedCurrentWorkItem, LocalizedResearchAxis, ResearchAxisId } from "@/lib/research";
import { Link } from "@/i18n/navigation";
import { useRevealOnce } from "./useRevealOnce";
import { RESEARCH_CONTAINER_CLASS } from "./constants";

const INITIAL_COUNT = 4;

type Labels = {
  currentWorkEyebrow: string;
  currentWorkHeading: string;
  filterAll: string;
  seeAll: string;
  showLess: string;
  noResults: string;
};

type Props = {
  axes: LocalizedResearchAxis[];
  items: LocalizedCurrentWorkItem[];
  filter: ResearchAxisId | "all";
  onFilterChange: (f: ResearchAxisId | "all") => void;
  labels: Labels;
};

function WorkCard({ item, axisLabel }: { item: LocalizedCurrentWorkItem; axisLabel: string }) {
  const content = (
    <div className="group flex h-full min-h-[190px] flex-col rounded-research-md border border-[var(--research-line)] bg-[var(--research-paper)] p-5 transition-[transform,border-color] duration-[250ms] hover:-translate-y-1 hover:border-[var(--research-gold)]/50 dark:border-white/10 dark:bg-neutral-900">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--research-lavender-soft)] text-[var(--research-violet)] dark:bg-purple-900/20 dark:text-purple-300">
          <FlaskConical className="h-4 w-4" />
        </span>
        <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#4A3360] transition-colors duration-[250ms] group-hover:text-[var(--research-violet)] dark:text-neutral-400">
          {axisLabel}
        </span>
      </div>
      <p className="mt-3 line-clamp-3 font-bold text-[#1C1028] dark:text-white">{item.title}</p>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#4A3360] dark:text-neutral-300">
        {item.subtitle}
      </p>
      <span
        aria-hidden="true"
        className="mt-auto flex items-center justify-end pt-4 text-sm font-semibold text-[var(--research-violet)] transition-transform duration-[250ms] group-hover:translate-x-[3px] dark:text-purple-300"
      >
        →
      </span>
    </div>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        className="block h-full rounded-research-md focus:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-4 focus-visible:ring-[var(--research-gold)]"
      >
        {content}
      </Link>
    );
  }
  return <div className="h-full">{content}</div>;
}

export default function CurrentWorkGrid({ axes, items, filter, onFilterChange, labels }: Props) {
  const { ref: sectionRef, revealed } = useRevealOnce<HTMLDivElement>();
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.axis === filter)),
    [items, filter],
  );
  const visible = expanded ? filtered : filtered.slice(0, INITIAL_COUNT);
  const axisLabelById = useMemo(() => new Map(axes.map((a) => [a.id, a.shortTitle])), [axes]);

  function handleFilterChange(f: ResearchAxisId | "all") {
    setExpanded(false);
    onFilterChange(f);
  }

  return (
    <section
      id="aktualnie-pracuje"
      ref={sectionRef}
      data-reveal={revealed ? "in" : undefined}
      className={`${RESEARCH_CONTAINER_CLASS} pt-12 lg:pt-16`}
    >
      <p className="text-xs font-semibold tracking-[0.22em] uppercase text-[#4A1D6E] dark:text-purple-400">
        {labels.currentWorkEyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1C1028] dark:text-white">
        {labels.currentWorkHeading}
      </h2>

      {/* FILTRY */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={filter === "all"}
          onClick={() => handleFilterChange("all")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-[#4A1D6E] text-white"
              : "border border-[#4A1D6E]/20 text-[#4A3360] hover:border-[#4A1D6E]/40 dark:border-white/10 dark:text-neutral-300 dark:hover:border-purple-400/40"
          }`}
        >
          {labels.filterAll}
        </button>
        {axes.map((axis) => (
          <button
            key={axis.id}
            type="button"
            aria-pressed={filter === axis.id}
            onClick={() => handleFilterChange(axis.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === axis.id
                ? "bg-[#4A1D6E] text-white"
                : "border border-[#4A1D6E]/20 text-[#4A3360] hover:border-[#4A1D6E]/40 dark:border-white/10 dark:text-neutral-300 dark:hover:border-purple-400/40"
            }`}
          >
            {axis.shortTitle}
          </button>
        ))}
      </div>

      {/* SIATKA */}
      {filtered.length === 0 ? (
        <p className="py-16 text-center text-[#4A3360] dark:text-neutral-400">{labels.noResults}</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-5 min-[640px]:grid-cols-2 lg:grid-cols-4">
            {visible.map((item) => (
              <WorkCard
                key={`${item.axis}-${item.title}`}
                item={item}
                axisLabel={axisLabelById.get(item.axis) ?? ""}
              />
            ))}
          </div>

          {filtered.length > INITIAL_COUNT && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="rounded-research-sm border border-[#4A1D6E]/25 px-6 py-2.5 text-sm font-semibold text-[#4A1D6E] transition-colors hover:border-[#4A1D6E]/50 hover:bg-[#4A1D6E]/5 dark:border-purple-400/30 dark:text-purple-300"
              >
                {expanded ? labels.showLess : `${labels.seeAll} (${filtered.length})`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
