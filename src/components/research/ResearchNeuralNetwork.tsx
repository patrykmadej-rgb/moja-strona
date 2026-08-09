"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ResearchDirectionId } from "@/lib/research-directions";

type NetNode = {
  id: string;
  x: number;
  y: number;
  r: number;
  kind: "small" | "large";
  /** null = węzeł "ambientowy" na moście między skupiskami (nie należy do
   * żadnego pojedynczego kierunku, więc nigdy nie dostaje data-active). */
  direction: ResearchDirectionId | null;
};
type NetPath = {
  id: string;
  d: string;
  direction: ResearchDirectionId | null;
  kind: "primary" | "secondary" | "tertiary" | "active";
  /** Bardzo powolny, subtelny "oddech" opacity — tylko na 2-3 głównych
   * połączeniach (01-02, 02-03, 03-04), nie na wszystkich elementach naraz. */
  flow?: boolean;
};

/**
 * PUNKTY STYKU: pięć "hubów" (jeden na kierunek, 04/"prevention" ma
 * dwa wewnętrzne pod-skupiska) wyznaczonych DOKŁADNIE pod środkami czterech
 * kół na /badania — współrzędne zmierzone empirycznie (Playwright,
 * viewport 1440px, przeliczone z px na jednostki viewBox 1440×730 tej
 * samej skali) i zweryfikowane tak, żeby węzły klastra faktycznie leżały
 * pod odpowiadającym kołem, nie obok niego:
 *   01 (separatism): hub (186,514)
 *   02 (profiling):  hub (688,224)
 *   03 (threats):    hub (609,520)
 *   04 (prevention): hub-a (1087,313), hub-b (1317,483)
 * Każdy klaster to stabilne, ręcznie zdefiniowane współrzędne (NIE
 * Math.random) — sieć wygląda identycznie przy każdym renderze/wejściu na
 * stronę, bez ryzyka hydration mismatch. Gałęzie łączące kluby (p16-p21)
 * zaczynają/kończą się DOKŁADNIE w punktach odpowiadających
 * .research-hex-connector--a/--b/--c w globals.css (patrz tam) — koło ma
 * min. dwa widoczne punkty styku (02 — trzy).
 */
