import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("KontaktPage");
  return {
    title: `${t("metaTitle")} — ${siteConfig.name}`,
    description: t("metaDescription"),
  };
}

export default async function KontaktPage() {
  const t = await getTranslations("KontaktPage");

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <p className="mb-4 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
        {t("eyebrow")}
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-[#1C1028] dark:text-white">
        {t("h1")}
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-[#4A3360] dark:text-neutral-300">
        {t("intro")}
      </p>

      <div className="mt-12 space-y-4">
        <a
          href={`mailto:${siteConfig.email}`}
          className="flex items-center gap-4 rounded-2xl border border-[#4A1D6E]/15 bg-white p-6 transition-all hover:border-[#4A1D6E]/40 hover:shadow-md dark:bg-neutral-900 dark:border-white/10 dark:hover:border-purple-400/30"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDE6F8] dark:bg-purple-900/30">
            <span className="text-[#4A1D6E] dark:text-purple-400">✉</span>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-[#4A1D6E] dark:text-purple-400">
              {t("emailLabel")}
            </p>
            <p className="mt-0.5 font-medium text-[#1C1028] dark:text-white">
              {siteConfig.email}
            </p>
          </div>
        </a>
      </div>

      <div className="mt-12 rounded-2xl border border-[#4A1D6E]/15 bg-[#EDE6F8] p-7 dark:bg-[#4A1D6E]/10 dark:border-purple-400/20">
        <p className="text-sm font-semibold text-[#1C1028] dark:text-white">
          {t("noteTitle")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[#4A3360] dark:text-neutral-300">
          {t("noteText")}
        </p>
      </div>
    </div>
  );
}
