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
      <section id="o-mnie" className="border-t border-[#4A1D6E]/10 py-20 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
            {/* ZDJĘCIE */}
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
                  Badacz · Psycholog · Prawnik
                </p>
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
              <div className="mt-6 space-y-4 text-[#4A3360] leading-relaxed dark:text-neutral-300">
                <p>{tAbout("paragraph1")}</p>
                <p>{tAbout("paragraph2")}</p>
              </div>
              <Link
                href="/#o-mnie"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#4A1D6E] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4A2073] dark:hover:bg-[#7B4DB8]"
              >
                {tAbout("moreLink")}
              </Link>

              {/* SIATKA FAKTÓW */}
              <div className="relative mt-10 grid grid-cols-2 gap-4 lg:grid-cols-3">
                {/* Bardzo subtelna dekoracyjna "sieć" łącząca karty w miejscach ich styku. */}
                <svg
                  className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full lg:block"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  fill="none"
                  aria-hidden="true"
                >
                  <line x1="33.33" y1="6" x2="33.33" y2="94" stroke="#4A1D6E" strokeOpacity="0.12" strokeWidth="0.4" />
                  <line x1="66.66" y1="6" x2="66.66" y2="94" stroke="#4A1D6E" strokeOpacity="0.12" strokeWidth="0.4" />
                  <line x1="4" y1="50" x2="96" y2="50" stroke="#4A1D6E" strokeOpacity="0.12" strokeWidth="0.4" />
                  {[
                    [33.33, 6],
                    [66.66, 6],
                    [33.33, 50],
                    [66.66, 50],
                    [33.33, 94],
                    [66.66, 94],
                  ].map(([x, y], di) => (
                    <circle key={di} cx={x} cy={y} r="0.9" fill="#4A1D6E" opacity="0.18" />
                  ))}
                </svg>
                <svg
                  className="pointer-events-none absolute inset-0 z-0 h-full w-full lg:hidden"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  fill="none"
                  aria-hidden="true"
                >
                  <line x1="50" y1="4" x2="50" y2="96" stroke="#4A1D6E" strokeOpacity="0.12" strokeWidth="0.4" />
                  <line x1="6" y1="33.33" x2="94" y2="33.33" stroke="#4A1D6E" strokeOpacity="0.12" strokeWidth="0.4" />
                  <line x1="6" y1="66.66" x2="94" y2="66.66" stroke="#4A1D6E" strokeOpacity="0.12" strokeWidth="0.4" />
                  {[
                    [50, 33.33],
                    [50, 66.66],
                  ].map(([x, y], di) => (
                    <circle key={di} cx={x} cy={y} r="0.9" fill="#4A1D6E" opacity="0.18" />
                  ))}
                </svg>

                {aboutCards.map(({ key, Icon, variant }) => {
                  const styles = ABOUT_CARD_VARIANT_CLASSES[variant];
                  return (
                    <div
                      key={key}
                      className={`relative z-10 rounded-xl p-4 shadow-sm ${styles.card}`}
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${styles.iconWrap}`}>
                        <Icon className={`h-4 w-4 ${styles.icon}`} />
                      </div>
                      <p className={`mt-3 text-xs font-bold tracking-wide uppercase ${styles.label}`}>
                        {tAbout(`cards.${key}.label`)}
                      </p>
                      <p className={`mt-1.5 text-xs leading-snug ${styles.value}`}>
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
