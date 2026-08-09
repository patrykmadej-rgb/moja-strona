import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/lib/site-config";

const LINKEDIN_URL = "https://www.linkedin.com/in/patrykmadej/";
const ORCID_URL = "https://orcid.org/0000-0002-7185-2441";

export default async function Footer() {
  const t = await getTranslations("Nav");
  const tFooter = await getTranslations("Footer");

  return (
    <footer className="mt-auto bg-[#F5F1EC]">
      <div className="h-px w-full bg-gradient-to-r from-[#C7A346]/50 via-[#B99ACB]/50 to-[#C7A346]/50" />
      <div className="mx-auto max-w-[1320px] px-6 py-[42px] lg:px-10">
        <div className="flex flex-col gap-8 text-center md:flex-row md:items-start md:justify-between md:text-left">
          <div>
            <p className="font-serif text-[28px] leading-none text-[#1C1028]">{siteConfig.name}</p>
            <p className="mt-2 text-sm text-[#4A3360]">{t("tagline")}</p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-[#4A3360] md:justify-end">
            <Link href="/o-mnie" className="hover:text-[#1C1028] hover:underline hover:decoration-[#C7A346] hover:underline-offset-4">
              {t("oMnie")}
            </Link>
            <Link href="/badania" className="hover:text-[#1C1028] hover:underline hover:decoration-[#C7A346] hover:underline-offset-4">
              {t("badania")}
            </Link>
            <Link href="/publikacje" className="hover:text-[#1C1028] hover:underline hover:decoration-[#C7A346] hover:underline-offset-4">
              {t("publikacje")}
            </Link>
            <Link href="/kontakt" className="hover:text-[#1C1028] hover:underline hover:decoration-[#C7A346] hover:underline-offset-4">
              {t("kontakt")}
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 border-t border-[#4A1D6E]/10 pt-6 text-center text-sm text-[#4A3360] md:flex-row md:items-center md:justify-between md:text-left">
          <p className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <span>{tFooter("copyright", { year: new Date().getFullYear() })}</span>
            <span className="text-[#4A3360]/40">·</span>
            <a href={`mailto:${siteConfig.email}`} className="hover:text-[#1C1028]">
              {siteConfig.email}
            </a>
          </p>

          <div className="flex items-center justify-center gap-5">
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#1C1028] hover:underline hover:decoration-[#C7A346] hover:underline-offset-4"
            >
              LinkedIn
            </a>
            <a
              href={ORCID_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#1C1028] hover:underline hover:decoration-[#C7A346] hover:underline-offset-4"
            >
              ORCID
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
