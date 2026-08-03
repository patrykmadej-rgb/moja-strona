import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { getLocale, getTranslations } from "next-intl/server";
import { siteConfig } from "@/lib/site-config";
import { Link } from "@/i18n/navigation";
import { researchAxes, currentWork, localizeAxis, localizeCurrentWorkItem } from "@/lib/research";
import ResearchInteractive from "@/components/research/ResearchInteractive";
import ResearchClosingSection from "@/components/research/ResearchClosingSection";
import ExploreAxesButton from "@/components/research/ExploreAxesButton";

// Typografia zawężona do /badania (nie dotyka globalnych fontów Geist z
// (site)/layout.tsx) — zmienne CSS podpięte na kontenerze .research-page,
// zgodnie z istniejącym wzorcem skopowanych tokenów tej podstrony w globals.css.
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-research-cormorant",
});

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-research-manrope",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ResearchPage");
  return {
    title: `${t("metaTitle")} — ${siteConfig.name}`,
    description: t("metaDescription"),
  };
}

export default async function BadaniaPage() {
  const t = await getTranslations("ResearchPage");
  const locale = await getLocale();

  const localizedAxes = researchAxes.map((axis) => localizeAxis(axis, locale));
  const localizedWork = currentWork.map((item) => localizeCurrentWorkItem(item, locale));

  const hasBackgroundImage = fs.existsSync(
    path.join(process.cwd(), "public/research/research-map-background.png"),
  );

  const labels = {
    mapLabel: t("mapLabel"),
    mapAriaLabel: t("mapAriaLabel"),
    mapNodeOpenDetails: t("mapNodeOpenDetails"),
    mapCenterLabel: t("mapCenterLabel"),
    mapMobileHint: t("mapMobileHint"),
    axesEyebrow: t("axesEyebrow"),
    featuredBadge: t("featuredBadge"),
    expand: t("expand"),
    selected: t("selected"),
    questionsHeading: t("questionsHeading"),
    tagsHeading: t("tagsHeading"),
    seeRelatedProjects: t("seeRelatedProjects"),
    currentWorkEyebrow: t("currentWorkEyebrow"),
    currentWorkHeading: t("currentWorkHeading"),
    filterAll: t("filterAll"),
    seeAll: t("seeAll"),
    showLess: t("showLess"),
    noResults: t("noResults"),
  };

  const heroLeft = (
    <div>
      <p className="text-xs font-semibold tracking-[0.22em] uppercase text-[#4A1D6E] dark:text-purple-400">
        {t("eyebrow")}
      </p>
      <h1 className="research-font-display mt-4 text-[44px] leading-[0.98] font-medium tracking-tight text-[#1C1028] sm:text-[56px] lg:text-[70px] dark:text-white">
        {t("h1Line1")}
        <br />
        {t("h1Line2")}
      </h1>
      <p className="mt-5 max-w-[540px] text-lg leading-[1.55] text-[#4A3360] dark:text-neutral-300">
        {t("intro")}
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <ExploreAxesButton label={t("ctaExplore")} />
        <Link
          href="/publikacje"
          className="rounded-research-sm group inline-flex h-12 items-center justify-center gap-2 border border-[#4A1D6E]/35 px-6 text-sm font-semibold text-[#4A1D6E] transition-colors hover:border-[#4A1D6E]/60 hover:bg-[#4A1D6E]/5 dark:border-purple-400/40 dark:text-purple-300"
        >
          {t("ctaPublications")}
          <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>
    </div>
  );

  const closing = (
    <ResearchClosingSection
      eyebrow={t("approachEyebrow")}
      heading={t("approachHeading")}
      body={t("approachBody")}
      linkLabel={t("approachLink")}
      questionsEyebrow={t("questionsEyebrow")}
      questions={t.raw("researchQuestions") as string[]}
    />
  );

  return (
    <div className={`research-page ${cormorant.variable} ${manrope.variable}`}>
      <ResearchInteractive
        heroLeft={heroLeft}
        axes={localizedAxes}
        currentWork={localizedWork}
        hasBackgroundImage={hasBackgroundImage}
        labels={labels}
        closing={closing}
      />
    </div>
  );
}
