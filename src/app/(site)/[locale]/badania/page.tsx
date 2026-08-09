import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/lib/site-config";
import { researchAxes, type ResearchAxisId } from "@/lib/research";
import { publications, getFeaturedPublications } from "@/lib/publications";
import { getAllTags, tagToSlug } from "@/lib/tags";
import ResearchHero from "@/components/research/ResearchHero";
import ResearchAreas, { type AreaItem } from "@/components/research/ResearchAreas";
import ResearchQuestions from "@/components/research/ResearchQuestions";
import ResearchPublications from "@/components/research/ResearchPublications";
import ResearchClosingCta from "@/components/research/ResearchClosingCta";

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
  const tStatus = await getTranslations("PublicationStatus");

  // Moduł obszaru dostaje prawdziwy link tylko wtedy, gdy istnieje faktyczna
  // publikacja oznaczona odpowiadającym tagiem (routing /tagi/[tag] generuje
  // statyczne strony wyłącznie dla tagów realnie występujących w publikacjach).
  // Obecnie dotyczy to tylko "Bałkany Zachodnie" — pozostałe obszary renderują
  // się jako wizualny (nieklikalny) odpowiednik, żeby nie tworzyć fikcyjnego routingu.
  const allTags = getAllTags(publications);
  const axisTagHref = new Map<ResearchAxisId, string>();
  for (const axis of researchAxes) {
    const matchingTag = axis.tagsPl.find((tag) => allTags.includes(tag));
    if (matchingTag) axisTagHref.set(axis.id, `/tagi/${tagToSlug(matchingTag)}`);
  }

  const areaCopy = t.raw("areas") as Record<ResearchAxisId, { title: string; description: string }>;
  const areas = researchAxes.map((axis) => ({
    id: axis.id,
    number: axis.number,
    title: areaCopy[axis.id].title,
    description: areaCopy[axis.id].description,
    href: axisTagHref.get(axis.id),
  })) as [AreaItem, AreaItem, AreaItem, AreaItem, AreaItem];

  const featuredPublications = getFeaturedPublications();
  const yearLabels: Record<string, string> = {};
  for (const pub of featuredPublications) {
    yearLabels[pub.slug] =
      pub.year !== undefined ? String(pub.year) : pub.status === "w-trakcie" ? tStatus("inPreparation") : "";
  }

  const heroWords = t.raw("heroWords") as [string, string, string];
  const questions = t.raw("questionsSection.items") as [string, string, string];

  return (
    <div className={`research-page ${cormorant.variable} ${manrope.variable}`}>
      <ResearchHero
        eyebrow={t("eyebrow")}
        h1Line1={t("h1Line1")}
        h1Line2={t("h1Line2")}
        intro={t("intro")}
        ctaExploreLabel={t("ctaExplore")}
        ctaPublicationsLabel={t("ctaPublications")}
        heroWords={heroWords}
      />

      <ResearchAreas
        eyebrow={t("axesEyebrow")}
        intro={t("areasIntro")}
        seeAreaLabel={t("areasSeeArea")}
        areas={areas}
      />

      <ResearchQuestions
        headingLine1={t("questionsSection.headingLine1")}
        headingLine2={t("questionsSection.headingLine2")}
        intro={t("questionsSection.intro")}
        questions={questions}
      />

      <ResearchPublications
        heading={t("publicationsHeading")}
        ctaLabel={t("publicationsCta")}
        emptyLabel={t("noPublications")}
        publications={featuredPublications}
        yearLabels={yearLabels}
      />

      <ResearchClosingCta
        headingLine1={t("closingHeadingLine1")}
        headingLine2={t("closingHeadingLine2")}
        ctaLabel={t("closingCta")}
      />
    </div>
  );
}
