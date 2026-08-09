import { Link } from "@/i18n/navigation";
import type { Publication } from "@/lib/publications";
import { RESEARCH_CONTAINER_CLASS } from "./constants";

type Props = {
  heading: string;
  ctaLabel: string;
  emptyLabel: string;
  publications: Publication[];
  /** Rok (lub etykieta statusu "w-trakcie", gdy rok nie jest jeszcze znany), po jednym na slug. */
  yearLabels: Record<string, string>;
};

/** Elegancki indeks redakcyjny — bez kart, cienkie separatory, dużo przestrzeni.
 * Źródło danych: getFeaturedPublications() z src/lib/publications.ts (to samo,
 * co sekcja "Ostatnie publikacje" na stronie głównej), max. 3 pozycje. */
export default function ResearchPublications({ heading, ctaLabel, emptyLabel, publications, yearLabels }: Props) {
  return (
    <section className={`${RESEARCH_CONTAINER_CLASS} pt-20 lg:pt-28`}>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--research-line)] pb-6">
        <h2 className="text-xs font-semibold tracking-[0.22em] text-[var(--research-violet)] uppercase">{heading}</h2>
        <Link
          href="/publikacje"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-[var(--research-violet)] transition-colors hover:text-[#4A1D6E]"
        >
          {ctaLabel}
          <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>

      {publications.length === 0 ? (
        <p className="py-16 text-center text-[#4A3360]">{emptyLabel}</p>
      ) : (
        <ul>
          {publications.map((pub) => (
            <li key={pub.slug} className="border-b border-[var(--research-line)]">
              <Link
                href={`/publikacje/${pub.slug}`}
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-7 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--research-gold)] focus-visible:outline-offset-4 sm:gap-8"
              >
                <span className="w-16 shrink-0 text-sm font-semibold tracking-wide text-[var(--research-gold)] sm:w-20">
                  {yearLabels[pub.slug]}
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold tracking-[0.16em] text-[#4A3360] uppercase">
                    {pub.type}
                  </span>
                  <span className="mt-1 block text-lg leading-snug font-bold text-[var(--research-plum-900)] transition-colors group-hover:text-[var(--research-violet)] sm:text-xl">
                    {pub.title}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="text-[var(--research-violet)] transition-transform duration-200 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
