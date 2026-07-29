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

const ABOUT_NETWORK_POINTS_LG: { x: number; y: number; color: string; glow?: boolean }[] = [
  { x: 70, y: 8, color: NETWORK_PURPLE },
  { x: 140, y: 8, color: "#E8D9B5" },
  { x: 70, y: 50, color: NETWORK_PURPLE_DEEP, glow: true },
  { x: 140, y: 50, color: "#E8D9B5", glow: true },
  { x: 70, y: 92, color: "#E8D9B5" },
  { x: 140, y: 92, color: NETWORK_PURPLE },
];

const ABOUT_NETWORK_POINTS_SM: { x: number; y: number; color: string; glow?: boolean }[] = [
  { x: 45, y: 6, color: NETWORK_PURPLE },
  { x: 45, y: 33.3, color: NETWORK_PURPLE_DEEP, glow: true },
  { x: 45, y: 66.6, color: "#E8D9B5", glow: true },
  { x: 45, y: 94, color: "#E8D9B5" },
];

// "Czułki" wychodzące poza obszar siatki kart, z rogów/krawędzi węzłów granicznych —
// żeby sieć wizualnie wykraczała poza kafelki. Wymaga overflow-visible na <svg>,
// bo współrzędne celowo wychodzą poza viewBox.
const ABOUT_NETWORK_TENDRILS_LG: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [
  { x1: 70, y1: 8, x2: 24, y2: -24, color: NETWORK_PURPLE },
  { x1: 140, y1: 8, x2: 186, y2: -24, color: "#E8D9B5" },
  { x1: 70, y1: 92, x2: 24, y2: 124, color: "#E8D9B5" },
  { x1: 140, y1: 92, x2: 186, y2: 124, color: NETWORK_PURPLE },
];

const ABOUT_NETWORK_TENDRILS_SM: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [
  { x1: 45, y1: 6, x2: 14, y2: -20, color: NETWORK_PURPLE },
  { x1: 45, y1: 6, x2: 76, y2: -20, color: "#E8D9B5" },
  { x1: 45, y1: 94, x2: 14, y2: 120, color: "#E8D9B5" },
  { x1: 45, y1: 94, x2: 76, y2: 120, color: NETWORK_PURPLE },
];

const pillars: { key: string; href: string; Icon: LucideIcon }[] = [
  { key: "badania", href: "/badania", Icon: Search },
  { key: "publikacje", href: "/publikacje", Icon: FileText },
  { key: "projekty", href: "/projekty", Icon: Share2 },
  { key: "psychoterapia", href: "/psychoterapia", Icon: Brain },
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
  "Psychoterapia",
  "AI i analiza danych",
];

const aboutCards: {
  key: string;
  Icon: LucideIcon;
  variant: "default" | "dark" | "light";
}[] = [
  { key: "wyksztalcenie", Icon: GraduationCap, variant: "default" },
  { key: "doktorat", Icon: Shield, variant: "dark" },
  { key: "badania", Icon: BarChart3, variant: "default" },
  { key: "psychoterapiaCard", Icon: Brain, variant: "default" },
  { key: "jezyki", Icon: Globe, variant: "default" },
  { key: "obszaryLaczace", Icon: Share2, variant: "light" },
];

const ABOUT_CARD_VARIANT_CLASSES: Record<
  "default" | "dark" | "light",
  { card: string; iconWrap: string; icon: string; label: string; value: string }
