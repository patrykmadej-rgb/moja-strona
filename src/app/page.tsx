import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

// TODO: podmień poniższe dane na swoje publikacje i tematy badawcze.
const articles = [
  {
    title: "Tytuł artykułu naukowego",
    venue: "Nazwa czasopisma / konferencji, 2025",
    description:
      "Krótkie streszczenie artykułu — o czym jest, jaki problem porusza i jakie wnioski przynosi.",
    href: "#",
  },
  {
    title: "Tytuł drugiego artykułu",
    venue: "Nazwa czasopisma, 2024",
    description: "Krótki opis drugiej publikacji naukowej.",
    href: "#",
  },
];

const research = [
  {
    title: "Temat badawczy 1",
    description:
      "Opis prowadzonego projektu badawczego — cel, metodologia i aktualny etap prac.",
  },
  {
    title: "Temat badawczy 2",
    description: "Opis kolejnego obszaru zainteresowań badawczych.",
  },
];

export default function Home() {
  return (
    <div>
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 sm:pt-28">
        <p className="text-sm font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
          {siteConfig.title}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          {siteConfig.name}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-300">
          {siteConfig.description}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="#artykuly"
            className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Zobacz artykuły
          </Link>
          <Link
            href="/psychoterapia"
            className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:border-neutral-400 dark:border-neutral-700 dark:text-white dark:hover:border-neutral-500"
          >
            Psychoterapia
          </Link>
        </div>
      </section>

      <section id="o-mnie" className="border-t border-black/10 py-16 dark:border-white/10">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight">O mnie</h2>
          <div className="mt-6 max-w-3xl space-y-4 text-neutral-600 dark:text-neutral-300">
            <p>
              Jestem doktorantem oraz przyszłym psychoterapeutą. Tutaj znajdziesz kilka zdań
              o moim wykształceniu, doświadczeniu badawczym i klinicznym oraz o tym, czym się
              obecnie zajmuję.
            </p>
            {/* TODO: zastąp poniższy akapit właściwym opisem swojej drogi zawodowej i naukowej. */}
            <p>
              Uzupełnij tę sekcję o informacje o studiach, afiliacji (uczelnia, instytut),
              szkoleniu psychoterapeutycznym oraz obszarach, którymi się zajmujesz.
            </p>
          </div>
        </div>
      </section>

      <section id="artykuly" className="border-t border-black/10 py-16 dark:border-white/10">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Artykuły naukowe</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {articles.map((article) => (
              <a
                key={article.title}
                href={article.href}
                className="rounded-xl border border-black/10 p-5 transition-colors hover:border-neutral-400 dark:border-white/10 dark:hover:border-neutral-500"
              >
                <h3 className="font-medium">{article.title}</h3>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {article.venue}
                </p>
                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
                  {article.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="badania" className="border-t border-black/10 py-16 dark:border-white/10">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Badania</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {research.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-black/10 p-5 dark:border-white/10"
              >
                <h3 className="font-medium">{item.title}</h3>
                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
