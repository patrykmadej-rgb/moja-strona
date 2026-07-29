import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { Search, FileText, Share2, Brain, PenTool, Shield, Globe, Landmark } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { publications } from "@/lib/publications";

const pillars = [
  {
    href: "/badania",
    label: "Badania",
    description:
      "Projekty badawcze, modele i analizy naukowe z obszaru psychologii, kryminologii i wiktymologii.",
    Icon: Search,
  },
  {
    href: "/publikacje",
    label: "Publikacje",
    description:
      "Artykuły naukowe, rozdziały w monografiach i teksty popularnonaukowe.",
    Icon: FileText,
  },
  {
    href: "/projekty",
    label: "Projekty i modele",
    description:
      "Autorskie koncepcje i modele analityczne dotyczące ofiar, sprawców i systemu.",
    Icon: Share2,
  },
  {
    href: "/psychoterapia",
    label: "Psychoterapia",
    description:
      "Szkolenie, podejście, obszary zainteresowań i przyszła praktyka terapeutyczna.",
    Icon: Brain,
  },
  {
    href: "/wiedza",
    label: "Wiedza",
    description:
      "Artykuły, komentarze i analizy o człowieku, traumie, przestępczości i bezpieczeństwie.",
    Icon: PenTool,
  },
];

const publicationIcons: Record<string, LucideIcon> = {
  "bezpieczenstwo-separatyzmu-2021": Shield,
  "separatyzm-cypryjski-2019": Globe,
  "recenzja-grosse-pokryzysowa-europa-2018": Landmark,
};

const recentPublications = [...publications]
  .sort((a, b) => b.year - a.year)
  .slice(0, 3);

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

