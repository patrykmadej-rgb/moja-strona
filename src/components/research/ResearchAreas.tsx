import type { ResearchAxisId } from "@/lib/research";
import { Link } from "@/i18n/navigation";
import { RESEARCH_AXIS_ICONS } from "./icons";
import { RESEARCH_CONTAINER_CLASS } from "./constants";

export type AreaItem = {
  id: ResearchAxisId;
  number: string;
  title: string;
  description: string;
  /** Prawdziwy istniejący route (np. /tagi/…), tylko gdy dla danego obszaru
   * faktycznie istnieje powiązana treść — patrz komentarz w page.tsx. */
  href?: string;
};

type Props = {
  eyebrow: string;
  intro: string;
  seeAreaLabel: string;
  areas: [AreaItem, AreaItem, AreaItem, AreaItem, AreaItem];
};

function SeeAreaAffordance({ label, interactive }: { label: string; interactive: boolean }) {
  return (
    <span
      className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold ${
        interactive ? "text-[var(--research-gold)]" : "text-[var(--research-gold)]/70"
      }`}
    >
      {label}
      <span
        aria-hidden="true"
        className={interactive ? "transition-transform duration-200 group-hover:translate-x-1" : ""}
      >
        →
      </span>
    </span>
  );
}

function FeaturedAreaPanel({ area, seeAreaLabel }: { area: AreaItem; seeAreaLabel: string }) {
  const Icon = RESEARCH_AXIS_ICONS[area.id];
  const inner = (
    <div className="rounded-research-lg relative flex h-full min-h-[420px] flex-col justify-between overflow-hidden p-8 lg:min-h-[520px] lg:p-12">
      {/* Duży, przygaszony numer w tle — czysto dekoracyjny akcent wypełniający
          największy moduł sekcji, bez informacji powielonej gdzie indziej. */}
      <span
        aria-hidden="true"
        className="research-font-display pointer-events-none absolute -right-4 -bottom-10 text-[220px] leading-none font-medium text-white/[0.05] select-none lg:text-[280px]"
      >
        {area.number}
      </span>

      <div className="relative z-10 flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-[var(--research-gold)]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-xs font-semibold tracking-[0.22em] text-[var(--research-gold)] uppercase">
          {area.number}
        </span>
      </div>

      <div className="relative z-10">
        <h3 className="research-font-display text-3xl leading-tight font-medium text-[var(--research-ivory)] lg:text-4xl">
          {area.title}
        </h3>
        <p className="mt-4 max-w-[440px] leading-relaxed text-[var(--research-ivory)]/75">{area.description}</p>
        <SeeAreaAffordance label={seeAreaLabel} interactive={Boolean(area.href)} />
      </div>
    </div>
  );

  const className =
    "group block h-full bg-[var(--research-plum-900)] transition-[transform,box-shadow] duration-[250ms] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--research-gold)] focus-visible:outline-offset-2" +
    (area.href ? " hover:-translate-y-1 hover:shadow-[var(--research-shadow)]" : "");

  if (area.href) {
    return (
      <Link href={area.href} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

function AreaModule({ area, seeAreaLabel }: { area: AreaItem; seeAreaLabel: string }) {
  const Icon = RESEARCH_AXIS_ICONS[area.id];
  const inner = (
    <div className="rounded-research-md flex h-full flex-col border border-[var(--research-line)] bg-[var(--research-paper)] p-6 lg:p-7">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--research-lavender-soft)] text-[var(--research-violet)]">
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <span className="text-[11px] font-semibold tracking-[0.2em] text-[var(--research-violet)]/70 uppercase">
          {area.number}
        </span>
      </div>
      <h3 className="mt-4 text-base leading-snug font-bold text-[var(--research-plum-900)] lg:text-lg">
        {area.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[#4A3360]">{area.description}</p>
      <div className="mt-auto">
        <SeeAreaAffordance label={seeAreaLabel} interactive={Boolean(area.href)} />
      </div>
    </div>
  );

  const className =
    "block h-full transition-[transform,border-color] duration-[250ms] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--research-gold)] focus-visible:outline-offset-2" +
    (area.href
      ? " group hover:-translate-y-[3px] [&:hover_.rounded-research-md]:border-[var(--research-gold)]/50"
      : "");

  if (area.href) {
    return (
      <Link href={area.href} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

export default function ResearchAreas({ eyebrow, intro, seeAreaLabel, areas }: Props) {
  const [featured, ...rest] = areas;

  return (
    <section id="obszary-badawcze" className={`${RESEARCH_CONTAINER_CLASS} pt-20 lg:pt-28`}>
      <h2 className="text-xs font-semibold tracking-[0.22em] text-[var(--research-violet)] uppercase">{eyebrow}</h2>
      <p className="mt-4 max-w-[620px] text-lg leading-relaxed text-[#4A3360]">{intro}</p>

      <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1.4fr] lg:items-stretch lg:gap-6">
        <FeaturedAreaPanel area={featured} seeAreaLabel={seeAreaLabel} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6">
          {rest.map((area) => (
            <AreaModule key={area.id} area={area} seeAreaLabel={seeAreaLabel} />
          ))}
        </div>
      </div>
    </section>
  );
}
