import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Badania — ${siteConfig.name}`,
  description: "Projekty badawcze z obszaru kryminologii, wiktymologii i psychologii bezpieczeństwa.",
};

const researchAreas = [
  {
    title: "Wiktymologia i klasyfikacja ofiar",
    description:
      "Badania nad mechanizmami wiktymizacji, wielowymiarowymi modelami klasyfikacji ofiar przestępstw oraz czynnikami ryzyka.",
  },
  {
    title: "Profilowanie kryminalne i psychologia sprawcy",
    description:
      "Analiza zachowań przestępczych, wykorzystanie testów psychologicznych w profilowaniu kryminalnym, osobowość sprawcy.",
  },
  {
    title: "Trauma i procesy zdrowienia",
    description:
      "Psychologiczne aspekty traumy pourazowej, wiktymizacji seksualnej oraz zaburzeń lękowych w kontekście kryminalnym.",
  },
  {
    title: "Bezpieczeństwo i separatyzm",
    description:
      "Bałkany Zachodnie, kwestie separatyzmu i tożsamości narodowej, wielokulturowość i bezpieczeństwo wewnętrzne.",
  },
];

export default function BadaniaPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <p className="mb-4 text-xs font-semibold tracking-[0.25em] uppercase text-[#5C2D91] dark:text-purple-400">
        Badania
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-[#1C1028] dark:text-white">
        Badania nad człowiekiem,<br />traumą i przestępczością.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#4A3360] dark:text-neutral-300">
        Łączę perspektywę psychologiczną, kryminologiczną i prawną, aby lepiej rozumieć
        mechanizmy wiktymizacji, zachowań przestępczych i funkcjonowania człowieka
        w sytuacji traumy.
      </p>

      <div className="mt-16 grid gap-6 sm:grid-cols-2">
        {researchAreas.map((area) => (
          <div
            key={area.title}
            className="rounded-2xl border border-[#5C2D91]/15 bg-white p-7 dark:bg-neutral-900 dark:border-white/10"
          >
            <h2 className="font-semibold text-[#1C1028] dark:text-white">{area.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#4A3360] dark:text-neutral-300">
              {area.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-[#5C2D91]/15 bg-[#EDE6F8] p-8 dark:bg-[#5C2D91]/10 dark:border-purple-400/20">
        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#5C2D91] dark:text-purple-400">
          Afiliacja
        </p>
        <p className="mt-3 text-[#1C1028] dark:text-white font-medium">
          Instytut Politologii i Europeistyki
        </p>
        <p className="mt-1 text-sm text-[#4A3360] dark:text-neutral-300">
          Uniwersytet Szczeciński
        </p>
      </div>
    </div>
  );
}
