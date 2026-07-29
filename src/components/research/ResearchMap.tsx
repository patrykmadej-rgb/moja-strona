"use client";

import Image from "next/image";
import { useRef } from "react";
import type { LocalizedResearchAxis, ResearchAxisId } from "@/lib/research";
import { RESEARCH_MAP_NODE_POSITIONS } from "@/lib/research";
import { RESEARCH_AXIS_ICONS } from "./icons";
import AxisDetailContent from "./AxisDetailContent";
import { useRevealOnce } from "./useRevealOnce";

const NODE_ORDER: ResearchAxisId[] = ["balkans", "security", "profiling", "victimology", "clinical"];

// Współrzędne węzłów i linii przeskalowane ok. 0.56x bliżej środka (450,260)
// względem oryginalnych, żeby dopasować proporcje mapy do wzorca wizualnego
// (public/_reference/research-page-mockup.png) i zostawić margines: węzły nie
// mają wychodzić blisko krawędzi kontenera, etykiety mają mieć oddech od dołu.
// Musi zostać spójne z RESEARCH_MAP_NODE_POSITIONS w research.ts.
const CONNECTIONS: { axis: ResearchAxisId; d: string }[] = [
  { axis: "balkans", d: "M450 260C402 224 358 201 291 194" },
  { axis: "security", d: "M450 260C500 221 547 194 614 185" },
  { axis: "profiling", d: "M450 260C391 267 344 281 278 298" },
  { axis: "victimology", d: "M450 260C454 304 470 332 505 361" },
  { axis: "clinical", d: "M450 260C512 268 561 282 621 297" },
];

const SECONDARY_CONNECTIONS = [
  "M291 194C367 154 523 148 614 185",
  "M278 298C360 369 423 384 505 361",
  "M505 361C562 350 599 330 621 297",
];

const CONNECTION_DOTS = [
  { cx: 384, cy: 229, duration: 3.8 },
  { cx: 516, cy: 221, duration: 4.2 },
  { cx: 394, cy: 275, duration: 4.6 },
  { cx: 478, cy: 310, duration: 5 },
  { cx: 545, cy: 301, duration: 5.2 },
];

type Labels = {
  mapLabel: string;
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
      <p className="mb-3 hidden text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] min-[720px]:block dark:text-purple-400">
        {labels.mapLabel}
      </p>
      <div
        ref={ref}
        role="group"
        aria-label={labels.mapAriaLabel}
        className="@container relative mx-auto hidden aspect-[900/520] w-full min-[720px]:block"
      >
        {/* Warstwa 1: tło — bez twardej ramki/karty; maska radialna rozmywa krawędzie
            tak, żeby akwarela organicznie wtapiała się w tło strony (fallback
            gradientowy, dopóki nie podmienisz na research-map-background.png). */}
        <div
          className="absolute inset-0"
          style={{
            maskImage: "radial-gradient(ellipse 62% 68% at 50% 50%, black 40%, transparent 90%)",
            WebkitMaskImage: "radial-gradient(ellipse 62% 68% at 50% 50%, black 40%, transparent 90%)",
          }}
        >
          {hasBackgroundImage ? (
            <Image
              src="/research/research-map-background.png"
              alt=""
              fill
              priority
              loading="eager"
              sizes="(min-width: 720px) calc(100vw - 400px), 100vw"
              aria-hidden="true"
              className="object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="h-full w-full"
              style={{
                background:
                  "radial-gradient(circle at 32% 28%, var(--research-lavender-soft), var(--research-ivory) 55%, transparent 100%)",
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
          className="absolute top-1/2 left-1/2 w-[19%] -translate-x-1/2 -translate-y-1/2"
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
                transform: isFocused ? "translate(-50%, calc(-50% - 3px)) scale(1.04)" : "translate(-50%, -50%) scale(1)",
                transition: "opacity 250ms var(--research-ease), transform 250ms var(--research-ease)",
              }}
              className="group absolute flex flex-col items-center gap-1 rounded-research-md p-1.5 text-center outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-[var(--research-gold)]"
            >
              <span
                className="flex items-center justify-center rounded-full bg-[var(--research-paper)]"
                style={{
                  width: "clamp(30px, 8cqw, 90px)",
                  height: "clamp(30px, 8cqw, 90px)",
                  border: "1.5px solid",
                  borderColor: isFocused ? "var(--research-gold)" : "var(--research-amethyst)",
                  boxShadow: isFocused ? "0 0 0 5px rgba(195,154,59,.12)" : undefined,
                  color: isFocused ? "var(--research-plum-800)" : "var(--research-violet)",
                  transition: "border-color 250ms var(--research-ease), box-shadow 250ms var(--research-ease), color 250ms var(--research-ease)",
                }}
              >
                <Icon style={{ width: "clamp(15px, 4cqw, 46px)", height: "clamp(15px, 4cqw, 46px)" }} />
              </span>
              <span
                className="max-w-[10rem] leading-tight font-semibold text-[var(--research-plum-800)] dark:text-white"
                style={{ fontSize: "clamp(10px, 2.2cqw, 16px)" }}
              >
                {axis.shortTitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* ============ MOBILE (<720px): medalion + accordion pionowy ============ */}
      {/* id służy jako cel przewinięcia dla CTA "Poznaj moje obszary" na mobile,
          gdzie sekcja kart osi (#osie-badawcze) jest ukryta, żeby nie dublować treści. */}
      <div id="osie-badawcze-mobile" className="min-[720px]:hidden">
        <div className="relative mx-auto aspect-square w-40 overflow-hidden rounded-full">
          {hasBackgroundImage && (
            <Image
              src="/research/research-map-background.png"
              alt=""
              fill
              sizes="160px"
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
