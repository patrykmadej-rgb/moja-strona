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
 * Węzeł sieci jako koło — lekka biało-kremowa szklana soczewka, nie heksagon.
 * Warstwy (od dołu): `.research-hex-surface` (okrągła powierzchnia szkła,
 * zwykły `border` + `::after` jako drugi, wewnętrzny pierścień), dwie krótkie
 * kreski pomiarowe na obwodzie (12 i 6 — celowo tylko dwie, żeby koło nie
 * przypominało zegara ani diagramu astrologicznego), i zwięzła treść
 * wyśrodkowana w obu osiach (`.research-hex-content`). Całe koło jest jednym
 * linkiem (gdy `href` istnieje) prowadzącym do istniejącej podstrony
 * kierunku — `.research-hex-connector` to pojedynczy, drobny punkt na styku
 * z siecią neuronalną.
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
  const ariaLabel = `${titleLine1} ${titleLine2}`.trim();

  const surfaceInner = (
    <>
      <span className="research-hex-tick research-hex-tick--12" aria-hidden="true" />
      <span className="research-hex-tick research-hex-tick--6" aria-hidden="true" />
      <div className="research-hex-content">
        <div className="research-hex-index">
          <span className="research-hex-number" aria-hidden="true">
            {number}
          </span>
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
        <Link
          href={href}
          className="research-hex-surface"
          aria-label={ariaLabel}
          onFocus={onActivate}
          onBlur={onDeactivate}
        >
          {surfaceInner}
        </Link>
      ) : (
        <div
          className="research-hex-surface"
          tabIndex={0}
          role="group"
          aria-label={ariaLabel}
          onFocus={onActivate}
          onBlur={onDeactivate}
        >
          {surfaceInner}
        </div>
      )}
    </div>
  );
}
