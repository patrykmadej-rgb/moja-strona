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
 * Węzeł sieci jako koło — soczewka badawcza, nie heksagon. Warstwy (od dołu):
 * `.research-hex-surface` (okrągła powierzchnia szkła, zwykły `border` +
 * `::after` jako drugi, wewnętrzny pierścień — koło nie ma problemu z
 * `clip-path` obcinającym `box-shadow`, więc nie potrzeba już osobnego
 * wrappera-"sandwicha" jak przy heksagonie), cztery krótkie kreski pomiarowe
 * na obwodzie, cienki niepełny łuk (SVG), i właściwa treść w wąskiej,
 * wyśrodkowanej kolumnie (`.research-hex-content`) — żeby tekst nie dotykał
 * krzywizny koła. `.research-hex-connector` to pojedynczy, drobny punkt na
 * styku z siecią neuronalną.
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
  const surfaceInner = (
    <>
      <span className="research-hex-tick research-hex-tick--12" aria-hidden="true" />
      <span className="research-hex-tick research-hex-tick--3" aria-hidden="true" />
      <span className="research-hex-tick research-hex-tick--6" aria-hidden="true" />
      <span className="research-hex-tick research-hex-tick--9" aria-hidden="true" />
      <svg className="research-hex-arc" aria-hidden="true" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" pathLength={100} />
      </svg>
      <div className="research-hex-content">
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
      </div>
    </>
  );

  return (
    <div className={`research-hex ${hexClass}`} onMouseEnter={onActivate} onMouseLeave={onDeactivate}>
      <span className="research-hex-connector" aria-hidden="true" />
      {href ? (
        <Link href={href} className="research-hex-surface" onFocus={onActivate} onBlur={onDeactivate}>
          {surfaceInner}
        </Link>
      ) : (
        <div className="research-hex-surface" tabIndex={0} onFocus={onActivate} onBlur={onDeactivate}>
          {surfaceInner}
        </div>
      )}
    </div>
  );
}
