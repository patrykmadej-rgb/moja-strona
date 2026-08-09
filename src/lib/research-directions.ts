import type { LucideIcon } from "lucide-react";
import { GitBranch, Fingerprint, Brain, Shield } from "lucide-react";

export type ResearchDirectionId = "separatism" | "profiling" | "threats" | "prevention";

export type ResearchDirectionMeta = {
  id: ResearchDirectionId;
  number: string;
  /** Ścieżka podstrony kierunku: /badania/[slug]. Jeden, kanoniczny slug
   * niezależny od locale — zgodnie z konwencją /publikacje/[slug] w tym
   * repo (next-intl obsługuje tu wyłącznie prefiks języka, nie tłumaczy
   * samych segmentów ścieżki). */
  slug: string;
  /** Kandydujące tagi (dokładne stringi z src/lib/publications.ts) do dopasowania
   * powiązanych publikacji na podstronie kierunku. Pierwszy pasujący (i wszystkie
   * kolejne) generują realną listę; brak dopasowania = komunikat placeholder. */
  candidateTags: string[];
};

/** Stabilna, typowana tablica czterech kierunków badawczych — treść (tytuły,
 * opisy, wprowadzenia, zakres, pytania) pochodzi z tłumaczeń
 * ResearchPage.directions.{id} / ResearchDirectionPage, tu tylko identyfikatory
 * strukturalne współdzielone przez koła na /badania, sieć neuronalną i
 * podstrony /badania/[slug]. */
export const researchDirections: ResearchDirectionMeta[] = [
  {
    id: "separatism",
    number: "01",
    slug: "separatyzmy-i-bezpieczenstwo",
    candidateTags: ["Separatyzm", "separatyzm"],
  },
  {
    id: "profiling",
    number: "02",
    slug: "profilowanie-kryminalne-i-wiktymologiczne",
    candidateTags: ["Profilowanie kryminalne", "profilowanie"],
  },
  {
    id: "threats",
    number: "03",
    slug: "psychologia-zagrozen",
    candidateTags: ["Psychologia zagrożeń", "zagrożenia"],
  },
  {
    id: "prevention",
    number: "04",
    slug: "psychologia-prewencji",
    candidateTags: ["Prewencja", "psychologia prewencji"],
  },
];

export function getResearchDirectionBySlug(slug: string): ResearchDirectionMeta | undefined {
  return researchDirections.find((d) => d.slug === slug);
}

/** Mapa ikon Lucide per kierunek — współdzielona przez koła na /badania
 * (ResearchDirectionNetwork) i podstrony szczegółowe (/badania/[slug]), żeby
 * nie duplikować przypisania ikon w kilku komponentach. Komponenty Lucide są
 * zwykłymi funkcjami renderującymi SVG (nie używają hooków klienckich), więc
 * bezpiecznie importować tę mapę zarówno w komponentach klienckich, jak i
 * serwerowych. */
export const RESEARCH_DIRECTION_ICONS: Record<ResearchDirectionId, LucideIcon> = {
  separatism: GitBranch,
  profiling: Fingerprint,
  threats: Brain,
  prevention: Shield,
};
