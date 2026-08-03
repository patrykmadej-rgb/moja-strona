"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import type { LocalizedCurrentWorkItem, LocalizedResearchAxis, ResearchAxisId } from "@/lib/research";
import ResearchMap from "./ResearchMap";
import ResearchAxisCards from "./ResearchAxisCards";
import CurrentWorkGrid from "./CurrentWorkGrid";
import { EXPLORE_AXES_EVENT } from "./ExploreAxesButton";
import { RESEARCH_CONTAINER_CLASS } from "./constants";

export type ResearchLabels = {
  mapLabel: string;
  mapAriaLabel: string;
  mapNodeOpenDetails: string;
  mapCenterLabel: string;
  mapMobileHint: string;
  axesEyebrow: string;
  featuredBadge: string;
  expand: string;
  selected: string;
  questionsHeading: string;
  tagsHeading: string;
  seeRelatedProjects: string;
  currentWorkEyebrow: string;
  currentWorkHeading: string;
  filterAll: string;
  seeAll: string;
  showLess: string;
  noResults: string;
};

type Props = {
  /** Lewa kolumna hero (eyebrow, H1, opis, CTA) — server-rendered, przekazane jako children. */
  heroLeft: ReactNode;
  /** Sekcja końcowa ("Jak pracuję badawczo" / pytania badawcze) — server-rendered. */
  closing: ReactNode;
  axes: LocalizedResearchAxis[];
  currentWork: LocalizedCurrentWorkItem[];
  hasBackgroundImage: boolean;
  labels: ResearchLabels;
};

/**
 * Cały interaktywny program badawczy w jednym komponencie-kliencie: mapa w hero
 * (prawa kolumna) + karty osi + panel szczegółów + siatka "Aktualnie pracuję
 * nad". Jeden wspólny stan (wybrana/hover'owana oś, filtr siatki), zgodnie z
 * wymaganiem, że wybór osi aktualizuje mapę, kartę, panel i filtr jednocześnie.
 */
export default function ResearchInteractive({
  heroLeft,
  closing,
  axes,
  currentWork,
  hasBackgroundImage,
  labels,
}: Props) {
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
      {/* Kolumny hero w proporcji ~0.9/1.1 (bliżej równowagi niż poprzednie 38/62),
          żeby mapa nie dominowała nad treścią. Jeden wspólny kontener
          (RESEARCH_CONTAINER_CLASS) zamiast pełnego wyłamania na szerokość
          viewportu — to też usuwa źródło poziomego scrolla przy pasku
          przewijania (100vw liczone bez uwzględnienia scrollbara). */}
      <section className="pt-12 lg:pt-16">
        <div
          className={`${RESEARCH_CONTAINER_CLASS} grid grid-cols-1 items-center gap-10 min-[1200px]:grid-cols-[minmax(420px,0.9fr)_minmax(520px,1.1fr)] min-[1200px]:gap-16`}
        >
          <div className="w-full">{heroLeft}</div>
          {/* items-center centruje kolumnę mapy w wysokości wiersza (mapa jest wyższa
              niż tekst), zostawiając pas pustej przestrzeni nad i pod nią w równych
              częściach. Drobne przesunięcie w górę/lewo — tylko w układzie
              dwukolumnowym (≥1200px) — zjada część górnego zapasu, żeby diagram
              wizualnie zbliżył się do wysokości nagłówka po lewej, nie wychodząc poza
              wiersz (zapas nad kolumną jest większy niż przesunięcie). */}
          <div className="w-full min-[1200px]:translate-x-[-15px] min-[1200px]:translate-y-[-25px]">
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
          </div>
        </div>
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

      <CurrentWorkGrid
        axes={axes}
        items={currentWork}
        filter={workFilter}
        onFilterChange={setWorkFilter}
        labels={labels}
      />

      {closing}
    </>
  );
}