const NODES: NetNode[] = [
  { id: "n0", x: 186.0, y: 514.0, r: 4.6, kind: "large", direction: "separatism" },
  { id: "n1", x: 215.1, y: 559.4, r: 3.8, kind: "large", direction: "separatism" },
  { id: "n2", x: 177.3, y: 560.3, r: 1.4, kind: "small", direction: "separatism" },
  { id: "n3", x: 42.5, y: 565.4, r: 1.5, kind: "small", direction: "separatism" },
  { id: "n4", x: 151.2, y: 589.2, r: 1.4, kind: "small", direction: "separatism" },
  { id: "n5", x: 223.1, y: 497.2, r: 2.4, kind: "small", direction: "separatism" },
  { id: "n6", x: 144.6, y: 489.4, r: 1.6, kind: "small", direction: "separatism" },
  { id: "n7", x: 252.6, y: 485.1, r: 1.5, kind: "small", direction: "separatism" },
  { id: "n8", x: 115.4, y: 402.1, r: 2.2, kind: "small", direction: "separatism" },
  { id: "n9", x: 261.5, y: 560.7, r: 2.5, kind: "small", direction: "separatism" },
  { id: "n10", x: 208.7, y: 492.2, r: 2.2, kind: "small", direction: "separatism" },
  { id: "n11", x: 293.2, y: 541.0, r: 2.6, kind: "small", direction: "separatism" },
  { id: "n12", x: 688.0, y: 224.0, r: 4.6, kind: "large", direction: "profiling" },
  { id: "n13", x: 683.5, y: 173.0, r: 3.8, kind: "large", direction: "profiling" },
  { id: "n14", x: 659.4, y: 304.2, r: 2.4, kind: "small", direction: "profiling" },
  { id: "n15", x: 679.6, y: 126.3, r: 2, kind: "small", direction: "profiling" },
  { id: "n16", x: 597.1, y: 159.4, r: 2.5, kind: "small", direction: "profiling" },
  { id: "n17", x: 716.8, y: 244.7, r: 2, kind: "small", direction: "profiling" },
  { id: "n18", x: 783.1, y: 249.9, r: 1.7, kind: "small", direction: "profiling" },
  { id: "n19", x: 712.3, y: 282.1, r: 2.2, kind: "small", direction: "profiling" },
  { id: "n20", x: 611.7, y: 227.0, r: 2, kind: "small", direction: "profiling" },
  { id: "n21", x: 585.6, y: 250.0, r: 1.9, kind: "small", direction: "profiling" },
  { id: "n22", x: 736.8, y: 273.0, r: 1.4, kind: "small", direction: "profiling" },
  { id: "n23", x: 860.1, y: 242.7, r: 2.5, kind: "small", direction: "profiling" },
  { id: "n24", x: 609.0, y: 520.0, r: 4.6, kind: "large", direction: "threats" },
  { id: "n25", x: 531.3, y: 496.7, r: 3.8, kind: "large", direction: "threats" },
  { id: "n26", x: 715.4, y: 599.7, r: 2.5, kind: "small", direction: "threats" },
  { id: "n27", x: 533.7, y: 473.1, r: 2.1, kind: "small", direction: "threats" },
  { id: "n28", x: 653.7, y: 404.4, r: 2.3, kind: "small", direction: "threats" },
  { id: "n29", x: 645.5, y: 583.5, r: 2.1, kind: "small", direction: "threats" },
  { id: "n30", x: 680.9, y: 611.8, r: 2.3, kind: "small", direction: "threats" },
  { id: "n31", x: 696.4, y: 560.0, r: 2.4, kind: "small", direction: "threats" },
  { id: "n32", x: 794.7, y: 514.4, r: 1.7, kind: "small", direction: "threats" },
  { id: "n33", x: 699.9, y: 548.8, r: 1.5, kind: "small", direction: "threats" },
  { id: "n34", x: 648.4, y: 444.7, r: 2.5, kind: "small", direction: "threats" },
  { id: "n35", x: 515.3, y: 572.5, r: 2.6, kind: "small", direction: "threats" },
  { id: "n36", x: 1087.0, y: 313.0, r: 4.6, kind: "large", direction: "prevention" },
  { id: "n37", x: 1006.9, y: 329.4, r: 3.8, kind: "large", direction: "prevention" },
  { id: "n38", x: 1088.3, y: 263.6, r: 2.1, kind: "small", direction: "prevention" },
  { id: "n39", x: 1139.8, y: 257.5, r: 2.5, kind: "small", direction: "prevention" },
  { id: "n40", x: 900.5, y: 314.7, r: 2.1, kind: "small", direction: "prevention" },
  { id: "n41", x: 1109.7, y: 334.4, r: 2.2, kind: "small", direction: "prevention" },
  { id: "n42", x: 960.4, y: 382.7, r: 2.1, kind: "small", direction: "prevention" },
  { id: "n43", x: 1039.0, y: 229.8, r: 1.6, kind: "small", direction: "prevention" },
  { id: "n44", x: 1223.8, y: 272.3, r: 2.3, kind: "small", direction: "prevention" },
  { id: "n45", x: 1138.4, y: 352.3, r: 2.4, kind: "small", direction: "prevention" },
  { id: "n46", x: 1028.2, y: 240.8, r: 2.5, kind: "small", direction: "prevention" },
  { id: "n47", x: 1040.2, y: 349.7, r: 1.6, kind: "small", direction: "prevention" },
  { id: "n48", x: 1317.0, y: 483.0, r: 4.6, kind: "large", direction: "prevention" },
  { id: "n49", x: 1301.9, y: 557.6, r: 3.8, kind: "large", direction: "prevention" },
  { id: "n50", x: 1207.4, y: 560.2, r: 1.4, kind: "small", direction: "prevention" },
  { id: "n51", x: 1264.4, y: 422.4, r: 2.4, kind: "small", direction: "prevention" },
  { id: "n52", x: 1428.0, y: 523.3, r: 1.9, kind: "small", direction: "prevention" },
  { id: "n53", x: 1397.7, y: 501.7, r: 1.4, kind: "small", direction: "prevention" },
  { id: "n54", x: 1322.1, y: 523.9, r: 1.6, kind: "small", direction: "prevention" },
  { id: "n55", x: 1170.9, y: 541.9, r: 2.5, kind: "small", direction: "prevention" },
  { id: "n56", x: 1271.9, y: 570.7, r: 2.3, kind: "small", direction: "prevention" },
  { id: "n57", x: 1218.8, y: 552.1, r: 1.4, kind: "small", direction: "prevention" },
  { id: "n58", x: 1251.3, y: 514.6, r: 1.9, kind: "small", direction: "prevention" },
  { id: "n59", x: 1260.8, y: 452.7, r: 2.4, kind: "small", direction: "prevention" },
  // --- Gałąź za prawą krawędzią koła 04 (żądanie: "za prawą stroną koła 04") ---
  { id: "n68", x: 1410, y: 385, r: 2.0, kind: "small", direction: null },
  { id: "n69", x: 1400, y: 480, r: 1.7, kind: "small", direction: null },
  // --- Bardzo delikatne wypełnienie pustych przestrzeni (między kołami i po
  // prawej stronie sekcji) — pojedyncze, subtelne punkty, nie kolejne skupiska. ---
  { id: "n70", x: 420, y: 460, r: 1.8, kind: "small", direction: null },
  { id: "n71", x: 900, y: 180, r: 1.6, kind: "small", direction: null },
  { id: "n72", x: 950, y: 550, r: 1.8, kind: "small", direction: null },
  { id: "n73", x: 1250, y: 250, r: 1.5, kind: "small", direction: null },
  { id: "n74", x: 340, y: 330, r: 1.4, kind: "small", direction: null },
  { id: "n75", x: 1150, y: 550, r: 1.8, kind: "small", direction: null },
];

