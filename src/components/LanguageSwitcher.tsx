"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { routing } from "@/i18n/routing";

// Uwaga: celowo NIE używamy next-intl (useLocale/usePathname z i18n/navigation) —
// ich kontekst nie odświeża się przy nawigacji, która zmienia tylko segment [locale]
// (Navbar jest renderowany przez layout POZA [locale]), co powodowało zablokowany
// wskaźnik aktywnego języka i podwójne prefiksy w URL (np. /it/it/...) prowadzące do 404.
// usePathname() z next/navigation jest częścią routera Next.js i zawsze zwraca świeżą wartość.
function splitLocaleFromPathname(pathname: string): { locale: string; rest: string } {
  for (const l of routing.locales) {
    if (l === routing.defaultLocale) continue;
    if (pathname === `/${l}` || pathname.startsWith(`/${l}/`)) {
      return { locale: l, rest: pathname.slice(`/${l}`.length) || "/" };
    }
  }
  return { locale: routing.defaultLocale, rest: pathname };
}

function buildHref(rest: string, targetLocale: string): string {
  if (targetLocale === routing.defaultLocale) return rest;
  return rest === "/" ? `/${targetLocale}` : `/${targetLocale}${rest}`;
}

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const { locale: currentLocale, rest } = splitLocaleFromPathname(pathname);

  return (
    <div className="flex items-center gap-1 text-[11px] font-medium tracking-widest">
      {routing.locales.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          <Link
            href={buildHref(rest, l)}
            className={
              l === currentLocale
                ? "font-bold text-[#4A1D6E] dark:text-purple-300"
                : "text-[#4A3360] transition-colors duration-200 hover:text-[#4A1D6E] dark:text-neutral-400 dark:hover:text-purple-300"
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
