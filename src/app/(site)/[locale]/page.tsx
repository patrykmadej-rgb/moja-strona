import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  Search,
  FileText,
  Share2,
  Brain,
  PenTool,
  Shield,
  Globe,
  Landmark,
  GraduationCap,
  BarChart3,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getFeaturedPublications } from "@/lib/publications";
import PublicationStatusBadge from "@/components/PublicationStatusBadge";

// Kolorystyka dekoracyjnej "sieci" w siatce faktów o mnie — spójna z efektem hover w navbarze.
const NETWORK_PURPLE = "#8B5CB8";
const NETWORK_PURPLE_DEEP = "#6B3AA0";
const NETWORK_WARM_DEEP = "#D4C08A";

// Sieć na całą sekcję "O mnie" (desktop/lg) — viewBox 0 0 400 200 obejmuje cały
// dwukolumnowy układ (zdjęcie ~0-190, przerwa ~190-215, tekst+kafelki ~215-400).
// Środek ciężkości układu celowo przesunięty w prawo, w stronę tekstu i kafelków:
// przy zdjęciu zostaje tylko kilka rzadkich węzłów, gęstość i główne linie
// koncentrują się po prawej. Współrzędne i promienie nieregularne — organiczna
// konstelacja, nie lustrzany wzór.
const ABOUT_SECTION_NETWORK_POINTS: { x: number; y: number; r: number; color: string; glow?: boolean }[] = [
  { x: 20, y: 18, r: 1.3, color: NETWORK_PURPLE },
  { x: 12, y: 105, r: 1.4, color: NETWORK_PURPLE_DEEP, glow: true },
  { x: 25, y: 185, r: 1.2, color: "#E8D9B5" },
  { x: 218, y: 12, r: 1.3, color: "#E8D9B5" },
  { x: 222, y: 92, r: 1.6, color: NETWORK_PURPLE_DEEP, glow: true },
  { x: 212, y: 190, r: 1.4, color: "#E8D9B5" },
  { x: 245, y: 28, r: 1.5, color: NETWORK_PURPLE },
  { x: 255, y: 98, r: 1.6, color: NETWORK_PURPLE_DEEP, glow: true },
  { x: 285, y: 58, r: 1.3, color: NETWORK_PURPLE },
  { x: 328, y: 130, r: 1.8, color: NETWORK_PURPLE, glow: true },
  { x: 358, y: 42, r: 1.2, color: "#E8D9B5" },
  { x: 392, y: 124, r: 1.4, color: "#E8D9B5" },
  { x: 322, y: 178, r: 2, color: NETWORK_PURPLE_DEEP, glow: true },
  { x: 394, y: 182, r: 1.6, color: "#E8D9B5", glow: true },
];

const ABOUT_NETWORK_POINTS_SM: { x: number; y: number; r: number; color: string; glow?: boolean }[] = [
  { x: 42, y: 5, r: 1.3, color: NETWORK_PURPLE },
  { x: 49, y: 32, r: 2.4, color: NETWORK_PURPLE_DEEP, glow: true },
  { x: 40, y: 68, r: 2, color: "#E8D9B5", glow: true },
  { x: 47, y: 96, r: 1.5, color: "#E8D9B5" },
];

// Krzywe łączące klastry węzłów. Cienkie, przygaszone linie od zdjęcia sięgają
// delikatnie w prawo; gęstsze, wyraźniejsze linie budują główną sieć po prawej
// stronie sekcji (przy tekście i kafelkach).
const ABOUT_SECTION_NETWORK_PATHS: { d: string; color: string; opacity: number }[] = [
  { d: "M20,18 Q120,4 218,12", color: NETWORK_WARM_DEEP, opacity: 0.22 },
  { d: "M12,105 Q110,100 222,92", color: NETWORK_PURPLE_DEEP, opacity: 0.22 },
  { d: "M25,185 Q115,197 212,190", color: "#E8D9B5", opacity: 0.2 },
  { d: "M218,12 Q232,20 245,28", color: NETWORK_PURPLE, opacity: 0.45 },
  { d: "M245,28 Q265,45 285,58", color: NETWORK_WARM_DEEP, opacity: 0.45 },
  { d: "M285,58 Q305,90 328,130", color: NETWORK_PURPLE_DEEP, opacity: 0.5 },
  { d: "M222,92 Q238,95 255,98", color: NETWORK_PURPLE, opacity: 0.45 },
  { d: "M255,98 Q305,115 328,130", color: NETWORK_PURPLE_DEEP, opacity: 0.45 },
  { d: "M328,130 Q360,135 392,124", color: NETWORK_PURPLE, opacity: 0.5 },
  { d: "M358,42 Q378,80 392,124", color: "#E8D9B5", opacity: 0.4 },
  { d: "M212,190 Q265,198 322,178", color: NETWORK_PURPLE_DEEP, opacity: 0.45 },
  { d: "M322,178 Q360,182 394,182", color: "#E8D9B5", opacity: 0.5 },
  { d: "M328,130 Q325,155 322,178", color: NETWORK_PURPLE, opacity: 0.4 },
];

