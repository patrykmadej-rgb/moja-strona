"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import type { LocalizedCurrentWorkItem, LocalizedResearchAxis, ResearchAxisId } from "@/lib/research";
import ResearchMap from "./ResearchMap";
import ResearchAxisCards from "./ResearchAxisCards";
import CurrentWorkCarousel from "./CurrentWorkCarousel";
import { EXPLORE_AXES_EVENT } from "./ExploreAxesButton";

export type ResearchLabels = {
  mapLabel: string;
  mapAriaLabel: string;
  mapNodeOpenDetails: string;
  mapCenterLabel: string;
  mapMobileHint: string;
  axesEyebrow: string;
  expand: string;
  selected: string;
  questionsHeading: string;
  tagsHeading: string;
  seeRelatedProjects: string;
  currentWorkEyebrow: string;
  currentWorkHeading: string;
  currentWorkIntro: string;
  filterAll: string;
  carouselPrev: string;
  carouselNext: string;
  noResults: string;
};

type Props = {
  /** Lewa kolumna hero (eyebrow, H1, opis, CTA) — server-rendered, przekazane jako children. */
  heroLeft: ReactNode;
  axes: LocalizedResearchAxis[];
  currentWork: LocalizedCurrentWorkItem[];
  hasBackgroundImage: boolean;
  labels: ResearchLabels;
};

/**
 * Cały interaktywny program badawczy w jednym komponencie-kliencie: mapa w hero
 * (prawa kolumna) + karty osi + panel szczegółów + karuzela "Aktualnie pracuję
 * nad". Jeden wspólny stan (wybrana/hover'owana oś, filtr karuzeli), zgodnie z
 * wymaganiem, że wybór osi aktualizuje mapę, kartę, panel i filtr jednocześnie.
 */
export default function ResearchInteractive({ heroLeft, axes, currentWork, hasBackgroundImage, labels }: Props) {
  const [activeAxis, setActiveAxis] = useState<ResearchAxisId | null>(null);
  const [hoveredAxis, setHoveredAxis] = useState<ResearchAxisId | null>(null);
  const [workFilter, setWorkFilter] = useState<ResearchAxisId | "all">("all");
  const [highlightPulse, setHighlightPulse] = useState(false);

  const selectAxis = useCallback((id: ResearchAxisId) => {
    setActiveAxis(id);
    setWorkFilter(id);
  }, []);

  const seeRelated = useCallback((id: ResearchAxisId) => {
    setWorkFilter(id);
    const el = document.getElementById("aktualnie-pracuje");
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveAxis(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function onExplore() {
      setHighlightPulse(true);
      window.setTimeout(() => setHighlightPulse(false), 700);
    }
    window.addEventListener(EXPLORE_AXES_EVENT, onExplore);
    return () => window.removeEventListener(EXPLORE_AXES_EVENT, onExplore);
  }, []);

  return (
    <>
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pt-14 pb-8 min-[720px]:grid-cols-2 min-[720px]:pt-20">
        {heroLeft}
        <ResearchMap
          axes={axes}
          activeAxis={activeAxis}
          hoveredAxis={hoveredAxis}
          onSelect={selectAxis}
          onHover={setHoveredAxis}
          onSeeRelated={seeRelated}
          labels={labels}
          hasBackgroundImage={hasBackgroundImage}
        />
      </section>

      <ResearchAxisCards
        axes={axes}
        activeAxis={activeAxis}
        hoveredAxis={hoveredAxis}
        onSelect={selectAxis}
        onHover={setHoveredAxis}
        onSeeRelated={seeRelated}
        labels={labels}
        highlightPulse={highlightPulse}
      />

      <CurrentWorkCarousel
        axes={axes}
        items={currentWork}
        filter={workFilter}
        onFilterChange={setWorkFilter}
        labels={labels}
      />
    </>
  );
}
