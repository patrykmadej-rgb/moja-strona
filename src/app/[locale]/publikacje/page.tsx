import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/lib/site-config";
import { publications } from "@/lib/publications";
import PublicationsExplorer from "@/components/PublicationsExplorer";

export const metadata: Metadata = {
  title: `Publikacje — ${siteConfig.name}`,
  description: "Artykuły naukowe, rozdziały w monografiach i teksty popularnonaukowe.",
};

export default async function PublikacjePage() {
  const tStatus = await getTranslations("PublicationStatus");

  return (
    <div>
      {/* HERO */}
      <section className="border-b border-[#4A1D6E]/10 pt-16 pb-10 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <div>
              <p className="mb-4 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
                Publikacje
              </p>
              <h1 className="text-5xl font-semibold tracking-tight text-[#1C1028] dark:text-white">
                Dorobek naukowy
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#4A3360] dark:text-neutral-300">
                Artykuły naukowe, rozdziały w monografiach i teksty popularnonaukowe
                z obszaru kryminologii, wiktymologii i psychologii bezpieczeństwa.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#4A1D6E]/30 px-5 py-2.5 text-sm font-semibold text-[#4A1D6E] transition-colors hover:bg-[#4A1D6E]/5 dark:border-purple-400/30 dark:text-purple-300 dark:hover:bg-purple-400/10"
                >
                  Google Scholar ↗
                </a>
                <a
                  href="https://orcid.org/0000-0002-7185-2441"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#4A1D6E]/30 px-5 py-2.5 text-sm font-semibold text-[#4A1D6E] transition-colors hover:bg-[#4A1D6E]/5 dark:border-purple-400/30 dark:text-purple-300 dark:hover:bg-purple-400/10"
                >
                  ORCID ↗
                </a>
              </div>
            </div>

            {/* Dekoracyjna ilustracja — widoczna od lg wzwyż, lekko wychodząca poza kolumnę */}
            <div className="hidden lg:block">
              <div className="-mt-8 -mr-10 scale-110">
                <Image
                  src="/publikacje-hero-book.png"
                  alt="Ilustracja przedstawiająca otwartą książkę, mapę i sieć neuronową symbolizujące dorobek naukowy"
                  width={1672}
                  height={941}
                  priority
                  className="h-auto w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <PublicationsExplorer
          publications={publications}
          inPreparationLabel={tStatus("inPreparation")}
          inProgressLabel={tStatus("inProgress")}
        />
      </div>
    </div>
  );
}
