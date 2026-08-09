import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { RESEARCH_CONTAINER_CLASS } from "./constants";

type Props = {
  headingLine1: string;
  headingLine2: string;
  ctaLabel: string;
};

export default function ResearchClosingCta({ headingLine1, headingLine2, ctaLabel }: Props) {
  return (
    <section className={`${RESEARCH_CONTAINER_CLASS} py-20 lg:py-28`}>
      <div className="rounded-research-md relative overflow-hidden border border-[var(--research-gold)]/40 bg-[var(--research-paper)]">
        <div aria-hidden="true" className="absolute inset-0">
          <Image
            src="/images/research/research-cta-accent.png"
            alt=""
            fill
            loading="lazy"
            sizes="(min-width: 1024px) 1320px, 100vw"
            className="object-cover"
            style={{ objectPosition: "right center" }}
          />
          {/* Gwarantuje czytelność tekstu niezależnie od dokładnych tonów obrazu przy
              lewej krawędzi — kremowy gradient zanikający w prawo. */}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--research-paper)] from-10% via-[var(--research-paper)]/80 via-45% to-transparent to-75%" />
        </div>
        <div className="relative z-10 px-8 py-14 sm:px-12 lg:px-16 lg:py-20">
          <h2 className="research-font-display max-w-[420px] text-3xl leading-[1.08] font-medium text-[var(--research-plum-900)] sm:text-4xl lg:text-[44px]">
            {headingLine1}
            <br />
            {headingLine2}
          </h2>
          <Link
            href="/publikacje"
            className="rounded-research-sm mt-8 inline-flex h-12 items-center justify-center gap-2 bg-[#4A1D6E] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#4A2073]"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
