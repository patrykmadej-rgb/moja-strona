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
  href: string;
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
 * semantycznym linkiem prowadzącym do podstrony kierunku (/badania/[slug])
 * — `.research-hex-connector` to drobne punkty styku z siecią neuronalną
 * (min. dwa na koło — punkt wejścia i wyjścia; koło 02, jako największe,
 * ma trzy), pozycjonowane tak, żeby dokładnie odpowiadać zakończeniom
 * konkretnych gałęzi w ResearchNeuralNetwork.tsx (patrz komentarz tam).
 */
export default function ResearchHexNode({
  id,
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
      {/* Dzieci .research-hex-surface (position:relative), NIE .research-hex —
          .research-hex jest elementem siatki 2x2 poniżej 1024px, a
          position:relative na elemencie grid z aspect-ratio łamie tam
          wyrównanie wierszy (align-items:start) w tej przeglądarce
          (zmierzone: koła 03/04 "rozjeżdżały się" o >100px). Surface ma
          identyczny rozmiar co .research-hex (100%/100%), więc pozycja
          wizualna kropek jest taka sama, bez tego efektu ubocznego. */}
      <span className="research-hex-connector research-hex-connector--a" aria-hidden="true" />
      <span className="research-hex-connector research-hex-connector--b" aria-hidden="true" />
      {id === "profiling" && <span className="research-hex-connector research-hex-connector--c" aria-hidden="true" />}
      <span className="research-hex-tick research-hex-tick--12" aria-hidden="true" />
      <span className="research-hex-tick research-hex-tick--6" aria-hidden="true" />
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
      <Link
        href={href}
        className="research-hex-surface"
        aria-label={ariaLabel}
        onFocus={onActivate}
        onBlur={onDeactivate}
      >
        {surfaceInner}
      </Link>
    </div>
  );
}
