import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("PsychoterapiaPage");
  return {
    title: `${t("metaTitle")} — ${siteConfig.name}`,
    description: t("metaDescription"),
  };
}

export default async function PsychoterapiaPage() {
  const t = await getTranslations("PsychoterapiaPage");
  const list = t.raw("sections.podejscie.list") as string[];

  const strong = (chunks: React.ReactNode) => <strong>{chunks}</strong>;
  const strongDark = (chunks: React.ReactNode) => (
    <strong className="text-[#1C1028] dark:text-white">{chunks}</strong>
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      {/* Nagłówek */}
      <p className="mb-4 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
        {t("eyebrow")}
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-[#1C1028] dark:text-white">
        {t("h1")}
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-[#4A3360] dark:text-neutral-300">
        {t("intro")}
      </p>

      {/* Ważna informacja - na górze */}
      <div className="mt-8 rounded-2xl border border-amber-300/60 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="font-semibold">{t("warningTitle")}</p>
        <p className="mt-2 leading-relaxed">
          {t.rich("warningText", { strong })}
        </p>
      </div>

      <div className="mt-14 space-y-14">

        {/* Szkolenie */}
        <section>
          <p className="mb-3 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
            {t("sections.szkolenie.eyebrow")}
          </p>
          <h2 className="text-2xl font-semibold text-[#1C1028] dark:text-white">
            {t("sections.szkolenie.heading")}
          </h2>
          <div className="mt-4 space-y-4 leading-relaxed text-[#4A3360] dark:text-neutral-300">
            <p>{t.rich("sections.szkolenie.p1", { strong: strongDark })}</p>
            <p>{t("sections.szkolenie.p2")}</p>
          </div>
        </section>

        {/* Podejście */}
        <section>
          <p className="mb-3 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
            {t("sections.podejscie.eyebrow")}
          </p>
          <h2 className="text-2xl font-semibold text-[#1C1028] dark:text-white">
            {t("sections.podejscie.heading")}
          </h2>
          <div className="mt-4 space-y-4 leading-relaxed text-[#4A3360] dark:text-neutral-300">
            <p>{t("sections.podejscie.p1")}</p>
            <ul className="ml-4 space-y-2 list-disc marker:text-[#4A1D6E]">
              {list.map((item) => (
                <li key={item}>{item}</li>
              ))}
              <li>{t.rich("sections.podejscie.emdrLine", { strong: strongDark })}</li>
            </ul>
            <p>{t("sections.podejscie.p2")}</p>
          </div>
        </section>

        {/* Dla kogo */}
        <section>
          <p className="mb-3 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
            {t("sections.dlaKogo.eyebrow")}
          </p>
          <h2 className="text-2xl font-semibold text-[#1C1028] dark:text-white">
            {t("sections.dlaKogo.heading")}
          </h2>
          <div className="mt-4 leading-relaxed text-[#4A3360] dark:text-neutral-300">
            <p>{t("sections.dlaKogo.p1")}</p>
          </div>
        </section>

        {/* Wykształcenie */}
        <section>
          <p className="mb-3 text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
            {t("sections.wyksztalcenie.eyebrow")}
          </p>
          <h2 className="text-2xl font-semibold text-[#1C1028] dark:text-white">
            {t("sections.wyksztalcenie.heading")}
          </h2>
          <div className="mt-4 space-y-4 leading-relaxed text-[#4A3360] dark:text-neutral-300">
            <p>{t("sections.wyksztalcenie.p1")}</p>
            <p>{t("sections.wyksztalcenie.p2")}</p>
          </div>
        </section>

      </div>
    </div>
  );
}
