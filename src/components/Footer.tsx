import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/lib/site-config";

export default async function Footer() {
  const t = await getTranslations("Nav");
  const tFooter = await getTranslations("Footer");

  return (
    <footer className="mt-auto border-t border-[#4A1D6E]/10 bg-[#F5F1EC] py-6 dark:border-white/10 dark:bg-neutral-950">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-6 md:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <span className="font-bold text-[#1C1028] dark:text-white">{siteConfig.name}</span>
            <span className="text-[#4A3360] dark:text-neutral-500">·</span>
            <span className="text-sm text-[#4A3360] dark:text-neutral-400">{t("tagline")}</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#4A3360] dark:text-neutral-400">
            <Link href="/o-mnie" className="hover:text-[#4A1D6E] dark:hover:text-purple-300">{t("oMnie")}</Link>
            <Link href="/badania" className="hover:text-[#4A1D6E] dark:hover:text-purple-300">{t("badania")}</Link>
            <Link href="/publikacje" className="hover:text-[#4A1D6E] dark:hover:text-purple-300">{t("publikacje")}</Link>
            <Link href="/kontakt" className="hover:text-[#4A1D6E] dark:hover:text-purple-300">{t("kontakt")}</Link>
          </nav>

          <p className="flex flex-wrap items-center justify-center gap-2 text-sm text-[#4A3360] dark:text-neutral-500">
            <span>{tFooter("copyright", { year: new Date().getFullYear() })}</span>
            <span>·</span>
            <a href={`mailto:${siteConfig.email}`} className="hover:text-[#4A1D6E] dark:hover:text-purple-400">
              {siteConfig.email}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
