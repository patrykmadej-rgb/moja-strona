"use client";

import { useState } from "react";
import { RESEARCH_DIRECTION_ICONS, type ResearchDirectionId } from "@/lib/research-directions";
import ResearchNeuralNetwork from "./ResearchNeuralNetwork";
import ResearchHexNode from "./ResearchHexNode";

const HEX_CLASS: Record<ResearchDirectionId, string> = {
  separatism: "research-hex--01",
  profiling: "research-hex--02",
  threats: "research-hex--03",
  prevention: "research-hex--04",
};

export type DirectionContent = {
  id: ResearchDirectionId;
  number: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  href: string;
};

type Props = {
  eyebrow: string;
  headingLines: [string, string, string];
  subtitle: string;
  linkLabel: string;
  directions: DirectionContent[];
};

/**
 * Pełnoszerokościowa, ciemna sekcja "żywej" sieci neuronalnej z czterema
 * heksagonami kierunków badawczych nad nią. Stan aktywnego kierunku żyje tutaj
 * (rodzic), współdzielony przez SVG sieci (podświetla powiązane ścieżki/synapsy)
 * i same heksagony (hover/focus).
 */
export default function ResearchDirectionNetwork({ eyebrow, headingLines, subtitle, linkLabel, directions }: Props) {
  const [activeDirection, setActiveDirection] = useState<ResearchDirectionId | null>(null);

  return (
    <section
      id="research-directions"
      aria-labelledby="research-directions-heading"
      className="research-directions-section"
    >
      <ResearchNeuralNetwork activeDirection={activeDirection} />

      <div className="research-directions-inner">
        <div className="research-directions-heading">
          <p className="research-directions-eyebrow">{eyebrow}</p>
          <h2 id="research-directions-heading" className="research-directions-title research-font-display">
            {headingLines[0]}
            <br />
            {headingLines[1]}
            <br />
            {headingLines[2]}
          </h2>
          <p className="research-directions-subtitle">{subtitle}</p>
        </div>

        <div className="research-hex-field">
          {directions.map((d) => (
            <ResearchHexNode
              key={d.id}
              id={d.id}
              hexClass={HEX_CLASS[d.id]}
              number={d.number}
              Icon={RESEARCH_DIRECTION_ICONS[d.id]}
              titleLine1={d.titleLine1}
              titleLine2={d.titleLine2}
              description={d.description}
              linkLabel={linkLabel}
              href={d.href}
              onActivate={() => setActiveDirection(d.id)}
              onDeactivate={() => setActiveDirection((cur) => (cur === d.id ? null : cur))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