export default function Home() {
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
              <p className="mb-5 text-xs font-semibold tracking-[0.25em] uppercase text-[#5C2D91] dark:text-purple-400">
                {siteConfig.title}
              </p>
              <h1 className="text-5xl leading-tight font-bold tracking-tight text-[#1C1028] lg:text-6xl dark:text-white">
                Badania.<br />
                Zrozumienie.<br />
                <span className="text-[#5C2D91] dark:text-purple-400">Realna zmiana.</span>
              </h1>
              <p className="mt-8 text-lg leading-relaxed text-[#4A3360] dark:text-neutral-300">
                {siteConfig.description}
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/badania"
                  className="rounded-full bg-[#5C2D91] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4A2073] dark:hover:bg-[#7B4DB8]"
                >
                  Zobacz moje badania →
                </Link>
                <Link
                  href="/#o-mnie"
                  className="rounded-full border border-[#5C2D91] px-7 py-3 text-sm font-semibold text-[#5C2D91] transition-colors hover:bg-[#5C2D91] hover:text-white dark:border-purple-400/40 dark:text-purple-300 dark:hover:border-purple-400"
                >
                  Dowiedz się więcej o mnie
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: prosty układ pionowy, bez nakładki */}
        <div className="px-6 py-16 lg:hidden">
          <p className="mb-5 text-xs font-semibold tracking-[0.25em] uppercase text-[#5C2D91] dark:text-purple-400">
            {siteConfig.title}
          </p>
          <h1 className="text-5xl leading-tight font-bold tracking-tight text-[#1C1028] dark:text-white">
            Badania.<br />
            Zrozumienie.<br />
            <span className="text-[#5C2D91] dark:text-purple-400">Realna zmiana.</span>
          </h1>
          <p className="mt-8 text-lg leading-relaxed text-[#4A3360] dark:text-neutral-300">
            {siteConfig.description}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/badania"
              className="rounded-full bg-[#5C2D91] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4A2073] dark:hover:bg-[#7B4DB8]"
            >
              Zobacz moje badania →
            </Link>
            <Link
              href="/#o-mnie"
              className="rounded-full border border-[#5C2D91] px-7 py-3 text-sm font-semibold text-[#5C2D91] transition-colors hover:bg-[#5C2D91] hover:text-white dark:border-purple-400/40 dark:text-purple-300 dark:hover:border-purple-400"
            >
              Dowiedz się więcej o mnie
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
        <div className="relative left-[calc(-50vw+50%)] w-screen bg-[#EAE5DE] py-10 dark:bg-neutral-900">
          <div className="grid grid-cols-2 gap-y-8 md:grid-cols-3 lg:grid-cols-5">
            {pillars.map((pillar, i) => (
              <Link
                key={pillar.href}
                href={pillar.href}
                className={`group flex flex-row items-start gap-4 px-6 py-0 transition-opacity hover:opacity-80 md:px-8 ${
                  i < pillars.length - 1
                    ? "lg:border-r lg:border-black/10 dark:lg:border-white/10"
                    : ""
                }`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2E1A42]">
                  <pillar.Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold tracking-wide uppercase text-[#1C1028] dark:text-white">
                    {pillar.label}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#4A3360] dark:text-neutral-300">
                    {pillar.description}
                  </p>
                  <p className="mt-4 text-[#5C2D91] transition-transform group-hover:translate-x-1 dark:text-purple-400">
                    →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CYTAT + OSTATNIE PUBLIKACJE */}
      <section className="border-t border-[#5C2D91]/10 bg-[#F5F1EC] py-16 dark:border-white/10 dark:bg-neutral-950">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_2fr]">
            {/* CYTAT */}
            <div>
              <p className="text-6xl leading-none text-[#5C2D91] dark:text-purple-400">
                &ldquo;
              </p>
              <p className="mt-2 text-xl leading-relaxed italic text-[#1C1028] lg:text-2xl dark:text-white">
                Zrozumieć człowieka w jego historii, kontekście i relacjach – to pierwszy krok do realnej zmiany.
              </p>
              <div className="mt-6">
                <Image
                  src="/podpis.png"
                  alt="Patryk Madej"
                  width={160}
                  height={40}
                  className="h-8 w-auto object-contain"
                />
                <p className="mt-2 text-sm tracking-widest uppercase text-[#4A3360] dark:text-neutral-400">
                  Patryk Madej
                </p>
              </div>
            </div>

            {/* OSTATNIE PUBLIKACJE */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-bold uppercase text-[#1C1028] dark:text-white">
                    Ostatnie publikacje
                  </p>
                  <div className="mt-2 h-1 w-12 bg-[#5C2D91]" />
                </div>
                <Link
                  href="/publikacje"
                  className="text-sm font-semibold uppercase text-[#5C2D91] hover:underline dark:text-purple-400"
                >
                  Zobacz wszystkie →
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                {recentPublications.map((pub) => {
                  const Icon = publicationIcons[pub.slug] ?? FileText;
                  return (
                    <Link
                      key={pub.slug}
                      href={`/publikacje/${pub.slug}`}
                      className="group"
                    >
                      {pub.coverImage ? (
                        <div className="relative aspect-square overflow-hidden rounded-xl">
                          <Image
                            src={pub.coverImage}
                            alt={pub.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-[#2E1A42] to-[#5C2D91]">
                          <Icon className="h-16 w-16 text-white" />
                        </div>
                      )}
                      <p className="mt-3 line-clamp-2 text-base font-bold text-[#1C1028] dark:text-white">
                        {pub.title}
                      </p>
                      <p className="mt-1 text-sm text-[#4A3360] dark:text-neutral-400">
                        {pub.type}
                      </p>
                      <p className="text-sm text-[#4A3360] dark:text-neutral-400">
                        {pub.year}
                      </p>
                      <p className="mt-3 text-sm font-semibold uppercase text-[#5C2D91] transition-transform group-hover:translate-x-1 dark:text-purple-400">
                        Czytaj więcej →
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
      <section className="border-t border-[#5C2D91]/10 py-16 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-6 text-xs font-semibold tracking-[0.25em] uppercase text-[#5C2D91] dark:text-purple-400">
            Obszary działalności
          </p>
          <div className="flex flex-wrap gap-3">
            {areas.map((area) => (
              <span
                key={area}
                className="rounded-full border border-[#5C2D91]/20 bg-white px-5 py-2.5 text-sm font-medium text-[#4A3360] dark:bg-neutral-900 dark:border-white/10 dark:text-neutral-300"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* O MNIE */}
      <section id="o-mnie" className="border-t border-[#5C2D91]/10 py-20 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="mb-4 text-xs font-semibold tracking-[0.25em] uppercase text-[#5C2D91] dark:text-purple-400">
                O mnie
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-[#1C1028] dark:text-white">
                Połączenie perspektyw.<br />Zrozumienie człowieka.
              </h2>
              <div className="mt-6 space-y-4 text-[#4A3360] leading-relaxed dark:text-neutral-300">
                <p>
                  Jestem doktorantem Uniwersytetu Szczecińskiego oraz studentem psychologii.
                  Przez lata łączyłem zainteresowania prawnicze, politologiczne i psychologiczne —
                  badając Bałkany Zachodnie, separatyzm, bezpieczeństwo i wielokulturowość.
                </p>
                <p>
                  Dziś moje zainteresowania naukowe skupiają się na kryminologii, wiktymologii
                  i psychologii bezpieczeństwa. Równolegle szkolę się w psychoterapii
                  w nurcie integracyjno-psychodynamicznym, w tym metodą EMDR w pracy z traumą.
                </p>
                <p>
                  Łączę różne dziedziny wiedzy i doświadczenia, aby lepiej rozumieć człowieka,
                  jego decyzje, zachowania oraz konteksty, w których funkcjonuje.
                </p>
              </div>
              <Link
                href="/#o-mnie"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#5C2D91] hover:underline dark:text-purple-400"
              >
                Więcej o mnie →
              </Link>
            </div>

            <div className="space-y-4">
              {[
                { label: "Wykształcenie", value: "Prawo (mgr), Bezpieczeństwo wewnętrzne (lic.), Psychologia (w toku) — Uniwersytet Szczeciński" },
                { label: "Doktorat", value: "Instytut Politologii i Europeistyki, Uniwersytet Szczeciński" },
                { label: "Specjalizacja badawcza", value: "Bałkany Zachodnie, separatyzm, bezpieczeństwo, wiktymologia, kryminologia" },
                { label: "Języki", value: "Polski (ojczysty) · Angielski (biegle) · Włoski (płynnie)" },
                { label: "Psychoterapia", value: "Szkolenie w nurcie integracyjno-psychodynamicznym z metodą EMDR (od września 2026)" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-[#5C2D91]/15 bg-white p-5 dark:bg-neutral-900 dark:border-white/10"
                >
                  <p className="text-xs font-semibold tracking-widest uppercase text-[#5C2D91] dark:text-purple-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm text-[#4A3360] dark:text-neutral-300">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
