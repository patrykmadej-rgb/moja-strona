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
  kind: "primary" | "secondary" | "active";
};

/**
 * Stabilne, ręcznie zdefiniowane współrzędne (wygenerowane raz, offline, przez
 * deterministyczną funkcję sin-hash — NIE Math.random) — sieć wygląda identycznie
 * przy każdym renderze/wejściu na stronę, bez ryzyka hydration mismatch.
 * 5 skupisk (separatism/profiling/threats/prevention×2) wokół stabilnych
 * "hubów": (240,330) (520,220) (700,510) (990,330) (1220,500) — zgodnie ze
 * specyfikacją. 60 węzłów (50 małych + 10 większych, po 2 na skupisko) i 22
 * organiczne krzywe (Q-bezier z przesuniętym punktem kontrolnym — dendryty,
 * nie proste odcinki): 16 gałęzi wewnątrz skupisk + 6 "mostów" między nimi.
 */
const NODES: NetNode[] = [
  { id: "n0", x: 240, y: 330, r: 4.6, kind: "large", direction: "separatism" },
  { id: "n1", x: 269.1, y: 375.4, r: 3.8, kind: "large", direction: "separatism" },
  { id: "n2", x: 231.3, y: 376.3, r: 1.4, kind: "small", direction: "separatism" },
  { id: "n3", x: 96.5, y: 381.4, r: 1.5, kind: "small", direction: "separatism" },
  { id: "n4", x: 205.2, y: 405.2, r: 1.4, kind: "small", direction: "separatism" },
  { id: "n5", x: 277.1, y: 313.2, r: 2.4, kind: "small", direction: "separatism" },
  { id: "n6", x: 198.6, y: 305.4, r: 1.6, kind: "small", direction: "separatism" },
  { id: "n7", x: 306.6, y: 301.1, r: 1.5, kind: "small", direction: "separatism" },
  { id: "n8", x: 169.4, y: 218.1, r: 2.2, kind: "small", direction: "separatism" },
  { id: "n9", x: 315.5, y: 376.7, r: 2.5, kind: "small", direction: "separatism" },
  { id: "n10", x: 262.7, y: 308.2, r: 2.2, kind: "small", direction: "separatism" },
  { id: "n11", x: 347.2, y: 357, r: 2.6, kind: "small", direction: "separatism" },
  { id: "n12", x: 520, y: 220, r: 4.6, kind: "large", direction: "profiling" },
  { id: "n13", x: 515.5, y: 169, r: 3.8, kind: "large", direction: "profiling" },
  { id: "n14", x: 491.4, y: 300.2, r: 2.4, kind: "small", direction: "profiling" },
  { id: "n15", x: 511.6, y: 122.3, r: 2, kind: "small", direction: "profiling" },
  { id: "n16", x: 429.1, y: 155.4, r: 2.5, kind: "small", direction: "profiling" },
  { id: "n17", x: 548.8, y: 240.7, r: 2, kind: "small", direction: "profiling" },
  { id: "n18", x: 615.1, y: 245.9, r: 1.7, kind: "small", direction: "profiling" },
  { id: "n19", x: 544.3, y: 278.1, r: 2.2, kind: "small", direction: "profiling" },
  { id: "n20", x: 443.7, y: 223, r: 2, kind: "small", direction: "profiling" },
  { id: "n21", x: 417.6, y: 246, r: 1.9, kind: "small", direction: "profiling" },
  { id: "n22", x: 568.8, y: 269, r: 1.4, kind: "small", direction: "profiling" },
  { id: "n23", x: 692.1, y: 238.7, r: 2.5, kind: "small", direction: "profiling" },
  { id: "n24", x: 700, y: 510, r: 4.6, kind: "large", direction: "threats" },
  { id: "n25", x: 622.3, y: 486.7, r: 3.8, kind: "large", direction: "threats" },
  { id: "n26", x: 806.4, y: 589.7, r: 2.5, kind: "small", direction: "threats" },
  { id: "n27", x: 624.7, y: 463.1, r: 2.1, kind: "small", direction: "threats" },
  { id: "n28", x: 744.7, y: 394.4, r: 2.3, kind: "small", direction: "threats" },
  { id: "n29", x: 736.5, y: 573.5, r: 2.1, kind: "small", direction: "threats" },
  { id: "n30", x: 771.9, y: 601.8, r: 2.3, kind: "small", direction: "threats" },
  { id: "n31", x: 787.4, y: 550, r: 2.4, kind: "small", direction: "threats" },
  { id: "n32", x: 885.7, y: 504.4, r: 1.7, kind: "small", direction: "threats" },
  { id: "n33", x: 790.9, y: 538.8, r: 1.5, kind: "small", direction: "threats" },
  { id: "n34", x: 739.4, y: 434.7, r: 2.5, kind: "small", direction: "threats" },
  { id: "n35", x: 606.3, y: 562.5, r: 2.6, kind: "small", direction: "threats" },
  { id: "n36", x: 990, y: 330, r: 4.6, kind: "large", direction: "prevention" },
  { id: "n37", x: 909.9, y: 346.4, r: 3.8, kind: "large", direction: "prevention" },
  { id: "n38", x: 991.3, y: 280.6, r: 2.1, kind: "small", direction: "prevention" },
  { id: "n39", x: 1042.8, y: 274.5, r: 2.5, kind: "small", direction: "prevention" },
  { id: "n40", x: 803.5, y: 331.7, r: 2.1, kind: "small", direction: "prevention" },
  { id: "n41", x: 1012.7, y: 351.4, r: 2.2, kind: "small", direction: "prevention" },
  { id: "n42", x: 863.4, y: 399.7, r: 2.1, kind: "small", direction: "prevention" },
  { id: "n43", x: 942, y: 246.8, r: 1.6, kind: "small", direction: "prevention" },
  { id: "n44", x: 1126.8, y: 289.3, r: 2.3, kind: "small", direction: "prevention" },
  { id: "n45", x: 1041.4, y: 369.3, r: 2.4, kind: "small", direction: "prevention" },
  { id: "n46", x: 931.2, y: 257.8, r: 2.5, kind: "small", direction: "prevention" },
  { id: "n47", x: 943.2, y: 366.7, r: 1.6, kind: "small", direction: "prevention" },
  { id: "n48", x: 1220, y: 500, r: 4.6, kind: "large", direction: "prevention" },
  { id: "n49", x: 1204.9, y: 574.6, r: 3.8, kind: "large", direction: "prevention" },
  { id: "n50", x: 1110.4, y: 577.2, r: 1.4, kind: "small", direction: "prevention" },
  { id: "n51", x: 1167.4, y: 439.4, r: 2.4, kind: "small", direction: "prevention" },
  { id: "n52", x: 1331, y: 540.3, r: 1.9, kind: "small", direction: "prevention" },
  { id: "n53", x: 1300.7, y: 518.7, r: 1.4, kind: "small", direction: "prevention" },
  { id: "n54", x: 1225.1, y: 540.9, r: 1.6, kind: "small", direction: "prevention" },
  { id: "n55", x: 1073.9, y: 558.9, r: 2.5, kind: "small", direction: "prevention" },
  { id: "n56", x: 1174.9, y: 587.7, r: 2.3, kind: "small", direction: "prevention" },
  { id: "n57", x: 1121.8, y: 569.1, r: 1.4, kind: "small", direction: "prevention" },
  { id: "n58", x: 1154.3, y: 531.6, r: 1.9, kind: "small", direction: "prevention" },
  { id: "n59", x: 1163.8, y: 469.7, r: 2.4, kind: "small", direction: "prevention" },
  // --- Dogęszczenie sieci (druga iteracja): węzły "ambientowe" (direction:
  // null) wzmacniające widoczność w pięciu wskazanych strefach — za
  // nagłówkiem, między 01-02, między 02-04, pod 03, przy prawej krawędzi.
  { id: "n60", x: 120, y: 100, r: 2.0, kind: "small", direction: null },
  { id: "n61", x: 280, y: 90, r: 1.8, kind: "small", direction: null },
  { id: "n62", x: 330, y: 180, r: 3.4, kind: "large", direction: null },
  { id: "n63", x: 430, y: 290, r: 1.8, kind: "small", direction: null },
  { id: "n64", x: 780, y: 260, r: 3.4, kind: "large", direction: null },
  { id: "n65", x: 850, y: 310, r: 1.8, kind: "small", direction: null },
  { id: "n66", x: 655, y: 610, r: 2.2, kind: "small", direction: null },
  { id: "n67", x: 740, y: 660, r: 1.7, kind: "small", direction: null },
  { id: "n68", x: 1370, y: 410, r: 2.0, kind: "small", direction: null },
  { id: "n69", x: 1400, y: 540, r: 1.7, kind: "small", direction: null },
];

