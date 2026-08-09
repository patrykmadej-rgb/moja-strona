"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Publication } from "@/lib/publications";
import { RESEARCH_CONTAINER_CLASS } from "./constants";

type Props = {
  labelLine1: string;
  labelLine2: string;
  ctaLabel: string;
  emptyLabel: string;
  publications: Publication[];
  /** Rok (lub etykieta statusu "w-trakcie", gdy rok nie jest jeszcze znany), po jednym na slug. */
  yearLabels: Record<string, string>;
};

function PubMotif() {
  return (
    <svg aria-hidden="true" width="34" height="14" viewBox="0 0 34 14" className="research-pub-motif">
      <path
        d="M0,7 Q9,1 17,7 T34,7"
        stroke="var(--research-gold)"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />
      <circle cx="17" cy="7" r="1.6" fill="var(--research-purple)" opacity="0.5" />
    </svg>
  );
}

/** Elegancki indeks/akordeon — max. 3 prawdziwe publikacje z getFeaturedPublications()
 * (to samo źródło co "Ostatnie publikacje" na stronie głównej). Tylko jeden rekord
 * rozwinięty jednocześnie; pierwszy domyślnie rozwinięty; opis pokazany tylko, gdy
 * publikacja faktycznie ma streszczenie w danych. */
export default function ResearchPublications({
  labelLine1,
  labelLine2,
  ctaLabel,
  emptyLabel,
  publications,
  yearLabels,
}: Props) {
  const [openSlug, setOpenSlug] = useState<string | null>(publications[0]?.slug ?? null);

  return (
    <section className="research-publications">
      <div className={RESEARCH_CONTAINER_CLASS}>
        <div className="research-publications-grid">
          <div>
            <h2 className="research-publications-label">
              {labelLine1}
              <br />
              {labelLine2}
            </h2>
            <Link href="/publikacje" className="research-publications-cta">
              {ctaLabel}
              <span aria-hidden="true" className="research-pub-arrow">
                →
              </span>
            </Link>
          </div>

          {publications.length === 0 ? (
            <p className="py-16 text-center" style={{ color: "var(--research-muted)" }}>
              {emptyLabel}
            </p>
          ) : (
            <div>
              {publications.map((pub, i) => {
                const isOpen = openSlug === pub.slug;
                const panelId = `research-pub-panel-${pub.slug}`;
                return (
                  <div key={pub.slug} className="research-pub-row">
                    <div className="research-pub-trigger">
                      <span className="research-pub-number" aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <Link href={`/publikacje/${pub.slug}`} className="research-pub-main">
                        <span className="research-pub-category">{pub.type}</span>
                        <h3 className="research-pub-title">{pub.title}</h3>
                      </Link>
                      <span className="research-pub-year">{yearLabels[pub.slug]}</span>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        aria-label={`${isOpen ? "Zwiń opis" : "Rozwiń opis"}: ${pub.title}`}
                        onClick={() => setOpenSlug((cur) => (cur === pub.slug ? null : pub.slug))}
                        className="research-pub-toggle"
                      >
                        {isOpen ? (
                          <Minus className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    <div id={panelId} className="research-pub-panel" data-open={isOpen ? "true" : undefined}>
                      <div className="research-pub-panel-inner">
                        {pub.abstractPl && (
                          <p className="research-pub-abstract">
                            {pub.abstractPl}
                            <PubMotif />
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
