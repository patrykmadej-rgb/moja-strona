import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { siteConfig } from "@/lib/site-config";
import { researchAxes, currentWork, localizeAxis, localizeCurrentWorkItem } from "@/lib/research";
import ResearchInteractive from "@/components/research/ResearchInteractive";
import ExploreAxesButton from "@/components/research/ExploreAxesButton";

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
    expand: t("expand"),
    selected: t("selected"),
    questionsHeading: t("questionsHeading"),
    tagsHeading: t("tagsHeading"),
    seeRelatedProjects: t("seeRelatedProjects"),
    currentWorkEyebrow: t("currentWorkEyebrow"),
    currentWorkHeading: t("currentWorkHeading"),
    currentWorkIntro: t("currentWorkIntro"),
    filterAll: t("filterAll"),
    carouselPrev: t("carouselPrev"),
    carouselNext: t("carouselNext"),
    noResults: t("noResults"),
  };

  const heroLeft = (
    <div>
      <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#4A1D6E] dark:text-purple-400">
        {t("eyebrow")}
      </p>
      <h1 className="mt-4 text-4xl leading-tight font-medium tracking-tight text-[#1C1028] lg:text-5xl dark:text-white">
        {t("h1Line1")}
        <br />
        {t("h1Line2")}
      </h1>
      <p className="mt-5 max-w-md text-lg leading-relaxed text-[#4A3360] dark:text-neutral-300">
        {t("intro")}
      </p>
      <ExploreAxesButton label={t("ctaExplore")} />
    </div>
  );

  return (
    <div className="research-page">
      <ResearchInteractive
        heroLeft={heroLeft}
        axes={localizedAxes}
        currentWork={localizedWork}
        hasBackgroundImage={hasBackgroundImage}
        labels={labels}
      />
    </div>
  );
}