> = {
  default: {
    card: "bg-white dark:bg-neutral-900",
    iconWrap: "bg-[#EDE6F8] dark:bg-purple-900/30",
    icon: "text-[#5C2D91] dark:text-purple-300",
    label: "text-[#1C1028] dark:text-white",
    value: "text-[#4A3360] dark:text-neutral-400",
  },
  dark: {
    card: "bg-[#4A1D6E]",
    iconWrap: "bg-white/15",
    icon: "text-white",
    label: "text-white",
    value: "text-white/80",
  },
  light: {
    card: "bg-[#EDE6F8] dark:bg-purple-900/20",
    iconWrap: "bg-white/70 dark:bg-white/10",
    icon: "text-[#5C2D91] dark:text-purple-200",
    label: "text-[#1C1028] dark:text-white",
    value: "text-[#4A3360] dark:text-neutral-400",
  },
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
          <div className="relative z-10 flex lg:min-h-[600px] items-center">
            <div className="max-w-xl pl-16 pb-12">
              <p className="mb-5 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
                {tNav("tagline")}
              </p>
              <h1 className="text-5xl leading-tight font-bold tracking-tight text-[#1C1028] lg:text-6xl dark:text-white">
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
                  href="/#o-mnie"
                  className="rounded-full border border-[#4A1D6E] px-7 py-3 text-sm font-semibold text-[#4A1D6E] transition-colors hover:bg-[#4A1D6E] hover:text-white dark:border-purple-400/40 dark:text-purple-300 dark:hover:border-purple-400"
                >
                  {tHero("ctaOMnie")}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: prosty układ pionowy, bez nakładki */}
        <div className="px-6 py-16 lg:hidden">
          <p className="mb-5 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
            {tNav("tagline")}
          </p>
          <h1 className="text-5xl leading-tight font-bold tracking-tight text-[#1C1028] dark:text-white">
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
              href="/#o-mnie"
              className="rounded-full border border-[#4A1D6E] px-7 py-3 text-sm font-semibold text-[#4A1D6E] transition-colors hover:bg-[#4A1D6E] hover:text-white dark:border-purple-400/40 dark:text-purple-300 dark:hover:border-purple-400"
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
          <div className="grid grid-cols-2 gap-y-6 md:grid-cols-3 lg:grid-cols-5">
            {pillars.map((pillar, i) => (
              <Link
                key={pillar.href}
                href={pillar.href}
                className={`group flex flex-row items-start gap-2 px-6 py-0 transition-opacity hover:opacity-80 md:px-8 ${
                  i < pillars.length - 1
                    ? "lg:border-r lg:border-black/10 dark:lg:border-white/10"
                    : ""
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2E1A42]">
                  <pillar.Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold tracking-wide uppercase text-[#1C1028] dark:text-white">
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
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_2fr]">
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
                  return (
                    <Link
                      key={pub.slug}
                      href={`/publikacje/${pub.slug}`}
                      className="group"
                    >
                      <div className="relative">
                        {thumb ? (
                          <div className="relative aspect-square overflow-hidden rounded-xl">
                            <Image
                              src={thumb}
                              alt={pub.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-[#2E1A42] to-[#4A1D6E]">
                            <Icon className="h-16 w-16 text-white" />
                          </div>
                        )}
                        {pub.status === "w-trakcie" && (
                          <PublicationStatusBadge className="absolute top-2 right-2 shadow-sm" />
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 text-base font-bold text-[#1C1028] dark:text-white">
                        {pub.title}
                      </p>
                      <p className="mt-1 text-sm text-[#4A3360] dark:text-neutral-400">
                        {pub.type}
                      </p>
                      <p className="text-sm text-[#4A3360] dark:text-neutral-400">
                        {pub.year ?? (pub.status === "w-trakcie" ? tStatus("inPreparation") : "")}
                      </p>
                      {pub.coAuthors && pub.coAuthors.length > 0 && (
                        <p className="text-sm text-[#4A3360] dark:text-neutral-400">
                          {tDetail("coAuthors")}: {pub.coAuthors.join(", ")}
                        </p>
                      )}
                      <p className="mt-2 text-sm font-semibold uppercase text-[#4A1D6E] transition-transform group-hover:translate-x-1 dark:text-purple-400">
                        {tQuote("readMore")}
                      </p>
                    </Link>
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

      {/* O MNIE */}
      <section id="o-mnie" className="overflow-x-hidden border-t border-[#4A1D6E]/10 py-20 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
            {/* ZDJĘCIE */}
            <div className="relative isolate">
              <Image
                src="/o-mnie-dekoracja.png"
                alt=""
                width={1254}
                height={1254}
                aria-hidden="true"
                className="absolute -z-10 max-w-none object-cover pointer-events-none"
                style={{ width: "118%", height: "118%", inset: "-9%" }}
              />
              <div className="relative aspect-square overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">
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
            </div>

            {/* TREŚĆ */}
            <div>
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
                href="/#o-mnie"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#4A1D6E] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4A2073] dark:hover:bg-[#7B4DB8]"
              >
                {tAbout("moreLink")}
              </Link>

              {/* SIATKA FAKTÓW */}
              <div className="relative mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
                {/* Subtelna dekoracyjna "sieć" w miejscach styku kart — organiczne krzywe,
                    poświata i pulsowanie, w stylu efektu hover z navbara. */}
                <svg
                  className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full overflow-visible lg:block"
                  viewBox="0 0 210 100"
                  preserveAspectRatio="xMidYMid slice"
                  fill="none"
                  aria-hidden="true"
                >
                  <defs>
                    <filter id="about-network-glow-lg" x="-200%" y="-200%" width="500%" height="500%">
                      <feGaussianBlur stdDeviation="3" />
                    </filter>
                  </defs>
                  <path
                    d="M70,8 Q74,29 70,50 Q66,71 70,92"
                    stroke={NETWORK_PURPLE}
                    strokeOpacity="0.55"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                  <path
                    d="M140,8 Q136,29 140,50 Q144,71 140,92"
                    stroke={NETWORK_WARM_DEEP}
                    strokeOpacity="0.55"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                  <path
                    d="M70,50 Q105,42 140,50"
                    stroke={NETWORK_PURPLE_DEEP}
                    strokeOpacity="0.5"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                  {ABOUT_NETWORK_TENDRILS_LG.map((t, i) => (
                    <g key={i}>
                      <line
                        x1={t.x1}
                        y1={t.y1}
                        x2={t.x2}
                        y2={t.y2}
                        stroke={t.color}
                        strokeOpacity="0.4"
                        strokeWidth="0.8"
                        strokeLinecap="round"
                      />
                      <circle
                        cx={t.x2}
                        cy={t.y2}
                        r="1.6"
                        fill={t.color}
                        opacity="0.55"
                        className="animate-[pulse-dot_3s_ease-in-out_infinite]"
                        style={{ animationDelay: `${i * 0.4}s` }}
                      />
                    </g>
                  ))}
                  {ABOUT_NETWORK_POINTS_LG.map((p, i) => (
                    <g key={i}>
                      {p.glow && (
                        <circle cx={p.x} cy={p.y} r="7.5" fill={p.color} opacity="0.4" filter="url(#about-network-glow-lg)" />
                      )}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={p.glow ? "3" : "2.2"}
                        fill={p.color}
                        opacity="0.85"
                        className="animate-[pulse-dot_3s_ease-in-out_infinite]"
                        style={{ animationDelay: `${i * 0.35}s` }}
                      />
                    </g>
                  ))}
                </svg>
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
                    d="M45,6 Q49,19.65 45,33.3 Q41,50 45,66.6 Q49,80.3 45,94"
                    stroke={NETWORK_PURPLE}
                    strokeOpacity="0.55"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
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
                        r={p.glow ? "2.3" : "1.6"}
                        fill={p.color}
                        opacity="0.85"
                        className="animate-[pulse-dot_3s_ease-in-out_infinite]"
                        style={{ animationDelay: `${i * 0.35}s` }}
                      />
                    </g>
                  ))}
                </svg>

                {aboutCards.map(({ key, Icon, variant }) => {
                  const styles = ABOUT_CARD_VARIANT_CLASSES[variant];
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
    </div>
  );
}
