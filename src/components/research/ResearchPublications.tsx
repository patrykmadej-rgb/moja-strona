"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Publication } from "@/lib/publications";
import { RESEARCH_CONTAINER_CLASS } from "./constants";

type Props = {
  eyebrow: string;
  heading: string;
  intro: string;
  ctaLabel: string;
  readMoreLabel: string;
  emptyLabel: string;
  publications: Publication[];
  /** Rok (lub etykieta statusu "w-trakcie", gdy rok nie jest jeszcze znany), po jednym na slug. */
  yearLabels: Record<string, string>;
};

/** Bardzo subtelny, kodowy ornament — ta sama "neuralna" stylistyka (organiczne
 * krzywe + złote punkty) co reszta podstrony, tylko w skali dopasowanej do
 * jednego rozwiniętego wiersza indeksu. Nigdy nie odciąga uwagi od tekstu
 * (opacity nadana na wrapperze w CSS). */
function ResearchPubOrnament() {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 220" className="research-pub-ornament">
      <path
        d="M20,30 Q70,10 100,55 Q125,90 90,120 Q60,145 100,175 Q135,198 170,190"
        stroke="var(--research-lavender)"
        strokeWidth="1.1"
        fill="none"
      />
      <path
        d="M100,55 Q140,60 165,35"
        stroke="var(--research-lavender)"
        strokeWidth="0.8"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M90,120 Q45,125 25,155"
        stroke="var(--research-lavender)"
        strokeWidth="0.8"
        fill="none"
        opacity="0.7"
      />
      <circle cx="20" cy="30" r="2.6" fill="var(--research-gold)" />
      <circle cx="100" cy="55" r="3.2" fill="var(--research-gold)" />
      <circle cx="90" cy="120" r="2.8" fill="var(--research-gold)" />
      <circle cx="100" cy="175" r="2.4" fill="var(--research-gold)" />
      <circle cx="170" cy="190" r="2" fill="var(--research-gold)" />
    </svg>
  );
}

/** Elegancki, pełnowymiarowy indeks redakcyjny — max. 3 prawdziwe publikacje z
 * getFeaturedPublications() (to samo źródło co "Ostatnie publikacje" na stronie
 * głównej). Tylko jeden rekord rozwinięty jednocześnie; pierwszy domyślnie
 * rozwinięty. Cały wiersz jest jednym <button> (aria-expanded) — upraszcza to
 * model dostępności względem osobnego linku + osobnego przycisku, a link do
 * pełnej publikacji ("Czytaj publikację →", zawsze prawdziwy adres
 * /publikacje/[slug]) żyje w rozwiniętej treści, nie w nagłówku wiersza. */
export default function ResearchPublications({
  eyebrow,
  heading,
  intro,
  ctaLabel,
  readMoreLabel,
  emptyLabel,
  publications,
  yearLabels,
}: Props) {
  const [openSlug, setOpenSlug] = useState<string | null>(publications[0]?.slug ?? null);

  return (
    <section className="research-publications">
      <div className={RESEARCH_CONTAINER_CLASS}>
        <div className="research-pubs-header">
          <div className="research-pubs-header-text">
            <p className="research-pubs-eyebrow">{eyebrow}</p>
            <h2 className="research-pubs-heading research-font-display">{heading}</h2>
            <p className="research-pubs-intro">{intro}</p>
          </div>
          <Link href="/publikacje" className="research-pubs-cta">
            {ctaLabel}
            <span aria-hidden="true" className="research-pub-arrow">
              →
            </span>
          </Link>
        </div>

        {publications.length === 0 ? (
          <p className="research-pubs-empty">{emptyLabel}</p>
        ) : (
          <div className="research-pubs-list">
            {publications.map((pub, i) => {
              const isOpen = openSlug === pub.slug;
              const panelId = `research-pub-panel-${pub.slug}`;
              const year = yearLabels[pub.slug];
              return (
                <div key={pub.slug} className="research-pub-row" data-open={isOpen ? "true" : undefined}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    aria-label={`${pub.type}: ${pub.title}${year ? `, ${year}` : ""}`}
                    onClick={() => setOpenSlug((cur) => (cur === pub.slug ? null : pub.slug))}
                    className="research-pub-trigger"
                  >
                    <span className="research-pub-number" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="research-pub-main">
                      <span className="research-pub-year-mobile" aria-hidden="true">
                        {year}
                      </span>
                      <span className="research-pub-category" aria-hidden="true">
                        {pub.type}
                      </span>
                      <h3 className="research-pub-title">{pub.title}</h3>
                    </span>
                    <span className="research-pub-year" aria-hidden="true">
                      {year}
                    </span>
                    <span className="research-pub-toggle" aria-hidden="true">
                      {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </span>
                  </button>

                  <div id={panelId} className="research-pub-panel" data-open={isOpen ? "true" : undefined}>
                    <div className="research-pub-panel-inner">
                      <div className="research-pub-expanded">
                        <div className="research-pub-expanded-text">
                          {pub.abstractPl && <p className="research-pub-abstract">{pub.abstractPl}</p>}
                          <Link href={`/publikacje/${pub.slug}`} className="research-pub-readmore">
                            {readMoreLabel}
                            <span aria-hidden="true">→</span>
                          </Link>
                        </div>
                        <ResearchPubOrnament />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