// Krótkie "odgałęzienia" poza głównymi liniami — łamią symetrię, jak przypadkowe
// dodatkowe połączenia w prawdziwej konstelacji. Większość po prawej stronie,
// żeby wzmacniać gęstość sieci przy kafelkach.
const ABOUT_SECTION_NETWORK_BRANCHES: { x1: number; y1: number; x2: number; y2: number; r: number; color: string }[] = [
  { x1: 12, y1: 105, x2: -5, y2: 118, r: 0.8, color: "#E8D9B5" },
  { x1: 245, y1: 28, x2: 268, y2: 14, r: 1, color: NETWORK_PURPLE },
  { x1: 285, y1: 58, x2: 302, y2: 34, r: 0.9, color: NETWORK_WARM_DEEP },
  { x1: 358, y1: 42, x2: 376, y2: 18, r: 0.8, color: NETWORK_PURPLE },
  { x1: 392, y1: 124, x2: 399, y2: 148, r: 0.9, color: "#E8D9B5" },
];

const ABOUT_NETWORK_BRANCHES_SM: { x1: number; y1: number; x2: number; y2: number; r: number; color: string }[] = [
  { x1: 49, y1: 32, x2: 71, y2: 26, r: 0.9, color: NETWORK_PURPLE },
];

const ABOUT_NETWORK_TENDRILS_SM: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [
  { x1: 42, y1: 5, x2: 20, y2: -8, color: NETWORK_PURPLE },
  { x1: 42, y1: 5, x2: 68, y2: -5, color: "#E8D9B5" },
  { x1: 47, y1: 96, x2: 9, y2: 118, color: "#E8D9B5" },
  { x1: 47, y1: 96, x2: 82, y2: 111, color: NETWORK_PURPLE },
];

const pillars: { key: string; href: string; Icon: LucideIcon }[] = [
  { key: "badania", href: "/badania", Icon: Search },
  { key: "publikacje", href: "/publikacje", Icon: FileText },
  { key: "projekty", href: "/projekty", Icon: Share2 },
  { key: "wiedza", href: "/wiedza", Icon: PenTool },
];

const publicationIcons: Record<string, LucideIcon> = {
  "bezpieczenstwo-separatyzmu-2021": Shield,
  "separatyzm-cypryjski-2019": Globe,
  "recenzja-grosse-pokryzysowa-europa-2018": Landmark,
};

const recentPublications = getFeaturedPublications();

const areas = [
  "Psychologia zachowań",
  "Kryminologia",
  "Wiktymologia",
  "Trauma",
  "Bezpieczeństwo",
  "Prawo",
  "Neuroróżnorodność",
  "AI i analiza danych",
];

const aboutCards: { key: string; Icon: LucideIcon }[] = [
  { key: "wyksztalcenie", Icon: GraduationCap },
  { key: "doktorat", Icon: Shield },
  { key: "badania", Icon: BarChart3 },
  { key: "psychoterapiaCard", Icon: Brain },
  { key: "jezyki", Icon: Globe },
  { key: "obszaryLaczace", Icon: Share2 },
];

const ABOUT_CARD_CLASSES = {
  card: "bg-white dark:bg-neutral-900",
  iconWrap: "bg-[#EDE6F8] dark:bg-purple-900/30",
  icon: "text-[#5C2D91] dark:text-purple-300",
  label: "text-[#1C1028] dark:text-white",
  value: "text-[#4A3360] dark:text-neutral-400",
};

