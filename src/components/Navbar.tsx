import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { siteConfig } from "@/lib/site-config";

const navLinks = [
  { href: "/#o-mnie", label: "O mnie" },
  { href: "/badania", label: "Badania" },
  { href: "/publikacje", label: "Publikacje" },
  { href: "/projekty", label: "Projekty" },
  { href: "/psychoterapia", label: "Psychoterapia" },
  { href: "/wiedza", label: "Wiedza" },
];

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b border-[#5C2D91]/10 bg-[#F5F1EC]/90 backdrop-blur dark:border-white/10 dark:bg-neutral-950/90">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-[#1C1028] dark:text-white"
        >
          {siteConfig.name}
        </Link>

        {/* Główna nawigacja */}
        <div className="hidden items-center gap-7 text-xs font-medium tracking-widest uppercase lg:flex text-[#4A3360] dark:text-neutral-300">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-[#5C2D91] dark:hover:text-purple-300"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Przycisk KONTAKT / Panel */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/panel"
                className="text-sm font-medium text-[#5C2D91] hover:underline dark:text-purple-300"
              >
                Panel
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm text-neutral-500 transition-colors hover:text-[#1C1028] dark:text-neutral-400 dark:hover:text-white"
                >
                  Wyloguj
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/kontakt"
              className="rounded-full border border-[#5C2D91] px-5 py-2 text-xs font-semibold tracking-widest uppercase text-[#5C2D91] transition-colors hover:bg-[#5C2D91] hover:text-white dark:border-purple-400 dark:text-purple-300 dark:hover:bg-purple-700 dark:hover:text-white"
            >
              Kontakt →
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