const PATHS: NetPath[] = [
  { id: "p0", d: "M186.0,514.0 Q201.0,540.8 177.3,560.3", direction: "separatism", kind: "active" },
  { id: "p1", d: "M186.0,514.0 Q205.4,507.6 223.1,497.2", direction: "separatism", kind: "primary" },
  { id: "p2", d: "M186.0,514.0 Q161.5,451.2 115.4,402.1", direction: "separatism", kind: "primary" },
  { id: "p3", d: "M688.0,224.0 Q691.0,270.3 659.4,304.2", direction: "profiling", kind: "active" },
  { id: "p4", d: "M688.0,224.0 Q701.5,235.6 716.8,244.7", direction: "profiling", kind: "primary" },
  { id: "p5", d: "M688.0,224.0 Q649.5,215.4 611.7,227.0", direction: "profiling", kind: "primary" },
  { id: "p6", d: "M609.0,520.0 Q671.0,548.1 715.4,599.7", direction: "threats", kind: "active" },
  { id: "p7", d: "M609.0,520.0 Q615.3,456.0 653.7,404.4", direction: "threats", kind: "primary" },
  { id: "p8", d: "M609.0,520.0 Q647.1,552.2 696.4,560.0", direction: "threats", kind: "primary" },
  { id: "p9", d: "M609.0,520.0 Q620.3,477.9 648.4,444.7", direction: "threats", kind: "primary" },
  { id: "p10", d: "M1087.0,313.0 Q1063.0,287.7 1088.3,263.6", direction: "prevention", kind: "active" },
  { id: "p11", d: "M1087.0,313.0 Q1101.1,320.7 1109.7,334.4", direction: "prevention", kind: "primary" },
  { id: "p12", d: "M1087.0,313.0 Q1152.1,281.6 1223.8,272.3", direction: "prevention", kind: "primary" },
  { id: "p13", d: "M1317.0,483.0 Q1265.9,526.9 1207.4,560.2", direction: "prevention", kind: "active" },
  { id: "p14", d: "M1317.0,483.0 Q1362.1,471.9 1397.7,501.7", direction: "prevention", kind: "primary" },
  { id: "p15", d: "M1317.0,483.0 Q1316.3,538.1 1271.9,570.7", direction: "prevention", kind: "primary" },
  // --- Główny łańcuch między kołami (01→02→03→04), zaczepiony DOKŁADNIE w
  // punktach .research-hex-connector--a/--b/--c z globals.css. Organiczne
  // krzywe (Q-bezier z przesuniętym punktem kontrolnym), nie proste
  // odcinki jak na schemacie blokowym. ---
  { id: "p16", d: "M266.4,418.3 Q460,330 564.4,294.8", direction: null, kind: "primary", flow: true },
  { id: "p17", d: "M687.8,366.5 Q650,384 609,401.5", direction: null, kind: "primary", flow: true },
  { id: "p18", d: "M724.1,496.1 Q900,460 1079.3,398.5", direction: null, kind: "primary", flow: true },
  { id: "p19", d: "M1087.0,313.0 Q1217.2,377.5 1317.0,483.0", direction: "prevention", kind: "secondary" },
  // Bezpośrednie, drugorzędne "skróty" — 01-03 i 02-04.
  { id: "p20", d: "M311.9,514 Q460,500 550,480", direction: null, kind: "secondary" },
  { id: "p21", d: "M822.7,269.4 Q950,330 1079.3,398.5", direction: null, kind: "secondary" },
  // Gałąź za prawą krawędzią koła 04.
  { id: "p32", d: "M1317.4,440.4 Q1370,410 1410,385", direction: null, kind: "secondary" },
  { id: "p33", d: "M1410,385 Q1440,430 1400,480", direction: null, kind: "tertiary" },
  // --- Bardzo delikatne wypełnienie pustych przestrzeni (kind:"tertiary" —
  // najcieńsze, najbledsze włókna, patrz .research-neural-path--tertiary). ---
  { id: "p34", d: "M420,460 Q460,420 500,480", direction: null, kind: "tertiary" },
  { id: "p35", d: "M900,180 Q930,210 950,250", direction: null, kind: "tertiary" },
  { id: "p36", d: "M900,500 Q950,530 1000,545", direction: null, kind: "tertiary" },
  { id: "p37", d: "M1250,250 Q1290,270 1320,300", direction: null, kind: "tertiary" },
];

