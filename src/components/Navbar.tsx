import NextLink from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";
import { IconFlask } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const navLinks = [
  { href: "/#o-mnie", key: "oMnie" },
  { href: "/badania", key: "badania" },
  { href: "/publikacje", key: "publikacje" },
  { href: "/projekty", key: "projekty" },
  { href: "/psychoterapia", key: "psychoterapia" },
  { href: "/wiedza", key: "wiedza" },
];

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

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("Nav");

  return (
    <header className="sticky top-0 z-50 border-b border-[#4A1D6E]/10 bg-[#F5F1EC]/90 backdrop-blur dark:border-white/10 dark:bg-neutral-950/90">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-[#1C1028] dark:text-white"
        >
          <Image
            src="/podpis.png"
            alt="Patryk Madej"
            width={220}
            height={56}
            className="h-14 w-auto object-contain"
            priority
          />
        </Link>

        {/* Główna nawigacja */}
        <div className="hidden items-center gap-7 text-xs font-medium tracking-widest uppercase lg:flex text-[#4A3360] dark:text-neutral-300">
          {navLinks.map((link, i) => {
            const variant = constellationVariants[i % constellationVariants.length];
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group relative inline-block transition-colors hover:text-[#4A1D6E] dark:hover:text-purple-300"
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
                <span className="relative z-10">{t(link.key)}</span>
              </Link>
            );
          })}
        </div>

        {/* Przycisk KONTAKT / Panel + przełącznik języka */}
        <div className="flex items-center gap-6">
          <LanguageSwitcher />
          <NextLink
            href="/lab"
            title="Lab"
            aria-label="Lab"
            className="text-[#4A3360] transition-colors hover:text-[#1C1028] dark:text-neutral-400 dark:hover:text-white"
          >
            <IconFlask className="h-4 w-4" stroke={1.75} />
          </NextLink>
          {user ? (
            <div className="flex items-center gap-3">
              <NextLink
                href="/panel"
                className="text-sm font-medium text-[#4A1D6E] hover:underline dark:text-purple-300"
              >
                Panel
              </NextLink>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm text-neutral-500 transition-colors hover:text-[#1C1028] dark:text-neutral-400 dark:hover:text-white"
                >
                  Wyloguj
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/kontakt"
              className="flex items-center gap-2 rounded-none bg-[#4A1D6E] px-5 py-2.5 text-xs font-semibold tracking-widest uppercase text-white transition-colors hover:bg-[#4A2073] dark:hover:bg-[#7B4DB8]"
            >
              {t("kontakt")}
              <Mail className="h-4 w-4" />
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
