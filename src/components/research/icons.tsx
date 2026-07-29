import type { SVGProps } from "react";
import type { ResearchAxisId } from "@/lib/research";

/**
 * Wersje inline (JSX) ikon z public/research/icons/*.svg — potrzebne, żeby
 * stroke="currentColor" realnie dziedziczył kolor z CSS (np. na hover węzła
 * mapy). Element <img>/<Image> renderuje SVG w osobnym kontekście i currentColor
 * nie zadziała, dlatego te same kształty są tu zduplikowane jako komponenty.
 * Zawartość musi pozostać zsynchronizowana z plikami w public/research/icons/.
 */

export function BalkansSeparatismIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none" {...props}>
      <g stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M27 17 42 12l8 8 13-2 5 10-8 8 8 9-5 11-10-1-4 9 5 9-9 11-8-8-8 2-3-12-8-6 5-11-7-9 8-7-2-9 5-7Z" />
        <path d="m35 23 9 7-4 9 9 5-2 10 8 7M25 39l15 1M29 58l18-4M37 76l4-13" />
        <circle cx={44} cy={30} r={2.8} fill="currentColor" stroke="none" />
        <circle cx={47} cy={54} r={2.8} fill="currentColor" stroke="none" />
        <circle cx={41} cy={63} r={2.8} fill="currentColor" stroke="none" />
        <path d="M44 30 47 54 41 63" />
      </g>
    </svg>
  );
}

export function SecurityPsychologyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none" {...props}>
      <g stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M47 12c9 7 18 9 27 10v23c0 18-10 30-27 39C30 75 20 63 20 45V22c9-1 18-3 27-10Z" />
        <path d="M47 25v42M34 40c0-7 5-12 13-12M32 48c0 8 6 13 15 13M60 37c0-5-4-9-10-9M63 47c0-6-5-10-13-10M61 57c-2 3-6 5-11 5" />
        <circle cx={34} cy={40} r={2.5} fill="currentColor" stroke="none" />
        <circle cx={63} cy={47} r={2.5} fill="currentColor" stroke="none" />
        <circle cx={61} cy={57} r={2.5} fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

export function ProfilingCriminologyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none" {...props}>
      <g stroke="currentColor" strokeWidth={2.1} strokeLinecap="round">
        <path d="M48 14c-17 0-30 13-30 30 0 10 4 17 4 27M48 23c-12 0-21 9-21 21 0 12 5 20 4 32M48 32c-7 0-12 5-12 12 0 15 8 22 5 36M48 14c17 0 30 13 30 30 0 10-4 17-4 27M48 23c12 0 21 9 21 21 0 12-5 20-4 32M48 32c7 0 12 5 12 12 0 15-8 22-5 36" />
        <path d="M48 40c-3 0-5 2-5 5 0 15 6 20 5 35M53 80c-1-14 4-21 4-35 0-5-4-9-9-9" />
        <circle cx={48} cy={45} r={3.2} fill="currentColor" stroke="none" />
        <path d="M12 48h10M74 48h10M48 8v9M48 79v9" />
      </g>
    </svg>
  );
}

export function VictimologyTraumaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none" {...props}>
      <g stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M34 20c-12 1-21 12-21 25 0 9 4 16 11 20v12h20V65c6-4 10-11 10-20 0-13-9-24-20-25Z" />
        <path d="M62 20c12 1 21 12 21 25 0 9-4 16-11 20v12H52V65c-6-4-10-11-10-20 0-13 9-24 20-25Z" />
        <path d="M35 39c5 0 8 3 8 7s-3 7-8 7M61 39c-5 0-8 3-8 7s3 7 8 7" />
        <path d="M41 31c5-5 9-5 14 0M42 61c4 4 8 4 12 0" />
        <circle cx={48} cy={31} r={2.8} fill="#C39A3B" stroke="none" />
        <circle cx={48} cy={61} r={2.8} fill="#C39A3B" stroke="none" />
      </g>
    </svg>
  );
}

export function ClinicalPsychologyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none" {...props}>
      <g stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M49 14c-18 0-31 13-31 31 0 10 4 18 11 23v14h22V70c16-2 27-13 27-29 0-15-12-27-29-27Z" />
        <path d="M49 26v33M37 31c-7 1-11 6-11 12 0 7 5 12 12 12M61 29c6 2 10 7 10 13 0 7-5 12-13 13M37 39c5 0 8 3 8 8M61 37c-5 0-8 3-8 8M36 55c3 6 7 9 13 9M61 55c-3 6-7 9-12 9" />
        <circle cx={37} cy={39} r={2.7} fill="currentColor" stroke="none" />
        <circle cx={61} cy={37} r={2.7} fill="currentColor" stroke="none" />
        <circle cx={49} cy={64} r={2.7} fill="#C39A3B" stroke="none" />
      </g>
    </svg>
  );
}

export const RESEARCH_AXIS_ICONS: Record<ResearchAxisId, (props: SVGProps<SVGSVGElement>) => React.JSX.Element> = {
  balkans: BalkansSeparatismIcon,
  security: SecurityPsychologyIcon,
  profiling: ProfilingCriminologyIcon,
  victimology: VictimologyTraumaIcon,
  clinical: ClinicalPsychologyIcon,
};
