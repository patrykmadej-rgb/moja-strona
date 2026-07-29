"use client";

import { usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";

// Uwaga: celowo NIE używamy next-intl (useLocale/usePathname z i18n/navigation) —
// ich kontekst nie odświeża się przy nawigacji, która zmienia tylko segment [locale]
// (Navbar jest renderowany przez layout POZA [locale]), co powodowało zablokowany
// wskaźnik aktywnego języka i podwójne prefiksy w URL (np. /it/it/...) prowadzące do 404.
// usePathname() z next/navigation jest częścią routera Next.js i zawsze zwraca świeżą wartość.
//
// Celowo używamy zwykłego <a> zamiast next/link Link: Navbar (i Footer) renderują się
// w layoucie NAD segmentem [locale], więc przy miękkiej (klienckiej) nawigacji Next.js
// nie re-renderuje tego layoutu i teksty menu w navbarze zostają w poprzednim języku —
// mimo że treść strony poniżej tłumaczy się poprawnie. Zwykły <a> wymusza pełne
// przeładowanie, więc root layout (Navbar/Footer) renderuje się od nowa z properną lokalizacją.
function splitLocaleFromPathname(pathname: string): { locale: string; rest: string } {
  for (const l of routing.locales) {
    if (l === routing.defaultLocale) continue;
    if (pathname === `/${l}` || pathname.startsWith(`/${l}/`)) {
      return { locale: l, rest: pathname.slice(`/${l}`.length) || "/" };
    }
  }
  return { locale: routing.defaultLocale, rest: pathname };
}

function buildHref(rest: string, targetLocale: string): string {
  if (targetLocale === routing.defaultLocale) return rest;
  return rest === "/" ? `/${targetLocale}` : `/${targetLocale}${rest}`;
}

// Układ "wybuchu" kropek/linii wspólny dla wszystkich języków — kropka 0 jest środkowa
// (za tekstem, ze świecącą poświatą), pozostałe rozchodzą się promieniście na zewnątrz.
const BURST_DOTS: { x: number; y: number }[] = [
  { x: 50, y: 50 },
  { x: 22, y: 24 },
  { x: 78, y: 20 },
  { x: 80, y: 76 },
  { x: 20, y: 80 },
];

const BURST_LINES: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 1],
];

// Kolory flag: dotColors[0] odpowiada środkowej kropce (BURST_DOTS[0]), kolejne — pozostałym.
const FLAG_PALETTES: Record<string, { dotColors: string[]; glow: string; gradFrom: string; gradTo: string }> = {
  pl: {
    dotColors: ["#DC143C", "#FFFFFF", "#DC143C", "#FFFFFF", "#DC143C"],
    glow: "#DC143C",
    gradFrom: "#DC143C",
    gradTo: "#F5F1EC",
  },
  en: {
    dotColors: ["#012169", "#C8102E", "#FFFFFF", "#C8102E", "#FFFFFF"],
    glow: "#012169",
    gradFrom: "#012169",
    gradTo: "#C8102E",
  },
  it: {
    dotColors: ["#009246", "#FFFFFF", "#CE2B37", "#FFFFFF", "#CE2B37"],
    glow: "#009246",
    gradFrom: "#009246",
    gradTo: "#CE2B37",
  },
};

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const { locale: currentLocale, rest } = splitLocaleFromPathname(pathname);
  const lastIndex = routing.locales.length - 1;

  return (
    <div className="flex items-center gap-1 text-[11px] font-medium tracking-widest">
      {routing.locales.map((l, i) => {
        const palette = FLAG_PALETTES[l];
        // Ostatni język (najbliżej prawej krawędzi ekranu) rozszerza efekt w prawo nieco mniej
        // niż w lewo — lekka korekta pozycji, żeby duży promień "wybuchu" nie wychodził poza
        // widoczny obszar strony, przy zachowaniu efektu wyśrodkowanego na tekście.
        const insetClass =
          i === lastIndex
            ? "-top-9 -bottom-9 -left-11 -right-6"
            : "-inset-9";

        return (
          <span key={l} className="flex items-center gap-1">
            {/* isolate + transform wymuszają na Safari, żeby ten span był jednoznacznym
                "containing block" dla absolutnie pozycjonowanego SVG poniżej — inaczej
                w połączeniu z position:sticky + backdrop-blur na <header> (WebKit) potrafi
                pozycjonować SVG względem okna przeglądarki zamiast tego rodzica. */}
            <span className="group relative isolate inline-block [transform:translateZ(0)]">
              <svg
                className={`pointer-events-none absolute ${insetClass} z-0 scale-75 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100`}
                viewBox="0 0 100 100"
                fill="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id={`lang-grad-${l}`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={palette.gradFrom} />
                    <stop offset="100%" stopColor={palette.gradTo} />
                  </linearGradient>
                  <filter id={`lang-glow-${l}`} x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="3" />
                  </filter>
                </defs>
                {BURST_LINES.map(([a, b], li) => (
                  <line
                    key={li}
                    x1={BURST_DOTS[a].x}
                    y1={BURST_DOTS[a].y}
                    x2={BURST_DOTS[b].x}
                    y2={BURST_DOTS[b].y}
                    stroke={`url(#lang-grad-${l})`}
                    strokeWidth="1.5"
                    opacity="0.65"
                  />
                ))}
                <circle
                  cx={BURST_DOTS[0].x}
                  cy={BURST_DOTS[0].y}
                  r="9"
                  fill={palette.glow}
                  opacity="0.35"
                  filter={`url(#lang-glow-${l})`}
                />
                {BURST_DOTS.map((dot, di) => (
                  <circle
                    key={di}
                    cx={dot.x}
                    cy={dot.y}
                    r={di === 0 ? "4.5" : "3"}
                    fill={palette.dotColors[di]}
                    opacity="0.75"
                    className="group-hover:animate-[pulse-dot_1.5s_ease-in-out_infinite]"
                    style={{ animationDelay: `${di * 0.15}s` }}
                  />
                ))}
              </svg>
              <a
                href={buildHref(rest, l)}
                className={
                  "relative z-10 " +
                  (l === currentLocale
                    ? "font-bold text-[#4A1D6E] dark:text-purple-300"
                    : "text-[#4A3360] transition-colors duration-200 hover:text-[#4A1D6E] dark:text-neutral-400 dark:hover:text-purple-300")
                }
              >
                {l.toUpperCase()}
              </a>
            </span>
            {i < lastIndex && (
              <span className="text-[#4A3360]/40 dark:text-neutral-600">·</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
