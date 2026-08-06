import type { Metadata } from "next";
import Image from "next/image";
import {
  Scale,
  GraduationCap,
  Brain,
  Briefcase,
  Sparkles,
  BookOpenCheck,
  ShieldCheck,
  Compass,
  Plane,
  Globe2,
  BookOpen,
  Leaf,
  Camera,
  Lightbulb,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/lib/site-config";
import { researchAxes, localizeAxis } from "@/lib/research";
import { getFeaturedPublications } from "@/lib/publications";
import PublicationStatusBadge from "@/components/PublicationStatusBadge";

const LINKEDIN_URL = "https://www.linkedin.com/in/patrykmadej/";

type JourneyStage = { period: string; org: string; role: string; description: string };
type ValueItem = { title: string; description: string };

const FACT_ICONS: Record<string, LucideIcon> = {
  prawo: Scale,
  psychologia: GraduationCap,
  psychoterapia: Brain,
  doswiadczenie: Briefcase,
};

const VALUE_ICONS: LucideIcon[] = [Sparkles, BookOpenCheck, ShieldCheck, Compass];

const PERSONAL_ICONS: LucideIcon[] = [Plane, Globe2, BookOpen, Leaf, Camera, Lightbulb];

// Sieć dekoracyjna za zdjęciem w hero — mniejsza, dedykowana wersja wzorca
// użytego w sekcji "O mnie" na stronie głównej (ta sama kolorystyka: fiolet
// marki + ciepły akcent), tak żeby wizualnie łączyć teaser na stronie głównej
// z pełną podstroną. Współrzędne w viewBox 0 0 200 200.
const HERO_NETWORK_PURPLE = "#8B5CB8";
const HERO_NETWORK_PURPLE_DEEP = "#6B3AA0";
const HERO_NETWORK_WARM = "#E8D9B5";

const HERO_NETWORK_POINTS: { x: number; y: number; r: number; color: string; glow?: boolean }[] = [
  { x: 15, y: 20, r: 1.6, color: HERO_NETWORK_PURPLE },
  { x: 8, y: 95, r: 1.4, color: HERO_NETWORK_WARM },
  { x: 22, y: 172, r: 1.8, color: HERO_NETWORK_PURPLE_DEEP, glow: true },
  { x: 185, y: 30, r: 1.5, color: HERO_NETWORK_WARM },
  { x: 192, y: 110, r: 2, color: HERO_NETWORK_PURPLE, glow: true },
  { x: 178, y: 182, r: 1.4, color: HERO_NETWORK_PURPLE_DEEP },
  { x: 100, y: 8, r: 1.3, color: HERO_NETWORK_WARM },
  { x: 105, y: 195, r: 1.5, color: HERO_NETWORK_PURPLE },
];

const HERO_NETWORK_PATHS: { d: string; color: string; opacity: number }[] = [
  { d: "M15,20 Q60,4 100,8", color: HERO_NETWORK_WARM, opacity: 0.4 },
  { d: "M100,8 Q150,18 185,30", color: HERO_NETWORK_PURPLE, opacity: 0.4 },
  { d: "M185,30 Q195,70 192,110", color: HERO_NETWORK_PURPLE_DEEP, opacity: 0.45 },
  { d: "M192,110 Q188,150 178,182", color: HERO_NETWORK_PURPLE, opacity: 0.4 },
  { d: "M178,182 Q140,198 105,195", color: HERO_NETWORK_WARM, opacity: 0.35 },
  { d: "M8,95 Q6,140 22,172", color: HERO_NETWORK_PURPLE_DEEP, opacity: 0.35 },
  { d: "M15,20 Q5,55 8,95", color: HERO_NETWORK_PURPLE, opacity: 0.3 },
];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("OMniePage");
  return {
    title: `${t("metaTitle")} — ${siteConfig.name}`,
    description: t("metaDescription"),
  };
}

