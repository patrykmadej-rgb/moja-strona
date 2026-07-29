"use client";

import { useEffect, useRef } from "react";
import type { LocalizedResearchAxis, ResearchAxisId } from "@/lib/research";
import { RESEARCH_AXIS_ICONS } from "./icons";
import AxisDetailContent from "./AxisDetailContent";
import { useRevealOnce } from "./useRevealOnce";

type Labels = {
  axesEyebrow: string;
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
  const isDeepVariant = axis.id === "balkans";

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
        transform: isFocused && !isActive ? "translateY(-6px)" : "translateY(0)",
        boxShadow: isFocused ? "var(--research-shadow)" : undefined,
        outline: highlightPulse ? "3px solid var(--research-gold)" : undefined,
        outlineOffset: highlightPulse ? "3px" : undefined,
      }}
      className={`group relative flex min-h-[250px] flex-col overflow-hidden rounded-research-lg border p-6 text-left transition-[transform,box-shadow,background-color,border-color] duration-[250ms] ${
        isActive
          ? isDeepVariant
            ? "border-transparent bg-[var(--research-plum-800)] text-white"
            : "border-transparent bg-gradient-to-br from-[var(--research-lavender-soft)] to-[var(--research-lavender)]"
          : "border-[var(--research-line)] bg-[var(--research-paper)] hover:border-[var(--research-gold)]/50 dark:border-white/10 dark:bg-neutral-900"
      }`}
    >
      {/* górny pasek — rośnie z 35% do 100% szerokości na hover/aktywności */}
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 h-1"
        style={{
          width: isFocused ? "100%" : "35%",
          backgroundColor: isActive && isDeepVariant ? "var(--research-gold)" : "var(--research-violet)",
          transition: "width 250ms var(--research-ease)",
        }}
      />

      <div className="flex items-start justify-between">
        <span
          className={`text-xs font-semibold tracking-[0.2em] ${isActive ? (isDeepVariant ? "text-white/60" : "text-[var(--research-violet)]") : "text-[var(--research-amethyst)]"}`}
        >
          {axis.number}
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{
            color: isActive && isDeepVariant ? "white" : "var(--research-violet)",
            backgroundColor: isActive && isDeepVariant ? "rgba(255,255,255,.12)" : "var(--research-lavender-soft)",
            transform: isFocused ? "rotate(2deg) scale(1.05)" : undefined,
            transition: "transform 250ms var(--research-ease)",
          }}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <p
        className={`mt-4 line-clamp-3 text-base font-bold leading-snug ${isActive && isDeepVariant ? "text-white" : "text-[#1C1028] dark:text-white"}`}
      >
        {axis.title}
      </p>
      <p
        className={`mt-2 line-clamp-3 text-sm leading-relaxed ${
          isActive && isDeepVariant ? "text-white/75" : "text-[#4A3360] dark:text-neutral-300"
        }`}
      >
        {axis.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {axis.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className={`rounded-research-md px-2.5 py-1 text-[11px] font-medium ${
              isActive
                ? isDeepVariant
                  ? "bg-white/15 text-white"
                  : "bg-white/70 text-[var(--research-plum-800)]"
                : "bg-[var(--research-lavender-soft)] text-[var(--research-plum-700)] dark:bg-purple-900/20 dark:text-purple-200"
            }`}
          >
            {tag}
          </span>
        ))}
      </div>

      <span
        className={`mt-auto pt-5 text-sm font-semibold uppercase tracking-wide ${
          isActive && isDeepVariant ? "text-[var(--research-gold)]" : "text-[var(--research-violet)] dark:text-purple-300"
        }`}
      >
        {isActive ? labels.selected : `${labels.expand} →`}
      </span>
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
    <section id="osie-badawcze" className="mx-auto hidden max-w-6xl px-6 py-20 min-[720px]:block">
      <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
        {labels.axesEyebrow}
      </p>

      <div
        ref={ref}
        className="mt-6 grid grid-cols-1 gap-5 min-[640px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1280px]:grid-cols-5"
      >
        {axes.map((axis, index) => (
          <AxisCard
            key={axis.id}
            axis={axis}
            index={index}
            // Zanim użytkownik cokolwiek wybierze (activeAxis === null), pierwsza
            // karta (01 — Bałkany) ma domyślnie wygląd .is-active, zgodnie z
            // mockupem — czysto wizualnie, nie otwiera panelu ani nie podświetla
            // węzła mapy (te trzymają się prawdziwego activeAxis, patrz niżej).
            isActive={activeAxis !== null ? activeAxis === axis.id : index === 0}
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
