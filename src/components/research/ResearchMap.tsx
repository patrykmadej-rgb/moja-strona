"use client";

import Image from "next/image";
import { useRef } from "react";
import type { LocalizedResearchAxis, ResearchAxisId } from "@/lib/research";
import { RESEARCH_MAP_NODE_POSITIONS } from "@/lib/research";
import { RESEARCH_AXIS_ICONS } from "./icons";
import AxisDetailContent from "./AxisDetailContent";
import { useRevealOnce } from "./useRevealOnce";

const NODE_ORDER: ResearchAxisId[] = ["balkans", "security", "profiling", "victimology", "clinical"];

// Viewbox 900x580, centrum (450,276) r=95, węzły r=43 — patrz komentarz przy
// RESEARCH_MAP_NODE_POSITIONS w research.ts dla pełnej geometrii i dla
// wyjaśnienia, dlaczego promienie orbit węzłów zostały zwiększone (naprawa
// "linie za krótkie / nie dochodzą do węzłów", najbardziej widoczna wcześniej
// przy wiktymologii — patrz tamten komentarz). Każda krzywa to kwadratowy
// Bézier (Q) liczony tak, żeby zaczynać się DOKŁADNIE na obwodzie centralnego
// koła i kończyć DOKŁADNIE na obwodzie węzła (nie w jego środku, nie w
// powietrzu przed nim) — punkt kontrolny przesunięty prostopadle do cięciwy o
// 9% jej długości (subtelniej niż poprzednio, bliżej niemal prostych linii z
// mockupu), naprzemiennie w lewo/prawo, żeby linie miały organiczny,
// lekko "wachlarzowy" wygląd zamiast sztywnych prostych. Promienie r=95/r=43
// BEZ ZMIAN — przy zmianie pozycji węzłów w RESEARCH_MAP_NODE_POSITIONS te
// krzywe MUSZĄ zostać przeliczone na nowo, inaczej linie zaczną się urywać
// przed (lub za) nowymi pozycjami okręgów.
const CONNECTIONS: { axis: ResearchAxisId; d: string }[] = [
  { axis: "balkans", d: "M372 222Q337 187 292 166" },
  { axis: "security", d: "M527 220Q558 187 599 167" },
  { axis: "profiling", d: "M365 319Q286 342 220 391" },
  { axis: "clinical", d: "M537 315Q614 334 680 379" },
  { axis: "victimology", d: "M450 371Q444 405 450 438" },
];

// Dwie szerokie orbity (górna, dolna) — czysto dekoracyjne, nie łączą
// konkretnych węzłów, tylko "obejmują" całą kompozycję łagodnym łukiem.
// Poszerzone o ~6% (skalowane wokół x=450) razem z rozsuniętą na zewnątrz
// kompozycją węzłów, żeby nadal wizualnie "obejmowały" cały diagram z zapasem.
const TOP_ORBIT = "M98 205C254 65 646 65 803 205";
const BOTTOM_ORBIT = "M87 385C259 560 642 560 813 385";

