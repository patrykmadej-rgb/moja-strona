"use client";

import Image from "next/image";
import { useRef } from "react";
import type { LocalizedResearchAxis, ResearchAxisId } from "@/lib/research";
import { RESEARCH_MAP_NODE_POSITIONS } from "@/lib/research";
import { RESEARCH_AXIS_ICONS } from "./icons";
import AxisDetailContent from "./AxisDetailContent";
import { useRevealOnce } from "./useRevealOnce";

const NODE_ORDER: ResearchAxisId[] = ["balkans", "security", "profiling", "victimology", "clinical"];

const CONNECTIONS: { axis: ResearchAxisId; d: string }[] = [
  { axis: "balkans", d: "M450 260C365 195 285 155 166 143" },
  { axis: "security", d: "M450 260C540 190 624 143 742 126" },
  { axis: "profiling", d: "M450 260C345 272 260 298 142 327" },
  { axis: "victimology", d: "M450 260C458 338 485 388 548 440" },
  { axis: "clinical", d: "M450 260C560 275 648 300 755 326" },
];

const SECONDARY_CONNECTIONS = [
  "M166 143C302 70 581 60 742 126",
  "M142 327C290 455 402 482 548 440",
  "M548 440C650 420 716 385 755 326",
];

const CONNECTION_DOTS = [
  { cx: 333, cy: 205, duration: 3.8 },
  { cx: 568, cy: 190, duration: 4.2 },
  { cx: 350, cy: 286, duration: 4.6 },
  { cx: 500, cy: 350, duration: 5 },
  { cx: 620, cy: 286, duration: 5.2 },
];

type Labels = {
  mapAriaLabel: string;
  mapNodeOpenDetails: string;
  mapCenterLabel: string;
  mapMobileHint: string;
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
  hasBackgroundImage: boolean;
};

