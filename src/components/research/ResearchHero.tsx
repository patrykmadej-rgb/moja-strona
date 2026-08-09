import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { RESEARCH_CONTAINER_CLASS } from "./constants";
import ExploreAxesButton from "./ExploreAxesButton";

type Props = {
  eyebrow: string;
  h1Line1: string;
  h1Line2: string;
  intro: string;
  ctaExploreLabel: string;
  ctaPublicationsLabel: string;
  heroWords: [string, string, string];
};

/**
 * Wysokość ~ calc(100svh - header) tylko od lg w górę — na mniejszych ekranach
 * hero po prostu przyjmuje naturalną wysokość treści (tekst + CTA + obraz w
 * jednej kolumnie), żeby nie wymuszać pustej przestrzeni pod treścią na telefonie.
 * 88px ≈ realna wysokość sticky Navbar (logo h-14 + py-4 + border).
 */
export default function ResearchHero({
  eyebrow,
  h1Line1,
  h1Line2,
  intro,
  ctaExploreLabel,
  ctaPublicationsLabel,
  heroWords,
}: Props) {
  return (
    <section className="pt-14 pb-14 lg:flex lg:min-h-[calc(100svh-88px)] lg:items-center lg:pt-8 lg:pb-12">
      <div
        className={`${RESEARCH_CONTAINER_CLASS} grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16`}
      >
        {/* LEWA KOLUMNA — tekst + CTA. Pierwsza w DOM, więc na mobile (grid → jedna
            kolumna) treść i przyciski naturalnie poprzedzają obraz. */}
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-[var(--research-violet)] uppercase">
            {eyebrow}
          </p>
          <h1 className="research-font-display mt-5 text-[44px] leading-[0.98] font-medium tracking-tight text-[var(--research-plum-900)] sm:text-[56px] lg:text-[68px]">
            {h1Line1}
            <br />
            {h1Line2}
          </h1>
          <p className="mt-6 max-w-[520px] text-lg leading-[1.6] text-[#4A3360]">{intro}</p>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <ExploreAxesButton label={ctaExploreLabel} />
            <Link
              href="/publikacje"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-[var(--research-violet)] transition-colors hover:text-[#4A1D6E]"
            >
              {ctaPublicationsLabel}
              <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>

        {/* PRAWA KOLUMNA — dossier. object-contain (bez agresywnego przycinania),
            bez karty/ramki/cienia, żeby kremowe tło zdjęcia płynnie łączyło się
            z tłem strony i wyglądało jak integralna część layoutu. */}
        <div className="mx-auto w-full max-w-[380px] lg:max-w-none">
          <div className="research-hero-in relative aspect-[1122/1402] w-full">
            <Image
              src="/images/research/research-hero-dossier.png"
              alt="Warstwa materiałów badawczych: notatki, mapy konturowe i archiwalne dokumenty"
              fill
              priority
              sizes="(min-width: 1024px) 44vw, (min-width: 640px) 60vw, 84vw"
              className="object-contain"
            />
          </div>
          <div
            aria-hidden="true"
            className="mt-6 flex items-center justify-between text-[11px] font-semibold tracking-[0.24em] text-[var(--research-plum-900)]/70 uppercase sm:text-xs lg:text-sm"
          >
            <span>{heroWords[0]}</span>
            <span>{heroWords[1]}</span>
            <span>{heroWords[2]}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
