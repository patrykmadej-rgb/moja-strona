import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Publikacje — ${siteConfig.name}`,
  description: "Artykuły naukowe, rozdziały w monografiach i teksty popularnonaukowe.",
};

const publications: {
  title: string;
  venue: string;
  year: number;
  type: string;
  href?: string;
}[] = [
  {
    title:
      "Bezpieczeństwo separatyzmu – implikacje separatyzmu na bezpieczeństwo w regionie na przykładzie wybranych państw azjatyckich",
    venue: "Bliski Wschód – tożsamość i polityka",
    year: 2021,
    type: "Rozdział w monografii",
  },
  {
    title: "Separatyzm cypryjski – wielowymiarowość problemu",
    venue: "Współczesny regionalizm Bliskiego i Dalekiego Wschodu",
    year: 2019,
    type: "Rozdział w monografii",
  },
  {
    title:
      "Recenzja: Tomasz Grzegorz Grosse, Pokryzysowa Europa. Dylematy Unii Europejskiej",
    venue: "Wydawnictwo Adam Marszałek",
    year: 2018,
    type: "Recenzja",
  },
  {
    title:
      "Recenzja: Szymon Sochacki, Bośnia i Hercegovina 1995–2012. Studium politologiczne",
    venue: "Wydawnictwo Adam Marszałek",
    year: 2016,
    type: "Recenzja",
  },
  {
    title:
      "Languages – a Tool in the Hands of Nationalists and Globalists. The Current Situation in Europe.",
    venue: "Wydawnictwo Adam Marszałek",
    year: 2016,
    type: "Artykuł naukowy",
  },
  {
    title:
      "Recenzja: Edward Olszewski, Bogusław Zieliński (eds.), Spotkania polsko-chorwackie",
    venue: "Wydawnictwo Adam Marszałek",
    year: 2015,
    type: "Recenzja",
  },
];

export default function PublikacjePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <p className="mb-4 text-xs font-semibold tracking-[0.25em] uppercase text-[#5C2D91] dark:text-purple-400">
        Publikacje
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-[#1C1028] dark:text-white">
        Dorobek naukowy
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#4A3360] dark:text-neutral-300">
        Artykuły naukowe, rozdziały w monografiach i teksty popularnonaukowe
        z obszaru kryminologii, wiktymologii i psychologii bezpieczeństwa.
      </p>

      <div className="mt-16">
        {publications.length === 0 ? (
          <div className="rounded-2xl border border-[#5C2D91]/15 bg-white p-12 text-center dark:bg-neutral-900 dark:border-white/10">
            <p className="text-sm text-[#4A3360] dark:text-neutral-400">
              Lista publikacji zostanie uzupełniona wkrótce.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {publications.map((pub) => (
              <li
                key={pub.title}
                className="rounded-2xl border border-[#5C2D91]/15 bg-white p-6 dark:bg-neutral-900 dark:border-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-block rounded-full bg-[#EDE6F8] px-3 py-0.5 text-xs font-medium text-[#5C2D91] dark:bg-purple-900/30 dark:text-purple-300">
                      {pub.type}
                    </span>
                    <h2 className="mt-2 font-semibold text-[#1C1028] dark:text-white">
                      {pub.href ? (
                        <a
                          href={pub.href}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-[#5C2D91] dark:hover:text-purple-300"
                        >
                          {pub.title}
                        </a>
                      ) : (
                        pub.title
                      )}
                    </h2>
                    <p className="mt-1 text-sm text-[#4A3360] dark:text-neutral-400">
                      {pub.venue} · {pub.year}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