const PATHS: NetPath[] = [
  { id: "p0", d: "M240,330 Q255,356.8 231.3,376.3", direction: "separatism", kind: "active" },
  { id: "p1", d: "M240,330 Q259.4,323.6 277.1,313.2", direction: "separatism", kind: "primary" },
  { id: "p2", d: "M240,330 Q215.5,267.2 169.4,218.1", direction: "separatism", kind: "primary" },
  { id: "p3", d: "M520,220 Q523,266.3 491.4,300.2", direction: "profiling", kind: "active" },
  { id: "p4", d: "M520,220 Q533.5,231.6 548.8,240.7", direction: "profiling", kind: "primary" },
  { id: "p5", d: "M520,220 Q481.5,211.4 443.7,223", direction: "profiling", kind: "primary" },
  { id: "p6", d: "M700,510 Q762,538.1 806.4,589.7", direction: "threats", kind: "active" },
  { id: "p7", d: "M700,510 Q706.3,446 744.7,394.4", direction: "threats", kind: "primary" },
  { id: "p8", d: "M700,510 Q738.1,542.2 787.4,550", direction: "threats", kind: "primary" },
  { id: "p9", d: "M700,510 Q711.3,467.9 739.4,434.7", direction: "threats", kind: "primary" },
  { id: "p10", d: "M990,330 Q966,304.7 991.3,280.6", direction: "prevention", kind: "active" },
  { id: "p11", d: "M990,330 Q1004.1,337.7 1012.7,351.4", direction: "prevention", kind: "primary" },
  { id: "p12", d: "M990,330 Q1055.1,298.6 1126.8,289.3", direction: "prevention", kind: "primary" },
  { id: "p13", d: "M1220,500 Q1168.9,543.9 1110.4,577.2", direction: "prevention", kind: "active" },
  { id: "p14", d: "M1220,500 Q1265.1,488.9 1300.7,518.7", direction: "prevention", kind: "primary" },
  { id: "p15", d: "M1220,500 Q1219.3,555.1 1174.9,587.7", direction: "prevention", kind: "primary" },
  { id: "p16", d: "M240,330 Q381.9,279.8 520,220", direction: null, kind: "primary" },
  { id: "p17", d: "M520,220 Q606.1,367.4 700,510", direction: null, kind: "primary" },
  { id: "p18", d: "M700,510 Q881.8,479.2 990,330", direction: null, kind: "primary" },
  { id: "p19", d: "M990,330 Q1120.2,394.5 1220,500", direction: null, kind: "primary" },
  { id: "p20", d: "M240,330 Q488.2,373.5 700,510", direction: null, kind: "secondary" },
  { id: "p21", d: "M520,220 Q754.2,278.3 990,330", direction: null, kind: "secondary" },
  // --- Dogęszczenie sieci (druga iteracja) ---
  // Za nagłówkiem (lewy górny róg sekcji)
  { id: "p22", d: "M240,330 Q170,210 120,100", direction: "separatism", kind: "secondary" },
  { id: "p23", d: "M120,100 Q200,80 280,90", direction: null, kind: "secondary" },
  // Drugie, wyraźne połączenie między 01 i 02 (obok istniejącego p16)
  { id: "p24", d: "M240,330 Q285,240 330,180", direction: "separatism", kind: "primary" },
  { id: "p25", d: "M330,180 Q380,190 430,290", direction: null, kind: "secondary" },
  { id: "p26", d: "M430,290 Q475,255 520,220", direction: "profiling", kind: "primary" },
  // Drugie, wyraźne połączenie między 02 i 04 (prevention) — obok p21
  { id: "p27", d: "M520,220 Q660,225 780,260", direction: "profiling", kind: "primary" },
  { id: "p28", d: "M780,260 Q815,285 850,310", direction: null, kind: "secondary" },
  { id: "p29", d: "M850,310 Q920,320 990,330", direction: "prevention", kind: "primary" },
  // Pod 03 (threats)
  { id: "p30", d: "M700,510 Q680,570 655,610", direction: "threats", kind: "primary" },
  { id: "p31", d: "M655,610 Q700,645 740,660", direction: null, kind: "secondary" },
  // Wokół prawej krawędzi sekcji
  { id: "p32", d: "M1220,500 Q1310,450 1370,410", direction: "prevention", kind: "primary" },
  { id: "p33", d: "M1370,410 Q1390,475 1400,540", direction: null, kind: "secondary" },
];

/** 5 punktów pulsujących pierścieni = 5 hubów skupisk. */
const RINGS: { x: number; y: number; direction: ResearchDirectionId }[] = [
  { x: 240, y: 330, direction: "separatism" },
  { x: 520, y: 220, direction: "profiling" },
  { x: 700, y: 510, direction: "threats" },
  { x: 990, y: 330, direction: "prevention" },
  { x: 1220, y: 500, direction: "prevention" },
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
