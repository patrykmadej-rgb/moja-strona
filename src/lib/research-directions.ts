export type ResearchDirectionId = "separatism" | "profiling" | "threats" | "prevention";

export type ResearchDirectionMeta = {
  id: ResearchDirectionId;
  number: string;
  /** Kandydujące tagi (dokładne stringi z src/lib/publications.ts) do dopasowania
   * przez getAllTags/tagToSlug w page.tsx. Pierwszy pasujący generuje realny link
   * /tagi/[tag]; brak dopasowania = element wizualny bez routingu (patrz page.tsx). */
  candidateTags: string[];
};

/** Stabilna, typowana tablica czterech kierunków badawczych — treść (tytuły,
 * opisy) pochodzi z tłumaczeń ResearchPage.directions.{id} w page.tsx, tu tylko
 * identyfikatory strukturalne współdzielone przez heksagony i sieć neuronalną. */
export const researchDirections: ResearchDirectionMeta[] = [
  { id: "separatism", number: "01", candidateTags: ["Separatyzm", "separatyzm"] },
  { id: "profiling", number: "02", candidateTags: ["Profilowanie kryminalne", "profilowanie"] },
  { id: "threats", number: "03", candidateTags: ["Psychologia zagrożeń", "zagrożenia"] },
  { id: "prevention", number: "04", candidateTags: ["Prewencja", "psychologia prewencji"] },
];
