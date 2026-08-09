import type { LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ResearchDirectionId } from "@/lib/research-directions";

type Props = {
  id: ResearchDirectionId;
  hexClass: string;
  number: string;
  Icon: LucideIcon;
  titleLine1: string;
  titleLine2: string;
  description: string;
  linkLabel: string;
  href?: string;
  onActivate: () => void;
  onDeactivate: () => void;
};

/**
 * Heksagon zbudowany z dwóch warstw clip-path (a nie zwykłego `border`, który
 * z clip-path wygląda źle): zewnętrzny `.research-hex-border` to cienka,
 * półprzezroczysta "obwódka" (1px padding), wewnętrzny `.research-hex-surface`
 * to właściwa, mniejsza powierzchnia z treścią (szkło, nie pełne wypełnienie —
 * sieć neuronalna w tle ma częściowo przeświecać). Tekst renderowany jako
 * zwykły HTML nad SVG sieci — nigdy w samym SVG. `.research-hex-connector` to
 * czysto dekoracyjny, pulsujący punkt na jednej krawędzi, sugerujący że
 * heksagon jest węzłem sieci, a nie osobną kartą.
 */
export default function ResearchHexNode({
  hexClass,
  number,
  Icon,
  titleLine1,
  titleLine2,
  description,
  linkLabel,
  href,
  onActivate,
  onDeactivate,
}: Props) {
  const content = (
    <>
      <div className="research-hex-index">
        <span className="research-hex-number" aria-hidden="true">
          {number}
        </span>
        <span className="research-hex-index-line" aria-hidden="true" />
        <Icon className="research-hex-icon" aria-hidden="true" />
      </div>
      <h3 className="research-hex-title research-font-display">
        {titleLine1}
        <br />
        {titleLine2}
      </h3>
      <p className="research-hex-desc">{description}</p>
      <span className="research-hex-link">
        {linkLabel}
        <span aria-hidden="true" className="research-hex-arrow">
          →
        </span>
      </span>
    </>
  );

  return (
    <div className={`research-hex ${hexClass}`} onMouseEnter={onActivate} onMouseLeave={onDeactivate}>
      <span className="research-hex-connector" aria-hidden="true" />
      <div className="research-hex-border">
        {href ? (
          <Link href={href} className="research-hex-surface" onFocus={onActivate} onBlur={onDeactivate}>
            {content}
          </Link>
        ) : (
          <div className="research-hex-surface" tabIndex={0} onFocus={onActivate} onBlur={onDeactivate}>
            {content}
          </div>
        )}
      </div>
    </div>
  );
}
