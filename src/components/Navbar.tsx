import NextLink from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";
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

// Warianty rozmieszczenia kropek/linii "konstelacji", przypisywane rotacyjnie do kolejnych linków
const constellationVariants = [
  {
    dots: [
      [10, 8],
      [30, 32],
      [55, 6],
      [75, 28],
      [92, 14],
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
      [14, 30],
      [38, 6],
      [62, 26],
      [88, 8],
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
      [18, 10],
      [50, 30],
      [82, 12],
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
                  {variant.lines.map(([x1, y1, x2, y2], li) => (
                    <line
                      key={li}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#6B3AA0"
                      strokeWidth="1.5"
                      opacity="0.65"
                    />
                  ))}
                  {variant.dots.map(([cx, cy], di) => (
                    <circle
                      key={di}
                      cx={cx}
                      cy={cy}
                      r="2.5"
                      fill="#6B3AA0"
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

        {/* Przełącznik języka + przycisk KONTAKT / Panel */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
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
