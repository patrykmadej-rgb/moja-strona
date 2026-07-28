"use client";
import { useState } from "react";

type Props = {
  abstractPl: string;
  abstractEn?: string;
};

export default function AbstractToggle({ abstractPl, abstractEn }: Props) {
  const [lang, setLang] = useState<"pl" | "en">("pl");
  const hasEn = Boolean(abstractEn);
  const text = lang === "pl" ? abstractPl : abstractEn;

  return (
    <div className="mt-12 rounded-2xl border border-[#5C2D91]/15 bg-white p-8 dark:bg-neutral-900 dark:border-white/10">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#5C2D91] dark:text-purple-400">
          Streszczenie
        </p>
        {hasEn && (
          <div className="flex rounded-full border border-[#5C2D91]/20 overflow-hidden text-xs font-medium dark:border-purple-400/20">
            <button
              onClick={() => setLang("pl")}
              className={`px-3 py-1 transition-colors ${
                lang === "pl"
                  ? "bg-[#5C2D91] text-white"
                  : "text-[#5C2D91] hover:bg-[#EDE6F8] dark:text-purple-300 dark:hover:bg-purple-900/20"
              }`}
            >
              PL
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1 transition-colors ${
                lang === "en"
                  ? "bg-[#5C2D91] text-white"
                  : "text-[#5C2D91] hover:bg-[#EDE6F8] dark:text-purple-300 dark:hover:bg-purple-900/20"
              }`}
            >
              EN
            </button>
          </div>
        )}
      </div>
      {text ? (
        <p className="text-[#4A3360] leading-relaxed dark:text-neutral-300">
          {text}
        </p>
      ) : (
        <p className="text-sm text-[#4A3360]/60 italic dark:text-neutral-500">
          Streszczenie zostanie dodane wkrótce.
        </p>
      )}
    </div>
  );
}
