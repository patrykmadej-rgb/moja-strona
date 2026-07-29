"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FlaskConical } from "lucide-react";
import type { LocalizedCurrentWorkItem, LocalizedResearchAxis, ResearchAxisId } from "@/lib/research";
import { Link } from "@/i18n/navigation";
import { useRevealOnce } from "./useRevealOnce";

type Labels = {
  currentWorkEyebrow: string;
  currentWorkHeading: string;
  currentWorkIntro: string;
  filterAll: string;
  carouselPrev: string;
  carouselNext: string;
  noResults: string;
};

type Props = {
  axes: LocalizedResearchAxis[];
  items: LocalizedCurrentWorkItem[];
  filter: ResearchAxisId | "all";
  onFilterChange: (f: ResearchAxisId | "all") => void;
  labels: Labels;
};

function getPerView(width: number): number {
  if (width >= 1024) return 4;
  if (width >= 640) return 2;
  return 1;
}

function WorkCard({ item, axisLabel }: { item: LocalizedCurrentWorkItem; axisLabel: string }) {
  const content = (
    <div className="group flex h-full flex-col rounded-research-lg border border-[var(--research-line)] bg-[var(--research-paper)] p-5 transition-transform duration-[250ms] hover:-translate-y-1 dark:border-white/10 dark:bg-neutral-900">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--research-lavender-soft)] text-[var(--research-violet)] dark:bg-purple-900/20 dark:text-purple-300">
          <FlaskConical className="h-4 w-4" />
        </span>
        <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#4A3360] transition-colors duration-[250ms] group-hover:text-[var(--research-violet)] dark:text-neutral-400">
          {axisLabel}
        </span>
      </div>
      <p className="mt-3 line-clamp-3 font-bold text-[#1C1028] dark:text-white">{item.title}</p>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#4A3360] dark:text-neutral-300">
        {item.subtitle}
      </p>
      <span className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-semibold text-[var(--research-violet)] transition-transform duration-[250ms] group-hover:translate-x-[3px] dark:text-purple-300">
        →
      </span>
    </div>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="block h-full focus:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-4 focus-visible:ring-[var(--research-gold)]">
        {content}
      </Link>
    );
  }
  return <div className="h-full">{content}</div>;
}

export default function CurrentWorkCarousel({ axes, items, filter, onFilterChange, labels }: Props) {
  const { ref: sectionRef, revealed } = useRevealOnce<HTMLDivElement>();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [perView, setPerView] = useState(4);
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.axis === filter)),
    [items, filter],
  );

  const axisLabelById = useMemo(() => new Map(axes.map((a) => [a.id, a.shortTitle])), [axes]);
  const groupCount = Math.max(1, Math.ceil(filtered.length / perView));

  useEffect(() => {
    function updatePerView() {
      setPerView(getPerView(window.innerWidth));
    }
    updatePerView();
    window.addEventListener("resize", updatePerView);
    return () => window.removeEventListener("resize", updatePerView);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleIndices((prev) => {
          const next = new Set(prev);
          for (const entry of entries) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (entry.isIntersecting) next.add(idx);
            else next.delete(idx);
          }
          return next;
        });
      },
      { root: scroller, threshold: 0.6 },
    );
    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [filtered.length]);

  const activeGroup = visibleIndices.size > 0 ? Math.floor(Math.min(...visibleIndices) / perView) : 0;

  function scrollByCards(direction: 1 | -1) {
    const scroller = scrollerRef.current;
    const card = cardRefs.current[0];
    if (!scroller || !card) return;
    const gap = 20;
    const amount = (card.getBoundingClientRect().width + gap) * direction;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollBy({ left: amount, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function scrollToGroup(group: number) {
    const scroller = scrollerRef.current;
    const card = cardRefs.current[group * perView];
    if (!scroller || !card) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollTo({ left: card.offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollByCards(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollByCards(-1);
    }
  }

  return (
    <section
      id="aktualnie-pracuje"
      ref={sectionRef}
      data-reveal={revealed ? "in" : undefined}
      className="mx-auto max-w-6xl px-6 py-20"
    >
      <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
        {labels.currentWorkEyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#1C1028] dark:text-white">
        {labels.currentWorkHeading}
      </h2>
      <p className="mt-4 max-w-2xl leading-relaxed text-[#4A3360] dark:text-neutral-300">
        {labels.currentWorkIntro}
      </p>

      {/* FILTRY */}
      <div className="mt-8 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={filter === "all"}
          onClick={() => onFilterChange("all")}
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
            onClick={() => onFilterChange(axis.id)}
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

      {/* KARUZELA */}
      {filtered.length === 0 ? (
        <p className="py-16 text-center text-[#4A3360] dark:text-neutral-400">{labels.noResults}</p>
      ) : (
        <div className="relative mt-8">
          <div
            ref={scrollerRef}
            role="group"
            aria-label={labels.currentWorkHeading}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 focus:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-4 focus-visible:ring-[var(--research-gold)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {filtered.map((item, i) => (
              <div
                key={`${item.axis}-${item.title}`}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                data-index={i}
                className="shrink-0 snap-start basis-[88%] min-[640px]:basis-[calc(50%-0.625rem)] lg:basis-[calc(25%-0.9375rem)]"
              >
                <WorkCard item={item} axisLabel={axisLabelById.get(item.axis) ?? ""} />
              </div>
            ))}
          </div>

          {/* Strzałki */}
          <div className="mt-5 flex items-center justify-between">
            <div className="flex gap-2">
              {Array.from({ length: groupCount }).map((_, g) => (
                <button
                  key={g}
                  type="button"
                  aria-label={`${g + 1}`}
                  onClick={() => scrollToGroup(g)}
                  className="h-1.5 w-6 rounded-full transition-colors"
                  style={{
                    backgroundColor: activeGroup === g ? "var(--research-violet)" : "var(--research-line)",
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label={labels.carouselPrev}
                onClick={() => scrollByCards(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#4A1D6E]/20 text-[#4A1D6E] transition-colors hover:bg-[#4A1D6E]/5 dark:border-purple-400/30 dark:text-purple-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={labels.carouselNext}
                onClick={() => scrollByCards(1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#4A1D6E]/20 text-[#4A1D6E] transition-colors hover:bg-[#4A1D6E]/5 dark:border-purple-400/30 dark:text-purple-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
