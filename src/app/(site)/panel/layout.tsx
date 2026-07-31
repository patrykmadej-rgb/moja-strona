import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";

const panelLinks = [
  { href: "/panel", label: "Przegląd" },
  { href: "/panel/pomysly", label: "Pomysły na artykuły" },
  { href: "/panel/zjazdy", label: "Zjazdy" },
];

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10 sm:flex-row">
      <aside className="shrink-0 sm:w-48">
        <p className="mb-3 truncate text-xs text-neutral-500 dark:text-neutral-400">
          {user.email}
        </p>
        <nav className="flex flex-row gap-2 overflow-x-auto sm:flex-col sm:gap-1">
          {panelLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm whitespace-nowrap text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <form action={signOut} className="mt-4 hidden sm:block">
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white"
          >
            Wyloguj
          </button>
        </form>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
