import { Link } from "@/i18n/navigation";
import ResearchNeuralNetwork from "./ResearchNeuralNetwork";

type Props = {
  headingLine1: string;
  headingLine2: string;
  headingLine3: string;
  bodyText: string;
  ctaPublicationsLabel: string;
  ctaContactLabel: string;
};

export default function ResearchClosingCta({
  headingLine1,
  headingLine2,
  headingLine3,
  bodyText,
  ctaPublicationsLabel,
  ctaContactLabel,
}: Props) {
  return (
    <section className="research-closing-cta">
      <div className="research-closing-dark">
        <div className="research-closing-network" aria-hidden="true">
          <ResearchNeuralNetwork activeDirection={null} />
        </div>
        <h2 className="research-closing-heading research-font-display">
          {headingLine1}
          <br />
          {headingLine2}
          <br />
          {headingLine3}
        </h2>
      </div>

      <div className="research-closing-light">
        <p className="research-closing-text">{bodyText}</p>
        <div className="research-closing-actions">
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
    </section>
  );
}
