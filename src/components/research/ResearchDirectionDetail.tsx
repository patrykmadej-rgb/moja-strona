import type { LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import ResearchNeuralNetwork from "./ResearchNeuralNetwork";
import { RESEARCH_CONTAINER_CLASS } from "./constants";

export type RelatedPublicationSummary = {
  slug: string;
  title: string;
  venue: string;
  type: string;
  yearLabel: string;
};

type Props = {
  number: string;
  Icon: LucideIcon;
  title: string;
  titleLine1: string;
  titleLine2: string;
  shortDescription: string;
  introduction: string;
  scope: string[];
  questions: string[];
  breadcrumbHomeLabel: string;
  scopeHeading: string;
  questionsHeading: string;
  publicationsHeading: string;
  noPublicationsLabel: string;
  ctaPublicationsLabel: string;
  ctaContactLabel: string;
  relatedPublications: RelatedPublicationSummary[];
};

/** Jeden reużywalny szablon dla wszystkich czterech podstron /badania/[slug] —
 * zasilany danymi z research-directions.ts + tłumaczeniami ResearchPage.directions
 * / ResearchDirectionPage, żeby nie duplikować treści ani layoutu w czterech
 * osobnych komponentach. Ta sama identyfikacja wizualna co /badania: krem,
 * Cormorant Garamond na nagłówkach (przez .research-font-display, patrz
 * .research-page w globals.css), fiolet, złote akcenty, delikatna sieć
 * neuronalna w tle. */
export default function ResearchDirectionDetail({
  number,
  Icon,
  title,
  titleLine1,
  titleLine2,
  shortDescription,
  introduction,
  scope,
  questions,
  breadcrumbHomeLabel,
  scopeHeading,
  questionsHeading,
  publicationsHeading,
  noPublicationsLabel,
  ctaPublicationsLabel,
  ctaContactLabel,
  relatedPublications,
}: Props) {
  return (
    <article className="research-direction-detail">
      <div className="research-direction-network" aria-hidden="true">
        <ResearchNeuralNetwork activeDirection={null} />
      </div>

      <div className={`${RESEARCH_CONTAINER_CLASS} research-direction-inner`}>
        <nav aria-label="Breadcrumb" className="research-direction-breadcrumb">
          <Link href="/badania">{breadcrumbHomeLabel}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{title}</span>
        </nav>

        <div className="research-direction-index">
          <span className="research-direction-number" aria-hidden="true">
            {number}
          </span>
          <Icon className="research-direction-icon" aria-hidden="true" />
        </div>

        <h1 className="research-direction-title research-font-display">
          {titleLine1}
          <br />
          {titleLine2}
        </h1>

        <p className="research-direction-lead">{shortDescription}</p>
        <p className="research-direction-intro">{introduction}</p>

        <div className="research-direction-grid">
          <section aria-labelledby="research-direction-scope-heading">
            <h2 id="research-direction-scope-heading" className="research-direction-section-heading research-font-display">
              {scopeHeading}
            </h2>
            <ul className="research-direction-scope-list">
              {scope.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="research-direction-questions-heading">
            <h2
              id="research-direction-questions-heading"
              className="research-direction-section-heading research-font-display"
            >
              {questionsHeading}
            </h2>
            <ol className="research-direction-questions-list">
              {questions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>
        </div>

        <section aria-labelledby="research-direction-pubs-heading" className="research-direction-pubs">
          <h2 id="research-direction-pubs-heading" className="research-direction-section-heading research-font-display">
            {publicationsHeading}
          </h2>
          {relatedPublications.length === 0 ? (
            <p className="research-direction-pubs-empty">{noPublicationsLabel}</p>
          ) : (
            <ul className="research-direction-pubs-list">
              {relatedPublications.map((pub) => (
                <li key={pub.slug}>
                  <Link href={`/publikacje/${pub.slug}`} className="research-direction-pub-link">
                    <span className="research-direction-pub-type">{pub.type}</span>
                    <span className="research-direction-pub-title">{pub.title}</span>
                    <span className="research-direction-pub-meta">
                      {pub.venue}
                      {pub.yearLabel ? ` · ${pub.yearLabel}` : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="research-direction-cta">
          <Link href="/publikacje" className="research-btn research-btn--primary">
            {ctaPublicationsLabel}
            <span aria-hidden="true" className="research-btn-arrow">
              →
            </span>
          </Link>
          <Link href="/kontakt" className="research-btn research-btn--secondary">
            {ctaContactLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