export default async function Home() {
  const tNav = await getTranslations("Nav");
  const tHero = await getTranslations("Hero");
  const tPillars = await getTranslations("Pillars");
  const tQuote = await getTranslations("QuotePublications");
  const tAbout = await getTranslations("AboutMe");
  const tStatus = await getTranslations("PublicationStatus");
  const tDetail = await getTranslations("PublicationDetail");

  return (
    <div>
      {/* HERO */}
      <section className="relative">
        {/* Desktop / tablet: pełne tło na całą szerokość ekranu, tekst nałożony */}
        <div className="relative left-[calc(-50vw+50%)] hidden w-screen lg:block lg:min-h-[600px]">
          <Image
            src="/hero-ilustracja.png"
            alt="Ilustracja przedstawiająca tematykę badań psychologicznych i kryminologicznych"
            fill
            priority
            className="z-0 object-cover object-top"
          />
          {/* Podkładka pod tekstem — jasny (kremowy) gradient od lewej, żeby ciemny tekst
              zachował kontrast niezależnie od jasności grafiki w tym miejscu. Zanika do
              przezroczystości ok. 2/3 szerokości, więc grafika po prawej zostaje odsłonięta. */}
          <div className="absolute inset-0 z-[5] bg-gradient-to-r from-[#F5F1EC] from-5% via-[#F5F1EC]/75 via-40% to-transparent to-70% dark:from-neutral-950 dark:via-neutral-950/75" />
          <div className="relative z-10 flex lg:min-h-[600px] items-center">
            <div className="max-w-xl pl-16 pb-12">
              <p
                className="mb-5 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#4A1D6E] dark:text-purple-400"
                style={{ textShadow: "0 1px 12px rgba(245,241,236,0.9)" }}
              >
                {tNav("tagline")}
              </p>
              <h1
                className="text-5xl leading-tight font-medium tracking-tight text-[#1C1028] lg:text-6xl dark:text-white"
                style={{ textShadow: "0 2px 20px rgba(245,241,236,0.85)" }}
              >
                {tHero("line1")}<br />
                {tHero("line2")}<br />
                <span className="text-[#4A1D6E] dark:text-purple-400">{tHero("line3")}</span>
              </h1>
              <p className="mt-8 text-lg leading-relaxed text-[#4A3360] dark:text-neutral-300">
                {tHero("description")}
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/badania"
                  className="rounded-none bg-[#4A1D6E] px-7 py-3 text-sm font-normal text-white transition-colors hover:bg-[#4A2073] dark:hover:bg-[#7B4DB8]"
                >
                  {tHero("ctaBadania")}
                </Link>
                <Link
                  href="/o-mnie"
                  className="rounded-none border border-[#4A1D6E] px-7 py-3 text-sm font-normal text-[#4A1D6E] transition-colors hover:bg-[#4A1D6E] hover:text-white dark:border-purple-400/40 dark:text-purple-300 dark:hover:border-purple-400"
                >
                  {tHero("ctaOMnie")}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: prosty układ pionowy, bez nakładki */}
        <div className="px-6 py-16 lg:hidden">
          <p className="mb-5 text-[8px] font-semibold tracking-[0.03em] uppercase text-[#4A1D6E] sm:text-[10px] sm:tracking-[0.08em] md:text-[11px] md:tracking-[0.1em] dark:text-purple-400">
            {tNav("tagline")}
          </p>
          <h1 className="text-5xl leading-tight font-medium tracking-tight text-[#1C1028] dark:text-white">
            {tHero("line1")}<br />
            {tHero("line2")}<br />
            <span className="text-[#4A1D6E] dark:text-purple-400">{tHero("line3")}</span>
          </h1>
          <p className="mt-8 text-lg leading-relaxed text-[#4A3360] dark:text-neutral-300">
            {tHero("description")}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/badania"
              className="rounded-full bg-[#4A1D6E] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4A2073] dark:hover:bg-[#7B4DB8]"
            >
              {tHero("ctaBadania")}
            </Link>
            <Link
              href="/o-mnie"
              className="rounded-none border border-[#4A1D6E] px-7 py-3 text-sm font-normal text-[#4A1D6E] transition-colors hover:bg-[#4A1D6E] hover:text-white dark:border-purple-400/40 dark:text-purple-300 dark:hover:border-purple-400"
            >
              {tHero("ctaOMnie")}
            </Link>
          </div>
          <div className="mt-10">
            <Image
              src="/hero-ilustracja.png"
              alt="Ilustracja przedstawiająca tematykę badań psychologicznych i kryminologicznych"
              width={1693}
              height={929}
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* PIĘĆ FILARÓW */}
      <section className="relative">
        <div className="relative left-[calc(-50vw+50%)] w-screen bg-[#EAE5DE] py-6 dark:bg-neutral-900">
          <div className="grid grid-cols-2 gap-y-6 md:grid-cols-4">
            {pillars.map((pillar, i) => (
              <Link
                key={pillar.href}
                href={pillar.href}
                className={`group flex flex-row items-center gap-2 px-6 py-0 transition-opacity hover:opacity-80 md:px-8 ${
                  i < pillars.length - 1
                    ? "md:border-r md:border-black/10 dark:md:border-white/10"
                    : ""
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2E1A42]">
                  <pillar.Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-normal tracking-wide uppercase text-[#1C1028] dark:text-white">
                    {tPillars(`${pillar.key}.title`)}
                  </p>
                  <p className="mt-1 text-sm leading-snug text-[#7A7285] dark:text-neutral-400">
                    {tPillars(`${pillar.key}.description`)}
                  </p>
                  <p className="mt-1 text-[#4A1D6E] transition-transform group-hover:translate-x-1 dark:text-purple-400">
                    →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CYTAT + OSTATNIE PUBLIKACJE */}
      <section className="border-t border-[#4A1D6E]/10 bg-[#F5F1EC] py-10 dark:border-white/10 dark:bg-neutral-950">
        <div className="relative left-[calc(-50vw+50%)] w-screen">
          {/* pl odtwarza normalny lewy margines kontenera max-w-6xl (żeby cytat zostawał
              w tym samym miejscu co dotychczas), pr-6 puszcza prawą kolumnę do prawej
              krawędzi ekranu zamiast kończyć się na krawędzi max-w-6xl. */}
          <div className="grid grid-cols-1 gap-12 pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] pr-6 lg:grid-cols-[1fr_2fr]">
            {/* CYTAT */}
            <div>
              <p className="text-4xl leading-none text-[#4A1D6E] dark:text-purple-400">
                &ldquo;
              </p>
              <p className="mt-1 text-lg leading-snug italic text-[#1C1028] lg:text-xl dark:text-white">
                {tQuote("quote")}
              </p>
              <div className="mt-4">
                <Image
                  src="/podpis.png"
                  alt="Patryk Madej"
                  width={160}
                  height={40}
                  className="h-8 w-auto object-contain"
                />
                <p className="mt-2 text-sm tracking-widest uppercase text-[#4A3360] dark:text-neutral-400">
                  {tQuote("quoteAuthor")}
                </p>
              </div>
            </div>

            {/* OSTATNIE PUBLIKACJE */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-bold uppercase text-[#1C1028] dark:text-white">
                    {tQuote("recentTitle")}
                  </p>
                  <div className="mt-2 h-1 w-12 bg-[#4A1D6E]" />
                </div>
                <Link
                  href="/publikacje"
                  className="text-sm font-semibold uppercase text-[#4A1D6E] hover:underline dark:text-purple-400"
                >
                  {tQuote("seeAll")}
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                {recentPublications.map((pub) => {
                  const Icon = publicationIcons[pub.slug] ?? FileText;
                  const thumb = pub.coverImageThumb ?? pub.coverImage;
                  const yearLabel = pub.year ?? (pub.status === "w-trakcie" ? tStatus("inPreparation") : "");
                  return (
                    <Link
                      key={pub.slug}
                      href={`/publikacje/${pub.slug}`}
                      className="group flex items-start gap-4"
                    >
                      {thumb ? (
                        <div className="relative aspect-[3/4] w-[104px] shrink-0 overflow-hidden rounded-xl">
                          <Image
                            src={thumb}
                            alt={pub.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-[3/4] w-[104px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2E1A42] to-[#4A1D6E]">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        {pub.status === "w-trakcie" && (
                          <PublicationStatusBadge className="mb-1.5" />
                        )}
                        <p className="line-clamp-3 text-sm font-bold text-[#1C1028] dark:text-white">
                          {pub.title}
                        </p>
                        <p className="mt-1.5 text-[11px] text-[#4A3360] dark:text-neutral-400">
                          {pub.type}
                        </p>
                        <p className="text-[11px] text-[#4A3360] dark:text-neutral-400">
                          {yearLabel}
                        </p>
                        {pub.coAuthors && pub.coAuthors.length > 0 && (
                          <p className="mt-0.5 text-sm text-[#4A3360] dark:text-neutral-400">
                            {tDetail("coAuthors")}: {pub.coAuthors.join(", ")}
                          </p>
                        )}
                        <p className="mt-2 text-xs font-normal uppercase text-[#4A1D6E] transition-transform group-hover:translate-x-1 dark:text-purple-400">
                          {tQuote("readMore")}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* O MNIE */}
      <section id="o-mnie" className="overflow-x-hidden border-t border-[#4A1D6E]/10 py-20 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
            {/* Sieć na całą sekcję (zdjęcie + tekst + kafelki) — tylko na lg, subtelne tło.
                Osobna, mniejsza wersja mobilna zostaje lokalnie przy siatce kafelków niżej. */}
            <svg
              className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full lg:block"
              viewBox="0 0 400 200"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
              aria-hidden="true"
            >
              <defs>
                <filter id="about-section-network-glow" x="-200%" y="-200%" width="500%" height="500%">
                  <feGaussianBlur stdDeviation="3" />
                </filter>
              </defs>
              {ABOUT_SECTION_NETWORK_PATHS.map((p, i) => (
                <path
                  key={i}
                  d={p.d}
                  stroke={p.color}
                  strokeOpacity={p.opacity}
                  strokeWidth="1"
                  strokeLinecap="round"
                />
              ))}
              {ABOUT_SECTION_NETWORK_BRANCHES.map((b, i) => (
                <g key={i}>
                  <line
                    x1={b.x1}
                    y1={b.y1}
                    x2={b.x2}
                    y2={b.y2}
                    stroke={b.color}
                    strokeOpacity="0.35"
                    strokeWidth="0.7"
                    strokeLinecap="round"
                  />
                  <circle cx={b.x2} cy={b.y2} r={b.r} fill={b.color} opacity="0.55" />
                </g>
              ))}
              {ABOUT_SECTION_NETWORK_POINTS.map((p, i) => (
                <g key={i}>
                  {p.glow && (
                    <circle cx={p.x} cy={p.y} r="7" fill={p.color} opacity="0.35" filter="url(#about-section-network-glow)" />
                  )}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={p.r}
                    fill={p.color}
                    opacity="0.75"
                    className="animate-[pulse-dot_3s_ease-in-out_infinite]"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  />
                </g>
              ))}
            </svg>

            {/* ZDJĘCIE */}
            <div className="relative z-10 aspect-square overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
              <Image
                src="/o-mnie-portret.png"
                alt="Patryk Madej"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-6 left-6 rounded-xl bg-[#F5F1EC] px-4 py-3 shadow-lg dark:bg-neutral-900">
                <p className="font-bold text-[#1C1028] dark:text-white">Patryk Madej</p>
                <p className="mt-0.5 text-xs font-medium tracking-wide uppercase text-[#4A3360] dark:text-neutral-400">
                  Badacz · Student psychologii · Prawnik
                </p>
              </div>
            </div>

            {/* TREŚĆ */}
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <span className="h-4 w-1 bg-[#5C2D91]" />
                <p className="text-sm font-semibold tracking-wide uppercase text-[#5C2D91]">
                  {tAbout("eyebrow")}
                </p>
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#1C1028] lg:text-4xl dark:text-white">
                {tAbout("heading1")} {tAbout("heading2")}
              </h2>
              <p className="mt-4 text-[#4A3360] leading-relaxed dark:text-neutral-300">
                {tAbout("paragraph1")}
              </p>
              <Link
                href="/o-mnie"
                className="relative z-20 mt-5 inline-flex items-center gap-2 rounded-full bg-[#4A1D6E] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4A2073] dark:hover:bg-[#7B4DB8]"
              >
                {tAbout("moreLink")}
              </Link>

              {/* SIATKA FAKTÓW */}
              <div className="relative mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
                {/* Na mobile/tablet (poniżej lg) sekcja jest jednokolumnowa, więc sieć na całą
                    sekcję (powyżej, tylko lg:block) się nie pokazuje — tutaj zostaje osobna,
                    lokalna wersja tylko dla siatki kafelków. */}
                <svg
                  className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible lg:hidden"
                  viewBox="0 0 90 100"
                  preserveAspectRatio="xMidYMid slice"
                  fill="none"
                  aria-hidden="true"
                >
                  <defs>
                    <filter id="about-network-glow-sm" x="-200%" y="-200%" width="500%" height="500%">
                      <feGaussianBlur stdDeviation="2.4" />
                    </filter>
                  </defs>
                  <path
                    d="M42,5 Q53,17 49,32 Q45,52 40,68 Q37,83 47,96"
                    stroke={NETWORK_PURPLE}
                    strokeOpacity="0.55"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                  {ABOUT_NETWORK_BRANCHES_SM.map((b, i) => (
                    <g key={i}>
                      <line
                        x1={b.x1}
                        y1={b.y1}
                        x2={b.x2}
                        y2={b.y2}
                        stroke={b.color}
                        strokeOpacity="0.4"
                        strokeWidth="0.6"
                        strokeLinecap="round"
                      />
                      <circle cx={b.x2} cy={b.y2} r={b.r} fill={b.color} opacity="0.6" />
                    </g>
                  ))}
                  {ABOUT_NETWORK_TENDRILS_SM.map((t, i) => (
                    <g key={i}>
                      <line
                        x1={t.x1}
                        y1={t.y1}
                        x2={t.x2}
                        y2={t.y2}
                        stroke={t.color}
                        strokeOpacity="0.4"
                        strokeWidth="0.7"
                        strokeLinecap="round"
                      />
                      <circle
                        cx={t.x2}
                        cy={t.y2}
                        r="1.3"
                        fill={t.color}
                        opacity="0.55"
                        className="animate-[pulse-dot_3s_ease-in-out_infinite]"
                        style={{ animationDelay: `${i * 0.4}s` }}
                      />
                    </g>
                  ))}
                  {ABOUT_NETWORK_POINTS_SM.map((p, i) => (
                    <g key={i}>
                      {p.glow && (
                        <circle cx={p.x} cy={p.y} r="5.5" fill={p.color} opacity="0.4" filter="url(#about-network-glow-sm)" />
                      )}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={p.r}
                        fill={p.color}
                        opacity="0.85"
                        className="animate-[pulse-dot_3s_ease-in-out_infinite]"
                        style={{ animationDelay: `${i * 0.35}s` }}
                      />
                    </g>
                  ))}
                </svg>

                {aboutCards.map(({ key, Icon }) => {
                  const styles = ABOUT_CARD_CLASSES;
                  return (
                    <div
                      key={key}
                      className={`relative z-10 rounded-xl p-3 shadow-sm ${styles.card}`}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${styles.iconWrap}`}>
                        <Icon className={`h-3.5 w-3.5 ${styles.icon}`} />
                      </div>
                      <p className={`mt-2 text-xs font-bold tracking-wide uppercase ${styles.label}`}>
                        {tAbout(`cards.${key}.label`)}
                      </p>
                      <p className={`mt-1 text-xs leading-snug ${styles.value}`}>
                        {tAbout(`cards.${key}.value`)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OBSZARY DZIAŁALNOŚCI */}
      <section className="border-t border-[#4A1D6E]/10 py-16 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-6 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
            Obszary działalności
          </p>
          <div className="flex flex-wrap gap-3">
            {areas.map((area) => (
              <span
                key={area}
                className="rounded-full border border-[#4A1D6E]/20 bg-white px-5 py-2.5 text-sm font-medium text-[#4A3360] dark:bg-neutral-900 dark:border-white/10 dark:text-neutral-300"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
