import Image from "next/image";
import { Link } from "@/i18n/navigation";
import ExploreAxesButton from "./ExploreAxesButton";

type Props = {
  eyebrow: string;
  h1Line1: string;
  h1Line2: string;
  description: string;
  ctaPrimaryLabel: string;
  ctaSecondaryLabel: string;
  badgeLine1: string;
  badgeLine2: string;
  indexItems: [string, string, string, string];
};

export default function ResearchHero({
  eyebrow,
  h1Line1,
  h1Line2,
  description,
  ctaPrimaryLabel,
  ctaSecondaryLabel,
  badgeLine1,
  badgeLine2,
  indexItems,
}: Props) {
  return (
    <section className="research-hero research-container">
      <div>
        <p className="research-hero-eyebrow">{eyebrow}</p>
        <h1 className="research-hero-title">
          {h1Line1}
          <br />
          {h1Line2}
        </h1>
        <p className="research-hero-description">{description}</p>

        <div className="research-hero-actions">
          <ExploreAxesButton label={ctaPrimaryLabel} />
          <Link href="/publikacje" className="research-btn research-btn--secondary">
            {ctaSecondaryLabel}
          </Link>
        </div>

        <div className="research-hero-index" aria-label={indexItems.join(" · ")}>
          {indexItems.map((item, i) => (
            <span key={item} className="research-hero-index-sep">
              {i > 0 && (
                <>
                  <span aria-hidden="true" className="research-hero-index-line" />
                  <span aria-hidden="true" className="research-hero-index-dot" />
                </>
              )}
              <span className="research-hero-index-item">{item}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="research-hero-visual">
        <span className="research-hero-badge">
          {badgeLine1}
          <br />
          {badgeLine2}
        </span>
        <Image
          src="/images/research/research-hero-neural-paper.png"
          alt="Warstwy archiwalnych dokumentów badawczych spięte gałęzią sieci neuronalnej"
          width={1536}
          height={1024}
          priority
          sizes="(min-width: 1024px) 600px, (min-width: 768px) 390px, 360px"
          className="research-hero-image"
        />
      </div>
    </section>
  );
}
