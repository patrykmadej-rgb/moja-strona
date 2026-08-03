"use client";

import { useEffect, useRef } from "react";
import type { LocalizedResearchAxis, ResearchAxisId } from "@/lib/research";
import { RESEARCH_AXIS_ICONS } from "./icons";
import AxisDetailContent from "./AxisDetailContent";
import { useRevealOnce } from "./useRevealOnce";
import { RESEARCH_CONTAINER_CLASS } from "./constants";

type Labels = {
  axesEyebrow: string;
  featuredBadge: string;
  expand: string;
  selected: string;
  questionsHeading: string;
  tagsHeading: string;
  seeRelatedProjects: string;
};

type Props = {
  axes: LocalizedResearchAxis[];
  activeAxis: ResearchAxisId | null;
  hoveredAxis: ResearchAxisId | null;
  onSelect: (id: ResearchAxisId) => void;
  onHover: (id: ResearchAxisId | null) => void;
  onSeeRelated: (id: ResearchAxisId) => void;
  labels: Labels;
  highlightPulse: boolean;
};

function AxisCard({
  axis,
  index,
  isActive,
  isFocused,
  onSelect,
  onHover,
  labels,
  revealed,
  highlightPulse,
}: {
  axis: LocalizedResearchAxis;
  index: number;
  isActive: boolean;
  isFocused: boolean;
  onSelect: () => void;
  onHover: (v: boolean) => void;
  labels: Labels;
  revealed: boolean;
  highlightPulse: boolean;
}) {
  const Icon = RESEARCH_AXIS_ICONS[axis.id];
  const isFeatured = axis.id === "balkans";

  return (
    <button
      type="button"
      id={`axis-card-${axis.id}`}
      aria-pressed={isActive}
      aria-controls="research-detail"
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      data-reveal={revealed ? "in" : undefined}
      style={{
        transitionDelay: `${index * 60}ms`,
        transform: isFocused ? "translateY(-3px)" : "translateY(0)",
        outline: highlightPulse ? "3px solid var(--research-gold)" : undefined,
        outlineOffset: highlightPulse ? "3px" : undefined,
      }}
      className={`group relative flex min-h-[200px] flex-col overflow-hidden rounded-research-md border p-6 text-left transition-[transform,box-shadow,border-color] duration-[250ms] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--research-gold)] ${
        isFeatured
          ? "border-transparent bg-gradient-to-br from-[var(--research-lavender-soft)] to-[#fbf7ec]"
          : "border-[var(--research-line)] bg-[var(--research-paper)] dark:border-white/10 dark:bg-neutral-900"
      } ${isFocused ? "border-[var(--research-gold)]/60 shadow-[var(--research-shadow)]" : ""} ${
        isActive && !isFeatured ? "border-[var(--research-violet)]/50" : ""
      }`}
    >
      {/* pasek u góry — złoty, stały dla wyróżnionej osi; fioletowy, rosnący na hover dla pozostałych */}
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 h-[3px]"
        style={{
          width: isFeatured ? "100%" : isFocused ? "100%" : "35%",
          backgroundColor: isFeatured ? "var(--research-gold)" : "var(--research-violet)",
          transition: "width 250ms var(--research-ease)",
        }}
      />

      <div className="flex items-start justify-between gap-2">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{
            color: "var(--research-violet)",
            backgroundColor: isFeatured ? "rgba(255,255,255,.6)" : "var(--research-lavender-soft)",
            transform: isFocused ? "rotate(2deg) scale(1.05)" : undefined,
            transition: "transform 250ms var(--research-ease)",
          }}
        >
          <Icon className="h-5 w-5" />
        </span>
        {isFeatured && (
          <span className="rounded-research-sm mt-1 px-2 py-1 text-[10px] font-semibold tracking-[0.14em] whitespace-nowrap text-[var(--research-gold)] uppercase">
            {labels.featuredBadge}
          </span>
        )}
      </div>

      <p className="mt-4 line-clamp-2 text-base font-bold leading-snug text-[#1C1028] dark:text-white">
        {axis.shortTitle}
      </p>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#4A3360] dark:text-neutral-300">
        {axis.description}
      </p>

      <span
        aria-hidden="true"
        className="mt-auto pt-4 text-[var(--research-violet)] transition-transform duration-200 group-hover:translate-x-[3px] dark:text-purple-300"
      >
        →
      </span>
      <span className="sr-only">{isActive ? labels.selected : labels.expand}</span>
    </button>
  );
}

export default function ResearchAxisCards({
  axes,
  activeAxis,
  hoveredAxis,
  onSelect,
  onHover,
  onSeeRelated,
  labels,
  highlightPulse,
}: Props) {
  const { ref, revealed } = useRevealOnce<HTMLDivElement>();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const activeAxisData = axes.find((a) => a.id === activeAxis);

  useEffect(() => {
    if (!activeAxis) return;
    const card = document.getElementById(`axis-card-${activeAxis}`);
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const outOfView = rect.top < 0 || rect.bottom > window.innerHeight;
    if (outOfView) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      card.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }
  }, [activeAxis]);

  return (
    <section id="osie-badawcze" className={`${RESEARCH_CONTAINER_CLASS} hidden pt-12 lg:pt-16 min-[720px]:block`}>
      <h2 className="text-xs font-semibold tracking-[0.22em] uppercase text-[#4A1D6E] dark:text-purple-400">
        {labels.axesEyebrow}
      </h2>

      <div
        ref={ref}
        className="mt-5 grid grid-cols-1 gap-5 min-[640px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1280px]:grid-cols-5"
      >
        {axes.map((axis, index) => (
          <AxisCard
            key={axis.id}
            axis={axis}
            index={index}
            isActive={activeAxis === axis.id}
            isFocused={(hoveredAxis ?? activeAxis) === axis.id}
            onSelect={() => onSelect(axis.id)}
            onHover={(v) => onHover(v ? axis.id : null)}
            labels={labels}
            revealed={revealed}
            highlightPulse={highlightPulse && index === 0}
          />
        ))}
      </div>

      {/* Panel szczegółów — jeden, aktualizowany treścią aktywnej osi */}
      <div
        id="research-detail"
        role="region"
        className="mt-2 grid rounded-research-lg"
        style={{
          gridTemplateRows: activeAxis ? "1fr" : "0fr",
          transition: "grid-template-rows 380ms var(--research-ease), opacity 380ms var(--research-ease)",
          opacity: activeAxis ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <div ref={panelRef} className="border-t border-[var(--research-line)] px-2 dark:border-white/10">
            <p aria-live="polite" className="pt-6 text-xl font-bold text-[#1C1028] dark:text-white">
              {activeAxisData?.title}
            </p>
            {activeAxisData && (
              <AxisDetailContent axis={activeAxisData} labels={labels} onSeeRelated={onSeeRelated} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
