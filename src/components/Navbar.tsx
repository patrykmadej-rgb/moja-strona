import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { siteConfig } from "@/lib/site-config";

const navLinks = [
  { href: "/#o-mnie", label: "O mnie" },
  { href: "/#artykuly", label: "Artykuły naukowe" },
  { href: "/#badania", label: "Badania" },
  { href: "/psychoterapia", label: "Psychoterapia" },
];

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-neutral-950/80">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight text-neutral-900 dark:text-white">
          {siteConfig.name}
        </Link>

        <div className="hidden items-center gap-6 text-sm text-neutral-600 sm:flex dark:text-neutral-300">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-neutral-900 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/panel"
                className="text-sm font-medium text-neutral-900 hover:underline dark:text-white"
              >
                Panel
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                >
                  Wyloguj
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Zaloguj się
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
