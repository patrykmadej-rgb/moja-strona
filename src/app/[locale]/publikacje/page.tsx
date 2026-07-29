import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/lib/site-config";
import { publications } from "@/lib/publications";
import PublicationStatusBadge from "@/components/PublicationStatusBadge";

export const metadata: Metadata = {
  title: `Publikacje — ${siteConfig.name}`,
  description: "Artykuły naukowe, rozdziały w monografiach i teksty popularnonaukowe.",
};

export default async function PublikacjePage() {
  const tStatus = await getTranslations("PublicationStatus");
  const tDetail = await getTranslations("PublicationDetail");

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <p className="mb-4 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
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
                className="group flex items-start justify-between gap-4 rounded-2xl border border-[#4A1D6E]/15 bg-white p-6 transition-all hover:border-[#4A1D6E]/40 hover:shadow-md dark:bg-neutral-900 dark:border-white/10 dark:hover:border-purple-400/30"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-block rounded-full bg-[#EDE6F8] px-3 py-0.5 text-xs font-medium text-[#4A1D6E] dark:bg-purple-900/30 dark:text-purple-300">
                      {pub.type}
                    </span>
                    {pub.status === "w-trakcie" && <PublicationStatusBadge />}
                  </div>
                  <h2 className="mt-2 font-semibold text-[#1C1028] group-hover:text-[#4A1D6E] transition-colors dark:text-white dark:group-hover:text-purple-300">
                    {pub.title}
                  </h2>
                  <p className="mt-1 text-sm text-[#4A3360] dark:text-neutral-400">
                    {pub.venue} · {pub.year ?? (pub.status === "w-trakcie" ? tStatus("inPreparation") : "")}
                  </p>
                  {pub.coAuthors && pub.coAuthors.length > 0 && (
                    <p className="mt-0.5 text-sm text-[#4A3360] dark:text-neutral-400">
                      {tDetail("coAuthors")}: {pub.coAuthors.join(", ")}
                    </p>
                  )}
                </div>
                <span className="mt-1 shrink-0 text-[#4A1D6E] opacity-0 group-hover:opacity-100 transition-opacity dark:text-purple-400">
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