export default function ResearchMap({
  axes,
  activeAxis,
  hoveredAxis,
  onSelect,
  onHover,
  onSeeRelated,
  labels,
  hasBackgroundImage,
}: Props) {
  const { ref, revealed } = useRevealOnce<HTMLDivElement>();
  const nodeRefs = useRef<Partial<Record<ResearchAxisId, HTMLButtonElement | null>>>({});
  const focusAxis = hoveredAxis ?? activeAxis;
  const axisById = new Map(axes.map((a) => [a.id, a]));

  function focusNode(id: ResearchAxisId) {
    nodeRefs.current[id]?.focus();
  }

  function handleNodeKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, id: ResearchAxisId) {
    const idx = NODE_ORDER.indexOf(id);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      focusNode(NODE_ORDER[(idx + 1) % NODE_ORDER.length]);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      focusNode(NODE_ORDER[(idx - 1 + NODE_ORDER.length) % NODE_ORDER.length]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(id);
    }
  }

  return (
    <div data-reveal={revealed ? "in" : undefined} style={{ transitionDelay: "100ms" }}>
      {/* ============ DESKTOP / TABLET: scena z warstwami ============ */}
      <div
        ref={ref}
        role="group"
        aria-label={labels.mapAriaLabel}
        className="relative mx-auto hidden aspect-[900/520] w-full max-w-[560px] min-[720px]:block lg:max-w-none"
      >
        {/* Warstwa 1: tło rastrowe (fallback gradientowy, dopóki nie podmienisz na research-map-background.png) */}
        <div className="absolute inset-0 overflow-hidden rounded-research-lg">
          {hasBackgroundImage ? (
            <Image
              src="/research/research-map-background.png"
              alt=""
              fill
              priority
              aria-hidden="true"
              className="object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="h-full w-full"
              style={{
                background:
                  "radial-gradient(circle at 32% 28%, var(--research-lavender-soft), var(--research-ivory) 55%, var(--research-paper) 100%)",
              }}
            />
          )}
        </div>

        {/* Warstwa 2: linie połączeń */}
        <svg
          viewBox="0 0 900 520"
          fill="none"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
        >
          <g stroke="var(--research-gold)" strokeWidth={1.5} opacity={0.65} strokeDasharray="5 9">
            {SECONDARY_CONNECTIONS.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          {CONNECTIONS.map((line) => {
            const isFocused = focusAxis === line.axis;
            const isDimmed = focusAxis !== null && !isFocused;
            return (
              <path
                key={line.axis}
                d={line.d}
                stroke="var(--research-violet)"
                strokeLinecap="round"
                style={{
                  opacity: isDimmed ? 0.38 : isFocused ? 1 : 0.7,
                  strokeWidth: isFocused ? 3 : 2,
                  transition: "opacity 250ms var(--research-ease), stroke-width 250ms var(--research-ease)",
                }}
              />
            );
          })}
          <g fill="var(--research-gold)">
            {CONNECTION_DOTS.map((dot, i) => (
              <circle
                key={i}
                cx={dot.cx}
                cy={dot.cy}
                r={4}
                style={{
                  animation: `research-dot-glow ${dot.duration}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                  opacity: focusAxis !== null ? 0.38 : undefined,
                }}
              />
            ))}
          </g>
        </svg>

        {/* Warstwa 3: centralny medalion (dekoracyjny) */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 w-[24%] -translate-x-1/2 -translate-y-1/2"
          style={{ animation: "research-breathe 5.5s ease-in-out infinite" }}
        >
          <Image
            src="/research/research-map-center.svg"
            alt=""
            width={220}
            height={220}
            aria-hidden="true"
            className="h-auto w-full"
          />
        </div>

        {/* Warstwa 4 + 5: węzły-przyciski z ikonami i etykietami HTML */}
        {axes.map((axis) => {
          const pos = RESEARCH_MAP_NODE_POSITIONS[axis.id];
          const Icon = RESEARCH_AXIS_ICONS[axis.id];
          const isActive = activeAxis === axis.id;
          const isFocused = focusAxis === axis.id;
          const isDimmed = focusAxis !== null && !isFocused;
          return (
            <button
              key={axis.id}
              type="button"
              ref={(el) => {
                nodeRefs.current[axis.id] = el;
              }}
              aria-pressed={isActive}
              aria-controls="research-detail"
              aria-label={`${axis.title} — ${labels.mapNodeOpenDetails}`}
              onClick={() => onSelect(axis.id)}
              onMouseEnter={() => onHover(axis.id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(axis.id)}
              onBlur={() => onHover(null)}
              onKeyDown={(e) => handleNodeKeyDown(e, axis.id)}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                opacity: isDimmed ? 0.38 : 1,
                transform: isFocused ? "translate(-50%, calc(-50% - 4px)) scale(1.04)" : "translate(-50%, -50%) scale(1)",
                transition: "opacity 250ms var(--research-ease), transform 250ms var(--research-ease)",
              }}
              className="group absolute flex flex-col items-center gap-1.5 rounded-research-md p-2 text-center outline-none focus-visible:ring-[3px] focus-visible:ring-offset-4 focus-visible:ring-[var(--research-gold)]"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 bg-[var(--research-paper)] shadow-[var(--research-shadow)]"
                style={{
                  borderColor: isFocused ? "var(--research-gold)" : "var(--research-amethyst)",
                  boxShadow: isFocused ? "0 0 0 7px rgba(195,154,59,.12)" : undefined,
                  color: isFocused ? "var(--research-plum-800)" : "var(--research-violet)",
                  transition: "border-color 250ms var(--research-ease), box-shadow 250ms var(--research-ease), color 250ms var(--research-ease)",
                }}
              >
                <Icon className="h-[22px] w-[22px]" />
              </span>
              <span className="max-w-[7.5rem] text-[11px] leading-tight font-semibold text-[var(--research-plum-800)] dark:text-white">
                {axis.shortTitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* ============ MOBILE (<720px): medalion + accordion pionowy ============ */}
      <div className="min-[720px]:hidden">
        <div className="relative mx-auto aspect-square w-40 overflow-hidden rounded-full">
          {hasBackgroundImage && (
            <Image
              src="/research/research-map-background.png"
              alt=""
              fill
              aria-hidden="true"
              className="object-cover opacity-35"
            />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ animation: "research-breathe 5.5s ease-in-out infinite" }}
          >
            <Image src="/research/research-map-center.svg" alt="" width={220} height={220} className="h-full w-full" />
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-[#4A3360] dark:text-neutral-400">{labels.mapMobileHint}</p>

        <div className="mt-5 divide-y divide-[var(--research-line)] rounded-research-lg border border-[var(--research-line)] bg-[var(--research-paper)] dark:divide-white/10 dark:border-white/10 dark:bg-neutral-900">
          {axes.map((axis) => {
            const Icon = RESEARCH_AXIS_ICONS[axis.id];
            const isActive = activeAxis === axis.id;
            return (
              <div key={axis.id}>
                <button
                  type="button"
                  aria-expanded={isActive}
                  aria-controls={`research-detail-mobile-${axis.id}`}
                  onClick={() => onSelect(axis.id)}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2"
                    style={{
                      borderColor: isActive ? "var(--research-gold)" : "var(--research-amethyst)",
                      color: isActive ? "var(--research-plum-800)" : "var(--research-violet)",
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold tracking-[0.15em] text-[var(--research-gold)]">
                      {axis.number}
                    </span>
                    <span className="block font-semibold text-[#1C1028] dark:text-white">{axis.shortTitle}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-[var(--research-violet)] transition-transform"
                    style={{ transform: isActive ? "rotate(180deg)" : undefined }}
                  >
                    ↓
                  </span>
                </button>
                <div
                  id={`research-detail-mobile-${axis.id}`}
                  className="grid px-4"
                  style={{
                    gridTemplateRows: isActive ? "1fr" : "0fr",
                    transition: "grid-template-rows 380ms var(--research-ease)",
                  }}
                >
                  <div className="overflow-hidden">
                    {isActive && (
                      <AxisDetailContent
                        axis={axisById.get(axis.id) as LocalizedResearchAxis}
                        labels={labels}
                        onSeeRelated={onSeeRelated}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