/** 5 punktów pulsujących pierścieni = 5 hubów skupisk (pod środkami kół). */
const RINGS: { x: number; y: number; direction: ResearchDirectionId }[] = [
  { x: 186, y: 514, direction: "separatism" },
  { x: 688, y: 224, direction: "profiling" },
  { x: 609, y: 520, direction: "threats" },
  { x: 1087, y: 313, direction: "prevention" },
  { x: 1317, y: 483, direction: "prevention" },
];

/** 5 impulsów poruszających się po wybranych ścieżkach (SMIL animateMotion). */
const IMPULSES: { pathId: string; r: number; color: "gold" | "lavender"; dur: number; delay: number }[] = [
  { pathId: "p16", r: 3.4, color: "gold", dur: 9, delay: 0 },
  { pathId: "p17", r: 2.8, color: "lavender", dur: 11, delay: 2.4 },
  { pathId: "p18", r: 3.2, color: "gold", dur: 8, delay: 4.8 },
  { pathId: "p19", r: 2.6, color: "lavender", dur: 10, delay: 1.2 },
  { pathId: "p20", r: 3, color: "gold", dur: 12, delay: 6 },
];

const pathById = new Map(PATHS.map((p) => [p.id, p]));

/** useSyncExternalStore zamiast setState w useEffect: React-owy, SSR-bezpieczny
 * sposób subskrypcji zewnętrznego API przeglądarki (matchMedia) — bez ryzyka
 * "cascading render" (reguła react-hooks/set-state-in-effect) i bez hydration
 * mismatch (serwer zawsze dostaje getServerSnapshot=false). */
function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function getReducedMotionServerSnapshot() {
  return false;
}

type Props = {
  activeDirection: ResearchDirectionId | null;
};

export default function ResearchNeuralNetwork({ activeDirection }: Props) {
  const wrapperRef = useRef<SVGSVGElement | null>(null);
  const [inView, setInView] = useState(true);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const dimAll = activeDirection !== null;

  return (
    <svg
      ref={wrapperRef}
      aria-hidden="true"
      viewBox="0 0 1440 730"
      preserveAspectRatio="xMidYMid slice"
      className="research-neural-network pointer-events-none absolute inset-0 z-[1] h-full w-full"
      data-paused={!inView ? "true" : undefined}
    >
      <defs>
        <filter id="research-neural-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      <g>
        {PATHS.map((p) => {
          const isActiveGroup = activeDirection !== null && p.direction === activeDirection;
          const isDimmed = dimAll && !isActiveGroup;
          return (
            <path
              key={p.id}
              d={p.d}
              className={`research-neural-path research-neural-path--${p.kind}`}
              data-active={isActiveGroup ? "true" : undefined}
              data-dimmed={isDimmed ? "true" : undefined}
              data-flow={p.flow && !reducedMotion ? "true" : undefined}
            />
          );
        })}
      </g>

      <g>
        {NODES.map((n, i) => {
          const isActiveGroup = activeDirection !== null && n.direction === activeDirection;
          const isDimmed = dimAll && !isActiveGroup;
          return (
            <circle
              key={n.id}
              cx={n.x}
              cy={n.y}
              r={n.r}
              className={`research-neural-node research-neural-node--${n.kind}`}
              data-active={isActiveGroup ? "true" : undefined}
              data-dimmed={isDimmed ? "true" : undefined}
              style={n.kind === "large" ? { animationDelay: `${(i % 7) * 0.55}s` } : undefined}
              filter={n.kind === "large" ? "url(#research-neural-glow)" : undefined}
            />
          );
        })}
      </g>

      <g>
        {RINGS.map((ring, i) => {
          const isActiveGroup = activeDirection !== null && ring.direction === activeDirection;
          return (
            <circle
              key={i}
              cx={ring.x}
              cy={ring.y}
              r="9"
              className="research-neural-ring"
              data-active={isActiveGroup ? "true" : undefined}
              style={{ animationDelay: `${i * 0.75}s` }}
            />
          );
        })}
      </g>

      {!reducedMotion && (
        <g>
          {IMPULSES.map((imp, i) => {
            const path = pathById.get(imp.pathId);
            if (!path) return null;
            return (
              <circle
                key={i}
                r={imp.r}
                className={`research-neural-impulse research-neural-impulse--${imp.color}`}
                filter="url(#research-neural-glow)"
              >
                <animateMotion dur={`${imp.dur}s`} begin={`${imp.delay}s`} repeatCount="indefinite" path={path.d} />
              </circle>
            );
          })}
        </g>
      )}
    </svg>
  );
}
