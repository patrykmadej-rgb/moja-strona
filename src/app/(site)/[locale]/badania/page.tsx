import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/lib/site-config";
import { researchDirections, type ResearchDirectionId } from "@/lib/research-directions";
import { publications, getFeaturedPublications } from "@/lib/publications";
import { getAllTags, tagToSlug } from "@/lib/tags";
import ResearchHero from "@/components/research/ResearchHero";
import ResearchDirectionNetwork, { type DirectionContent } from "@/components/research/ResearchDirectionNetwork";
import ResearchProcess from "@/components/research/ResearchProcess";
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

  // Kierunek dostaje prawdziwy link tylko wtedy, gdy istnieje faktyczna publikacja
  // oznaczona odpowiadającym tagiem (routing /tagi/[tag] generuje statyczne strony
  // wyłącznie dla tagów realnie występujących w publikacjach). Obecnie dotyczy to
  // tylko "separatism" (tag "Separatyzm"). Pozostałe trzy renderują się jako
  // wizualny (nieklikalny) odpowiednik "Poznaj kierunek →", żeby nie tworzyć
  // fikcyjnego routingu do nieistniejących podstron kierunków.
  const allTags = getAllTags(publications);
  const directionHref = new Map<ResearchDirectionId, string>();
  for (const dir of researchDirections) {
    const matchingTag = dir.candidateTags.find((tag) => allTags.includes(tag));
    if (matchingTag) directionHref.set(dir.id, `/tagi/${tagToSlug(matchingTag)}`);
  }

  const directionCopy = t.raw("directions") as Record<
    ResearchDirectionId,
    { titleLine1: string; titleLine2: string; description: string }
  >;
  const directions: DirectionContent[] = researchDirections.map((dir) => ({
    id: dir.id,
    number: dir.number,
    titleLine1: directionCopy[dir.id].titleLine1,
    titleLine2: directionCopy[dir.id].titleLine2,
    description: directionCopy[dir.id].description,
    href: directionHref.get(dir.id),
  }));

  const featuredPublications = getFeaturedPublications();
  const yearLabels: Record<string, string> = {};
  for (const pub of featuredPublications) {
    yearLabels[pub.slug] =
      pub.year !== undefined ? String(pub.year) : pub.status === "w-trakcie" ? tStatus("inPreparation") : "";
  }

  const heroIndex = t.raw("heroIndex") as [string, string, string, string];
  const processSteps = t.raw("processSteps") as [
    { number: string; label: string; description: string },
    { number: string; label: string; description: string },
    { number: string; label: string; description: string },
    { number: string; label: string; description: string },
  ];
  const questions = t.raw("questions3") as [string, string, string];

  return (
    <div className={`research-page ${cormorant.variable} ${manrope.variable}`}>
      <ResearchHero
        eyebrow={t("eyebrow")}
        h1Line1={t("h1Line1")}
        h1Line2={t("h1Line2")}
        description={t("heroDescription")}
        ctaPrimaryLabel={t("ctaExplore")}
        ctaSecondaryLabel={t("ctaPublications")}
        badgeLine1={t("heroBadgeLine1")}
        badgeLine2={t("heroBadgeLine2")}
        indexItems={heroIndex}
      />

      <ResearchDirectionNetwork
        eyebrow={t("directionsEyebrow")}
        headingLines={[t("directionsHeadingLine1"), t("directionsHeadingLine2"), t("directionsHeadingLine3")]}
        subtitle={t("directionsSubtitle")}
        linkLabel={t("directionsLinkLabel")}
        directions={directions}
      />

      <ResearchProcess
        heading={[t("processHeadingLine1"), t("processHeadingLine2"), t("processHeadingLine3")]}
        steps={processSteps}
      />

      <ResearchQuestions
        labelLine1={t("questionsLabelLine1")}
        labelLine2={t("questionsLabelLine2")}
        questions={questions}
      />

      <ResearchPublications
        eyebrow={t("publicationsEyebrow")}
        heading={t("publicationsHeading")}
        intro={t("publicationsIntro")}
        ctaLabel={t("publicationsCta")}
        readMoreLabel={t("publicationsReadMore")}
        emptyLabel={t("noPublications")}
        publications={featuredPublications}
        yearLabels={yearLabels}
      />

      <ResearchClosingCta
        eyebrow={t("closingEyebrow")}
        heading={t("closingHeading")}
        cardLabel={t("closingCardLabel")}
        bodyText={t("closingBody")}
        ctaPublicationsLabel={t("closingCtaPublications")}
        ctaContactLabel={t("closingCtaContact")}
      />
    </div>
  );
}
