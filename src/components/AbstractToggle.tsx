"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Lang = "pl" | "en" | "it";

type Props = {
  abstractPl: string;
  abstractEn?: string;
  abstractIt?: string;
};

export default function AbstractToggle({ abstractPl, abstractEn, abstractIt }: Props) {
  const t = useTranslations("AbstractToggle");
  const locale = useLocale() as Lang;
  const hasEn = Boolean(abstractEn);
  const hasIt = Boolean(abstractIt);

  const initialLang: Lang =
    locale === "en" && hasEn ? "en" : locale === "it" && hasIt ? "it" : "pl";
  const [lang, setLang] = useState<Lang>(initialLang);

  const texts: Record<Lang, string | undefined> = {
    pl: abstractPl,
    en: abstractEn,
    it: abstractIt,
  };
  const text = texts[lang];
  const tabs: Lang[] = ["pl", ...(hasEn ? (["en"] as const) : []), ...(hasIt ? (["it"] as const) : [])];
  const showToggle = hasEn || hasIt;

  return (
    <div className="mt-12 rounded-2xl border border-[#4A1D6E]/15 bg-white p-8 dark:bg-neutral-900 dark:border-white/10">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#4A1D6E] dark:text-purple-400">
          {t("label")}
        </p>
        {showToggle && (
          <div className="flex rounded-full border border-[#4A1D6E]/20 overflow-hidden text-xs font-medium dark:border-purple-400/20">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setLang(tab)}
                className={`px-3 py-1 transition-colors ${
                  lang === tab
                    ? "bg-[#4A1D6E] text-white"
                    : "text-[#4A1D6E] hover:bg-[#EDE6F8] dark:text-purple-300 dark:hover:bg-purple-900/20"
                }`}
              >
                {t(tab)}
              </button>
            ))}
          </div>
        )}
      </div>
      {text ? (
        <p className="text-[#4A3360] leading-relaxed dark:text-neutral-300">
          {text}
        </p>
      ) : (
        <p className="text-sm text-[#4A3360]/60 italic dark:text-neutral-500">
          {t("comingSoon")}
        </p>
      )}
    </div>
  );
}
