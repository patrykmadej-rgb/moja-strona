import NextLink from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import NavLinks from "@/components/NavLinks";

const navLinks = [
  { href: "/o-mnie", key: "oMnie" },
  { href: "/badania", key: "badania" },
  { href: "/publikacje", key: "publikacje" },
  { href: "/projekty", key: "projekty" },
  { href: "/wiedza", key: "wiedza" },
];

export default async function Navbar() {
  const t = await getTranslations("Nav");
  const items = navLinks.map((link) => ({ ...link, label: t(link.key) }));

  return (
    <header className="sticky top-0 z-50 border-b border-[#4A1D6E]/10 bg-[#F5F1EC]/90 backdrop-blur dark:border-white/10 dark:bg-neutral-950/90">
      <NextLink
        href="/lab"
        title="Lab"
        aria-label="Lab"
        className="absolute top-1/2 right-4 -translate-y-1/2"
      >
        <Image
          src="/lab/lab-flask-icon.png"
          alt=""
          width={35}
          height={34}
          className="h-[34px] w-auto"
        />
      </NextLink>
      <nav className="mx-auto flex max-w-6xl items-center justify-between py-4 pl-6 pr-24">
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
        <NavLinks items={items} />

        {/* Przycisk KONTAKT + przełącznik języka. Publiczny header nigdy nie pokazuje
            "Wyloguj" — panel logowania obsługuje /lab, nie stronę publiczną. */}
        <div className="flex items-center gap-6">
          <LanguageSwitcher />
          <Link
            href="/kontakt"
            className="flex items-center gap-2 rounded-none bg-[#4A1D6E] px-5 py-2.5 text-xs font-semibold tracking-widest uppercase text-white transition-colors hover:bg-[#4A2073] dark:hover:bg-[#7B4DB8]"
          >
            {t("kontakt")}
            <Mail className="h-4 w-4" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
