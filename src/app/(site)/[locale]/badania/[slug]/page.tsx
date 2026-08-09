import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { siteConfig } from "@/lib/site-config";
import {
  researchDirections,
  getResearchDirectionBySlug,
  RESEARCH_DIRECTION_ICONS,
  type ResearchDirectionId,
} from "@/lib/research-directions";
import { getPublicationsByTags } from "@/lib/publications";
import ResearchDirectionDetail, { type RelatedPublicationSummary } from "@/components/research/ResearchDirectionDetail";

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-research-cormorant",
});

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-research-manrope",
});

export function generateStaticParams() {
  return researchDirections.map((d) => ({ slug: d.slug }));
}

type DirectionCopy = {
  titleLine1: string;
  titleLine2: string;
  description: string;
  introduction: string;
  scope: string[];
  questions: string[];
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const direction = getResearchDirectionBySlug(slug);
  if (!direction) return {};

  const t = await getTranslations("ResearchPage");
  const directionCopy = t.raw("directions") as Record<ResearchDirectionId, DirectionCopy>;
  const copy = directionCopy[direction.id];
  const title = `${copy.titleLine1} ${copy.titleLine2}`;

  return {
    title: `${title} — ${siteConfig.name}`,
    description: copy.introduction,
    alternates: {
      canonical: getPathname({ href: `/badania/${slug}`, locale }),
    },
  };
}

export default async function BadaniaDirectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const direction = getResearchDirectionBySlug(slug);
  if (!direction) notFound();

  const t = await getTranslations("ResearchPage");
  const tDirectionPage = await getTranslations("ResearchDirectionPage");
  const tStatus = await getTranslations("PublicationStatus");

  const directionCopy = t.raw("directions") as Record<ResearchDirectionId, DirectionCopy>;
  const copy = directionCopy[direction.id];

  const relatedPublications: RelatedPublicationSummary[] = getPublicationsByTags(direction.candidateTags).map(
    (pub) => ({
      slug: pub.slug,
      title: pub.title,
      venue: pub.venue,
      type: pub.type,
      yearLabel: pub.year !== undefined ? String(pub.year) : pub.status === "w-trakcie" ? tStatus("inPreparation") : "",
    }),
  );

  return (
    <div className={`research-page ${cormorant.variable} ${manrope.variable}`}>
      <ResearchDirectionDetail
        number={direction.number}
        Icon={RESEARCH_DIRECTION_ICONS[direction.id]}
        title={`${copy.titleLine1} ${copy.titleLine2}`}
        titleLine1={copy.titleLine1}
        titleLine2={copy.titleLine2}
        shortDescription={copy.description}
        introduction={copy.introduction}
        scope={copy.scope}
        questions={copy.questions}
        breadcrumbHomeLabel={tDirectionPage("breadcrumbHome")}
        scopeHeading={tDirectionPage("scopeHeading")}
        questionsHeading={tDirectionPage("questionsHeading")}
        publicationsHeading={tDirectionPage("publicationsHeading")}
        noPublicationsLabel={tDirectionPage("noPublications")}
        ctaPublicationsLabel={tDirectionPage("ctaPublications")}
        ctaContactLabel={tDirectionPage("ctaContact")}
        relatedPublications={relatedPublications}
      />
    </div>
  );
}