export default async function OMniePage() {
  const t = await getTranslations("OMniePage");
  const locale = await getLocale();

  const stages = t.raw("journey.stages") as JourneyStage[];
  const educationItems = t.raw("cards.education.items") as string[];
  const specializationItems = t.raw("cards.specializations.items") as string[];
  const experienceItems = t.raw("cards.experience.items") as string[];
  const values = t.raw("values.items") as ValueItem[];
  const personalItems = t.raw("personal.items") as string[];

  const localizedAxes = researchAxes.map((axis) => localizeAxis(axis, locale));
  const featuredPublications = getFeaturedPublications();

  return (
    <div>
      {/* HERO */}
      <section className="overflow-x-hidden border-b border-[#4A1D6E]/10 py-16 lg:py-20 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* TREŚĆ */}
            <div className="order-1">
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
                {t("hero.eyebrow")}
              </p>
              <h1 className="mt-4 text-4xl leading-tight font-bold tracking-tight text-[#1C1028] lg:text-5xl dark:text-white">
                {t("hero.heading")}
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-[#4A3360] dark:text-neutral-300">
                {t("hero.paragraph1")}
              </p>
              <p className="mt-4 leading-relaxed text-[#4A3360] dark:text-neutral-300">
                {t("hero.paragraph2")}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/badania"
                  className="inline-flex items-center gap-2 rounded-none bg-[#4A1D6E] px-7 py-3 text-sm font-normal text-white transition-colors hover:bg-[#4A2073] dark:hover:bg-[#7B4DB8]"
                >
                  {t("hero.ctaBadania")}
                </Link>
                <Link
                  href="/publikacje"
                  className="inline-flex items-center gap-2 rounded-none border border-[#4A1D6E] px-7 py-3 text-sm font-normal text-[#4A1D6E] transition-colors hover:bg-[#4A1D6E] hover:text-white dark:border-purple-400/40 dark:text-purple-300 dark:hover:border-purple-400"
                >
                  {t("hero.ctaPublikacje")}
                </Link>
                <Link
                  href="/kontakt"
                  className="text-sm font-semibold text-[#4A1D6E] underline decoration-[#4A1D6E]/30 underline-offset-4 transition-colors hover:decoration-[#4A1D6E] dark:text-purple-300"
                >
                  {t("hero.ctaKontakt")}
                </Link>
              </div>
            </div>

            {/* ZDJĘCIE */}
            <div className="relative order-2 mx-auto aspect-square w-full max-w-[420px]">
              {/* Miękka fioletowa plama w tle — bez twardej krawędzi */}
              <div
                aria-hidden="true"
                className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(circle,rgba(139,92,184,0.35)_0%,rgba(139,92,184,0.12)_45%,transparent_72%)] blur-2xl"
              />
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute -inset-6 -z-10 h-[calc(100%+3rem)] w-[calc(100%+3rem)]"
                viewBox="0 0 200 200"
                preserveAspectRatio="xMidYMid slice"
                fill="none"
              >
                <defs>
                  <filter id="omnie-hero-glow" x="-200%" y="-200%" width="500%" height="500%">
                    <feGaussianBlur stdDeviation="3" />
                  </filter>
                </defs>
                {HERO_NETWORK_PATHS.map((p, i) => (
                  <path key={i} d={p.d} stroke={p.color} strokeOpacity={p.opacity} strokeWidth="1" strokeLinecap="round" />
                ))}
                {HERO_NETWORK_POINTS.map((p, i) => (
                  <g key={i}>
                    {p.glow && (
                      <circle cx={p.x} cy={p.y} r="8" fill={p.color} opacity="0.35" filter="url(#omnie-hero-glow)" />
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
              {/* Zdjęcie — miękko wtopione w tło przez mask-image (fade), bez widocznego
                  prostokątnego wycięcia. */}
              <div
                className="relative h-full w-full"
                style={{
                  WebkitMaskImage: "radial-gradient(ellipse at center, black 60%, transparent 92%)",
                  maskImage: "radial-gradient(ellipse at center, black 60%, transparent 92%)",
                }}
              >
                <Image src="/o-mnie-portret.png" alt={t("photoAlt")} fill priority className="object-cover" />
              </div>
              <p className="mt-4 text-center text-xs font-medium tracking-wide uppercase text-[#4A3360] dark:text-neutral-400">
                {t("hero.photoCaption")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PASEK FAKTÓW */}
      <section className="border-b border-[#4A1D6E]/10 py-10 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {(["prawo", "psychologia", "psychoterapia", "doswiadczenie"] as const).map((key) => {
              const Icon = FACT_ICONS[key];
              return (
                <div key={key} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#EDE6F8] dark:bg-purple-900/30">
                    <Icon className="h-4.5 w-4.5 text-[#4A1D6E] dark:text-purple-300" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1C1028] dark:text-white">{t(`facts.${key}.label`)}</p>
                    <p className="mt-0.5 text-sm leading-snug text-[#4A3360] dark:text-neutral-400">
                      {t(`facts.${key}.value`)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MOJA DROGA ZAWODOWA */}
      <section className="border-b border-[#4A1D6E]/10 py-16 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
            {t("journey.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1C1028] dark:text-white">
            {t("journey.heading")}
          </h2>
          <p className="mt-3 max-w-2xl text-[#4A3360] dark:text-neutral-300">{t("journey.intro")}</p>

          <ol className="relative mt-10 grid grid-cols-1 gap-8 border-l border-[#4A1D6E]/15 pl-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-10 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-8">
            {stages.map((stage, i) => (
              <li key={i} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[29px] top-1 h-2.5 w-2.5 rounded-full bg-[#4A1D6E] lg:-top-[38px] lg:left-0 dark:bg-purple-400"
                />
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#4A1D6E] dark:text-purple-400">
                  {stage.period}
                </p>
                <p className="mt-1.5 font-bold text-[#1C1028] dark:text-white">{stage.org}</p>
                <p className="text-sm text-[#4A3360] dark:text-neutral-400">{stage.role}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#4A3360] dark:text-neutral-300">
                  {stage.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* TRZY KARTY: WYKSZTAŁCENIE / SPECJALIZACJE / DOŚWIADCZENIE */}
      <section className="border-b border-[#4A1D6E]/10 py-16 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
            {/* Wykształcenie */}
            <div className="flex flex-col border border-[#4A1D6E]/12 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-neutral-900">
              <div className="flex h-10 w-10 items-center justify-center bg-[#EDE6F8] dark:bg-purple-900/30">
                <GraduationCap className="h-4.5 w-4.5 text-[#4A1D6E] dark:text-purple-300" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#1C1028] dark:text-white">
                {t("cards.education.heading")}
              </h3>
              <ul className="mt-4 flex-1 space-y-3 text-sm leading-relaxed text-[#4A3360] dark:text-neutral-300">
                {educationItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#4A1D6E] dark:bg-purple-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/psychoterapia"
                className="mt-5 inline-block text-sm font-semibold text-[#4A1D6E] hover:underline dark:text-purple-300"
              >
                {t("cards.education.moreLabel")} →
              </Link>
            </div>

            {/* Specjalizacje */}
            <div className="flex flex-col border border-[#4A1D6E]/12 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-neutral-900">
              <div className="flex h-10 w-10 items-center justify-center bg-[#EDE6F8] dark:bg-purple-900/30">
                <Brain className="h-4.5 w-4.5 text-[#4A1D6E] dark:text-purple-300" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#1C1028] dark:text-white">
                {t("cards.specializations.heading")}
              </h3>
              <ul className="mt-4 flex-1 space-y-3 text-sm leading-relaxed text-[#4A3360] dark:text-neutral-300">
                {specializationItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#4A1D6E] dark:bg-purple-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Doświadczenie zawodowe */}
            <div className="flex flex-col border border-[#4A1D6E]/12 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-neutral-900">
              <div className="flex h-10 w-10 items-center justify-center bg-[#EDE6F8] dark:bg-purple-900/30">
                <Briefcase className="h-4.5 w-4.5 text-[#4A1D6E] dark:text-purple-300" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#1C1028] dark:text-white">
                {t("cards.experience.heading")}
              </h3>
              <ul className="mt-4 flex-1 space-y-3 text-sm leading-relaxed text-[#4A3360] dark:text-neutral-300">
                {experienceItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#4A1D6E] dark:bg-purple-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#4A1D6E] hover:underline dark:text-purple-300"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                {t("cards.experience.linkedinLabel")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* BADANIA */}
      <section className="border-b border-[#4A1D6E]/10 py-16 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
            {t("research.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1C1028] dark:text-white">
            {t("research.heading")}
          </h2>
          <p className="mt-3 max-w-2xl text-[#4A3360] dark:text-neutral-300">{t("research.intro")}</p>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {localizedAxes.map((axis) => (
              <div
                key={axis.id}
                className="flex flex-col items-start gap-3 border border-[#4A1D6E]/12 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900"
              >
                <div className="flex h-10 w-10 items-center justify-center bg-[#EDE6F8] dark:bg-purple-900/30">
                  <Image src={axis.icon} alt="" width={20} height={20} aria-hidden="true" />
                </div>
                <p className="text-sm font-bold text-[#1C1028] dark:text-white">{axis.shortTitle}</p>
                <p className="text-xs leading-relaxed text-[#4A3360] dark:text-neutral-400">
                  {axis.cardDescription}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/badania"
            className="mt-8 inline-flex items-center gap-2 rounded-none bg-[#4A1D6E] px-7 py-3 text-sm font-normal text-white transition-colors hover:bg-[#4A2073] dark:hover:bg-[#7B4DB8]"
          >
            {t("research.ctaLabel")}
          </Link>
        </div>
      </section>

      {/* WYBRANE PUBLIKACJE */}
      <section className="border-b border-[#4A1D6E]/10 py-16 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
                {t("publications.eyebrow")}
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1C1028] dark:text-white">
                {t("publications.heading")}
              </h2>
            </div>
            <Link
              href="/publikacje"
              className="text-sm font-semibold uppercase text-[#4A1D6E] hover:underline dark:text-purple-400"
            >
              {t("publications.ctaLabel")} →
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPublications.map((pub) => (
              <Link
                key={pub.slug}
                href={`/publikacje/${pub.slug}`}
                className="group flex flex-col border border-[#4A1D6E]/12 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-neutral-900"
              >
                {pub.status === "w-trakcie" && <PublicationStatusBadge className="mb-2 self-start" />}
                <p className="text-[11px] font-semibold tracking-widest uppercase text-[#4A3360] dark:text-neutral-400">
                  {pub.type}
                  {pub.year ? ` · ${pub.year}` : ""}
                </p>
                <p className="mt-2 line-clamp-3 font-bold text-[#1C1028] dark:text-white">{pub.title}</p>
                <p className="mt-1.5 line-clamp-1 text-sm text-[#4A3360] dark:text-neutral-400">{pub.venue}</p>
                <span className="mt-auto pt-4 text-xs font-semibold uppercase text-[#4A1D6E] transition-transform group-hover:translate-x-1 dark:text-purple-400">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PSYCHOTERAPIA */}
      <section className="border-b border-[#4A1D6E]/10 py-16 dark:border-white/10">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
            {t("psychoterapiaSection.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1C1028] dark:text-white">
            {t("psychoterapiaSection.heading")}
          </h2>
          <div className="mt-5 space-y-4 leading-relaxed text-[#4A3360] dark:text-neutral-300">
            <p>{t("psychoterapiaSection.paragraph1")}</p>
            <p>{t("psychoterapiaSection.paragraph2")}</p>
          </div>
          <Link
            href="/psychoterapia"
            className="mt-6 inline-flex items-center gap-2 rounded-none border border-[#4A1D6E] px-7 py-3 text-sm font-normal text-[#4A1D6E] transition-colors hover:bg-[#4A1D6E] hover:text-white dark:border-purple-400/40 dark:text-purple-300 dark:hover:border-purple-400"
          >
            {t("psychoterapiaSection.ctaLabel")}
          </Link>
        </div>
      </section>

      {/* WARTOŚCI */}
      <section className="border-b border-[#4A1D6E]/10 py-16 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
            {t("values.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1C1028] dark:text-white">
            {t("values.heading")}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, i) => {
              const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
              return (
                <div key={value.title}>
                  <div className="flex h-10 w-10 items-center justify-center bg-[#EDE6F8] dark:bg-purple-900/30">
                    <Icon className="h-4.5 w-4.5 text-[#4A1D6E] dark:text-purple-300" aria-hidden="true" />
                  </div>
                  <p className="mt-3 font-bold text-[#1C1028] dark:text-white">{value.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#4A3360] dark:text-neutral-400">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* POZA PRACĄ */}
      <section className="border-b border-[#4A1D6E]/10 py-16 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
            {t("personal.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1C1028] dark:text-white">
            {t("personal.heading")}
          </h2>
          <p className="mt-3 max-w-2xl text-[#4A3360] dark:text-neutral-300">{t("personal.intro")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {personalItems.map((item, i) => {
              const Icon = PERSONAL_ICONS[i % PERSONAL_ICONS.length];
              return (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-[#4A1D6E]/20 bg-white px-5 py-2.5 text-sm font-medium text-[#4A3360] dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300"
                >
                  <Icon className="h-3.5 w-3.5 text-[#4A1D6E] dark:text-purple-400" aria-hidden="true" />
                  {item}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* MANIFEST */}
      <section className="relative overflow-hidden bg-[#1C1028] py-20">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
          viewBox="0 0 400 120"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          {[
            { x: 30, y: 20 },
            { x: 90, y: 70 },
            { x: 160, y: 30 },
            { x: 230, y: 80 },
            { x: 300, y: 25 },
            { x: 360, y: 65 },
          ].map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="1.6"
              fill={i % 3 === 0 ? "#E8D9B5" : "#9B70D0"}
              opacity="0.6"
              className="animate-[pulse-dot_3s_ease-in-out_infinite]"
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          ))}
        </svg>
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <p className="text-2xl leading-relaxed font-medium text-white lg:text-3xl">{t("manifest.text")}</p>
        </div>
      </section>

      {/* KOŃCOWE CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#1C1028] dark:text-white">
            {t("finalCta.heading")}
          </h2>
          <p className="mt-4 leading-relaxed text-[#4A3360] dark:text-neutral-300">{t("finalCta.description")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 rounded-none bg-[#4A1D6E] px-7 py-3 text-sm font-normal text-white transition-colors hover:bg-[#4A2073] dark:hover:bg-[#7B4DB8]"
            >
              {t("finalCta.ctaKontakt")}
            </Link>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-none border border-[#4A1D6E] px-7 py-3 text-sm font-normal text-[#4A1D6E] transition-colors hover:bg-[#4A1D6E] hover:text-white dark:border-purple-400/40 dark:text-purple-300 dark:hover:border-purple-400"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              {t("finalCta.ctaLinkedin")}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
