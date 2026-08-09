import { Link } from "@/i18n/navigation";
import ResearchNeuralNetwork from "./ResearchNeuralNetwork";
import { RESEARCH_CONTAINER_CLASS } from "./constants";

type Props = {
  eyebrow: string;
  heading: string;
  cardLabel: string;
  bodyText: string;
  ctaPublicationsLabel: string;
  ctaContactLabel: string;
};

/** Jedna spójna kompozycja zamiast dawnego podziału ekranu dokładnie 50/50:
 * pełnoszerokościowe ciemne tło z bardzo subtelną siecią neuronalną, a na nim
 * nagłówek po lewej i lekko uniesiona, jasna "karta kontaktowa" po prawej. */
export default function ResearchClosingCta({
  eyebrow,
  heading,
  cardLabel,
  bodyText,
  ctaPublicationsLabel,
  ctaContactLabel,
}: Props) {
  return (
    <section className="research-closing-cta">
      <div className="research-closing-network" aria-hidden="true">
        <ResearchNeuralNetwork activeDirection={null} />
      </div>

      <div className={`${RESEARCH_CONTAINER_CLASS} research-closing-inner`}>
        <div className="research-closing-intro">
          <p className="research-closing-eyebrow">{eyebrow}</p>
          <h2 className="research-closing-heading research-font-display">{heading}</h2>
        </div>

        <div className="research-closing-card">
          <p className="research-closing-card-label">{cardLabel}</p>
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
      </div>
    </section>
  );
}