// Środek każdej krzywej z CONNECTIONS (t=0.5 na Q), jeden świecący punkt na linię.
const CONNECTION_DOTS = [
  { cx: 335, cy: 190, duration: 3.8 },
  { cx: 561, cy: 190, duration: 4.2 },
  { cx: 289, cy: 349, duration: 4.6 },
  { cx: 611, cy: 341, duration: 5 },
  { cx: 447, cy: 405, duration: 5.2 },
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
      <p className="mb-4 hidden text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] min-[720px]:block dark:text-purple-400">
        {labels.mapLabel}
      </p>
      {/* Wrapper "sceny" — hidden/min-[720px]:block tutaj (zamiast na samym
          ref-boxie poniżej), bo Warstwa 0 (tło) musi być SIOSTRĄ ref-boxa, nie
          jego dzieckiem: to jedyny sposób, żeby tło mogło być WIĘKSZE niż sam
          box mapy (900:580) i rozlewać się w przestrzeń wokół diagramu, zamiast
          kończyć się dokładnie na jego krawędzi (naprawa "tło wygląda jak
          osobny obrazek / ostro odcięty prostokąt pod samą mapą"). */}
      <div className="relative mx-auto hidden w-full min-[720px]:block">
        {/* Warstwa 0: tło — rozlane WYRAŹNIE szerzej niż ref-box mapy (ujemny
            inset), żeby wypełniało realną przestrzeń całej prawej kolumny hero,
            a nie tylko wąski prostokąt diagramu. Bez twardej ramki/karty; maska
            radialna rozmywa krawędzie na całym tym większym obszarze, więc
            NIGDZIE (nawet przy nowych, dalszych krawędziach) nie ma twardego
            odcięcia prostokąta — akwarela gaśnie do przezroczystości, zanim
            dotrze do brzegu tej rozszerzonej warstwy.
            pointer-events-none, bo to czysto dekoracyjna warstwa pod
            interaktywnym diagramem (guziki węzłów są w ref-boxie obok/nad nią). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-[9%] -inset-y-[15%] sm:-inset-x-[13%] sm:-inset-y-[19%]"
          style={{
            maskImage: "radial-gradient(ellipse 56% 56% at 50% 52%, black 20%, transparent 82%)",
            WebkitMaskImage: "radial-gradient(ellipse 56% 56% at 50% 52%, black 20%, transparent 82%)",
          }}
        >
          {hasBackgroundImage ? (
            <Image
              src="/research/research-map-background.png"
              alt=""
              fill
              priority
              loading="eager"
              sizes="(min-width: 1200px) 900px, 100vw"
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
          {/* Dodatkowa miękka fioletowa poświata pod centrum — wzmacnia pokrycie tła
              wokół medalionu i połączeń niezależnie od treści assetu PNG. */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 51%, rgba(107,58,145,0.19), transparent 62%)",
            }}
          />
        </div>

        <div
          ref={ref}
          role="group"
          aria-label={labels.mapAriaLabel}
          className="@container relative mx-auto aspect-[900/580] w-full"
        >
        {/* Warstwa 2: linie orbitalne (pod liniami połączeń) + Warstwa 3: linie połączeń */}
        <svg
          viewBox="0 0 900 580"
          fill="none"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
        >
          <g stroke="var(--research-gold)" strokeWidth={1.4} opacity={0.55} strokeDasharray="5 9" strokeLinecap="round">
            <path d={TOP_ORBIT} />
            <path d={BOTTOM_ORBIT} />
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

        {/* Warstwa 4: centralny medalion (dekoracyjny) — 21% szerokości kontenera,
            czyli promień r≈95 w jednostkach viewBox 900×580, spójne z promieniem Rc
            użytym do liczenia CONNECTIONS. top-[47.59%] zamiast top-1/2 (środek 276
            zamiast 290 w skali 580) — to jest to samo przesunięcie w górę, które
            dostały współrzędne w RESEARCH_MAP_NODE_POSITIONS/CONNECTIONS, rozmiar
            koła bez zmian. */}
        <div
          aria-hidden="true"
          className="absolute top-[47.59%] left-1/2 w-[21%] -translate-x-1/2 -translate-y-1/2"
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

        {/* Warstwa 5 + 6: węzły-przyciski z ikonami i etykietami HTML */}
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
                // Odstęp ikona→etykieta ~8-12px, żeby etykieta jeszcze bliżej
                // "przywierała" do węzła zamiast wyglądać jak osobny napis.
                gap: "clamp(8px, 1.3cqw, 12px)",
              }}
              className="group absolute flex flex-col items-center rounded-research-md p-1.5 text-center outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-[var(--research-gold)]"
            >
              <span
                className="flex items-center justify-center rounded-full bg-[var(--research-paper)]"
                style={{
                  // ~45-65px na desktopie (kontener query ok. 600-700px szerokości, +~12%
                  // względem poprzedniej wersji), lekko mniejsze na tablecie dzięki
                  // mniejszemu cqw, nigdy poniżej 45px.
                  width: "clamp(45px, 9cqw, 65px)",
                  height: "clamp(45px, 9cqw, 65px)",
                  border: "1.5px solid",
                  borderColor: isFocused ? "var(--research-gold)" : "var(--research-amethyst)",
                  boxShadow: isFocused
                    ? "0 0 0 5px rgba(195,154,59,.12)"
                    : "0 6px 16px rgba(40,19,55,.10)",
                  color: isFocused ? "var(--research-plum-800)" : "var(--research-violet)",
                  transition: "border-color 250ms var(--research-ease), box-shadow 250ms var(--research-ease), color 250ms var(--research-ease)",
                }}
              >
                <Icon style={{ width: "clamp(22px, 4.5cqw, 34px)", height: "clamp(22px, 4.5cqw, 34px)" }} />
              </span>
              <span
                className="max-w-[10.5rem] leading-tight font-semibold text-[var(--research-plum-800)] dark:text-white"
                style={{ fontSize: "clamp(10px, 2cqw, 15px)" }}
              >
                {axis.shortTitle}
              </span>
            </button>
          );
        })}
        </div>
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
