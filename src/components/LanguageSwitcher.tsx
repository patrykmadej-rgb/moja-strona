"use client";

import { Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-0.5 rounded-full bg-[#EDE6F8] px-1 py-1 dark:bg-purple-900/20">
      <Globe className="ml-1.5 mr-0.5 h-3.5 w-3.5 shrink-0 text-[#4A3360] dark:text-neutral-400" />
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          className={`rounded-full px-2.5 py-1 text-xs font-medium uppercase transition-colors duration-200 sm:px-3 sm:py-1.5 ${
            l === locale
              ? "bg-white font-bold text-[#4A1D6E] shadow-sm dark:bg-neutral-800 dark:text-purple-300"
              : "text-[#4A3360] hover:text-[#4A1D6E] dark:text-neutral-400 dark:hover:text-purple-300"
          }`}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
