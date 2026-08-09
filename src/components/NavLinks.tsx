"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// Patrz komentarz w LanguageSwitcher.tsx: next-intl'owy usePathname (z @/i18n/navigation)
// nie odświeża się niezawodnie tutaj, bo Navbar renderuje się w layoucie NAD segmentem
// [locale]. next/navigation'owy usePathname zawsze zwraca świeżą, pełną ścieżkę.
function stripLocale(pathname: string): string {
  for (const l of routing.locales) {
    if (l === routing.defaultLocale) continue;
    if (pathname === `/${l}` || pathname.startsWith(`/${l}/`)) {
      return pathname.slice(`/${l}`.length) || "/";
    }
  }
  return pathname;
}

// Kolory kropek/linii efektu "konstelacji" — mieszanka fioletu marki i ciepłego kremowo-złotego akcentu
const CONSTELLATION_PURPLE = "#8B5CB8";
const CONSTELLATION_WARM = "#E8D9B5";
const CONSTELLATION_GRADIENT_FROM = "#6B3AA0";
const CONSTELLATION_GRADIENT_TO = "#E8D9B5";

// Warianty rozmieszczenia kropek/linii "konstelacji", przypisywane rotacyjnie do kolejnych linków.
// Każdy wariant ma dokładnie jedną kropkę "central" (cieplejszy, większy "punkt świetlny" z poświatą).
const constellationVariants = [
  {
    dots: [
      { x: 10, y: 8, warm: false },
      { x: 30, y: 32, warm: true, central: true },
      { x: 55, y: 6, warm: false },
      { x: 75, y: 28, warm: false },
      { x: 92, y: 14, warm: true },
    ],
    lines: [
      [10, 8, 30, 32],
      [30, 32, 55, 6],
      [55, 6, 75, 28],
      [75, 28, 92, 14],
      [10, 8, 55, 6],
    ],
  },
  {
    dots: [
      { x: 14, y: 30, warm: false },
      { x: 38, y: 6, warm: true, central: true },
      { x: 62, y: 26, warm: false },
      { x: 88, y: 8, warm: true },
    ],
    lines: [
      [14, 30, 38, 6],
      [38, 6, 62, 26],
      [62, 26, 88, 8],
      [14, 30, 62, 26],
    ],
  },
  {
    dots: [
      { x: 18, y: 10, warm: false },
      { x: 50, y: 30, warm: true, central: true },
      { x: 82, y: 12, warm: false },
    ],
    lines: [
      [18, 10, 50, 30],
      [50, 30, 82, 12],
      [18, 10, 82, 12],
    ],
  },
];

export type NavLinkItem = { href: string; key: string; label: string };

export default function NavLinks({ items }: { items: NavLinkItem[] }) {
  const pathname = usePathname();
  const currentPath = stripLocale(pathname);

  return (
    <div className="hidden items-center gap-7 text-xs font-medium tracking-widest uppercase lg:flex text-[#4A3360] dark:text-neutral-300">
      {items.map((link, i) => {
        const variant = constellationVariants[i % constellationVariants.length];
        const isActive = currentPath === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`group relative inline-block transition-colors hover:text-[#4A1D6E] dark:hover:text-purple-300 ${
              isActive ? "text-[#4A1D6E] dark:text-purple-300" : ""
            }`}
          >
            <svg
              className="pointer-events-none absolute -inset-3 z-0 scale-90 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"
              viewBox="0 0 100 40"
              fill="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id={`constellation-grad-${link.key}`} x1="0" y1="0" x2="100" y2="40" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor={CONSTELLATION_GRADIENT_FROM} />
                  <stop offset="100%" stopColor={CONSTELLATION_GRADIENT_TO} />
                </linearGradient>
                <filter id={`constellation-glow-${link.key}`} x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="1.6" />
                </filter>
              </defs>
              {variant.lines.map(([x1, y1, x2, y2], li) => (
                <line
                  key={li}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={`url(#constellation-grad-${link.key})`}
                  strokeWidth="1.5"
                  opacity="0.65"
                />
              ))}
              {variant.dots.map(
                (dot, di) =>
                  dot.central && (
                    <circle
                      key={`glow-${di}`}
                      cx={dot.x}
                      cy={dot.y}
                      r="6"
                      fill={CONSTELLATION_WARM}
                      opacity="0.35"
                      filter={`url(#constellation-glow-${link.key})`}
                    />
                  ),
              )}
              {variant.dots.map((dot, di) => (
                <circle
                  key={di}
                  cx={dot.x}
                  cy={dot.y}
                  r={dot.central ? "3.5" : "2.5"}
                  fill={dot.warm ? CONSTELLATION_WARM : CONSTELLATION_PURPLE}
                  opacity="0.6"
                  className="group-hover:animate-[pulse-dot_1.5s_ease-in-out_infinite]"
                  style={{ animationDelay: `${di * 0.2}s` }}
                />
              ))}
            </svg>
            <span className="relative z-10">{link.label}</span>
            <span
              aria-hidden="true"
              className={`absolute -bottom-1.5 left-0 h-[2px] rounded-full bg-[#4A1D6E] transition-all duration-300 dark:bg-purple-300 ${
                isActive ? "w-full opacity-100" : "w-0 opacity-0"
              }`}
            />
          </Link>
        );
      })}
    </div>
  );
}
