import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/lib/site-config";

const pillars = [
  {
    href: "/badania",
    label: "Badania",
    description:
      "Projekty badawcze, modele i analizy naukowe z obszaru psychologii, kryminologii i wiktymologii.",
  },
  {
    href: "/publikacje",
    label: "Publikacje",
    description:
      "Artykuły naukowe, rozdziały w monografiach i teksty popularnonaukowe.",
  },
  {
    href: "/projekty",
    label: "Projekty i modele",
    description:
      "Autorskie koncepcje i modele analityczne dotyczące ofiar, sprawców i systemu.",
  },
  {
    href: "/psychoterapia",
    label: "Psychoterapia",
    description:
      "Szkolenie, podejście, obszary zainteresowań i przyszła praktyka terapeutyczna.",
  },
  {
    href: "/wiedza",
    label: "Wiedza",
    description:
      "Artykuły, komentarze i analizy o człowieku, traumie, przestępczości i bezpieczeństwie.",
  },
];

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
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-5 text-xs font-semibold tracking-[0.25em] uppercase text-[#5C2D91] dark:text-purple-400">
              {siteConfig.title}
            </p>
            <h1 className="text-5xl leading-tight font-bold tracking-tight text-[#1C1028] lg:text-6xl dark:text-white">
              Badania.<br />
              Zrozumienie.<br />
              <span className="text-[#5C2D91] dark:text-purple-400">Realna zmiana.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-[#4A3360] dark:text-neutral-300">
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

          <div>
            <Image
              src="/hero-ilustracja.png"
              alt="Ilustracja przedstawiająca tematykę badań psychologicznych i kryminologicznych"
              width={1693}
              height={929}
              priority
              className="h-auto w-full rounded-2xl"
            />
          </div>
        </div>
      </section>

      {/* PIĘĆ FILARÓW */}
      <section className="border-t border-[#5C2D91]/10 py-16 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {pillars.map((pillar) => (
              <Link
                key={pillar.href}
                href={pillar.href}
                className="group rounded-2xl border border-[#5C2D91]/15 bg-white p-6 transition-all hover:border-[#5C2D91]/40 hover:shadow-md dark:bg-neutral-900 dark:border-white/10 dark:hover:border-purple-400/30"
              >
                <p className="text-xs font-semibold tracking-widest uppercase text-[#5C2D91] dark:text-purple-400">
                  {pillar.label}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#4A3360] dark:text-neutral-300">
                  {pillar.description}
                </p>
                <p className="mt-4 text-xs font-medium text-[#5C2D91] opacity-0 transition-opacity group-hover:opacity-100 dark:text-purple-400">
                  →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CYTAT */}
      <section className="border-t border-[#5C2D91]/10 py-20 dark:border-white/10">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-2xl font-light italic leading-relaxed text-[#1C1028] sm:text-3xl dark:text-white">
            „Zrozumieć człowieka w jego historii, kontekście i relacjach
            — to pierwszy krok do realnej zmiany."
          </p>
          <p className="mt-6 text-sm font-semibold tracking-widest uppercase text-[#5C2D91] dark:text-purple-400">
            — Patryk Madej
          </p>
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

      {/* OSTATNIE PUBLIKACJE — placeholder */}
      <section className="border-t border-[#5C2D91]/10 py-16 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#5C2D91] dark:text-purple-400">
              Ostatnie publikacje
            </p>
            <Link
              href="/publikacje"
              className="text-xs font-semibold text-[#5C2D91] hover:underline dark:text-purple-400"
            >
              Zobacz wszystkie →
            </Link>
          </div>
          <p className="mt-6 text-sm text-[#4A3360] dark:text-neutral-400">
            Lista publikacji pojawi się wkrótce.
          </p>
        </div>
      </section>
    </div>
  );
}
