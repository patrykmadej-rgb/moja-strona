import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { publications } from "@/lib/publications";

export const metadata: Metadata = {
  title: `Publikacje — ${siteConfig.name}`,
  description: "Artykuły naukowe, rozdziały w monografiach i teksty popularnonaukowe.",
};

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
        <ul className="flex flex-col gap-4">
          {publications.map((pub) => (
            <li key={pub.slug}>
              <Link
                href={`/publikacje/${pub.slug}`}
                className="group flex items-start justify-between gap-4 rounded-2xl border border-[#5C2D91]/15 bg-white p-6 transition-all hover:border-[#5C2D91]/40 hover:shadow-md dark:bg-neutral-900 dark:border-white/10 dark:hover:border-purple-400/30"
              >
                <div className="flex-1">
                  <span className="inline-block rounded-full bg-[#EDE6F8] px-3 py-0.5 text-xs font-medium text-[#5C2D91] dark:bg-purple-900/30 dark:text-purple-300">
                    {pub.type}
                  </span>
                  <h2 className="mt-2 font-semibold text-[#1C1028] group-hover:text-[#5C2D91] transition-colors dark:text-white dark:group-hover:text-purple-300">
                    {pub.title}
                  </h2>
                  <p className="mt-1 text-sm text-[#4A3360] dark:text-neutral-400">
                    {pub.venue} · {pub.year}
                  </p>
                </div>
                <span className="mt-1 shrink-0 text-[#5C2D91] opacity-0 group-hover:opacity-100 transition-opacity dark:text-purple-400">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
