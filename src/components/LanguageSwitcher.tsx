"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium tracking-widest">
      {routing.locales.map((l, i) => (
        <span key={l} className="flex items-center gap-1.5">
          <Link
            href={pathname}
            locale={l}
            className={
              l === locale
                ? "font-bold text-[#1C1028] dark:text-white"
                : "text-[#4A3360] transition-colors hover:text-[#4A1D6E] dark:text-neutral-400 dark:hover:text-purple-300"
            }
          >
            {l.toUpperCase()}
          </Link>
          {i < routing.locales.length - 1 && (
            <span className="text-[#4A3360]/40 dark:text-neutral-600">·</span>
          )}
        </span>
      ))}
    </div>
  );
}
