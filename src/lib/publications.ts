export type Publication = {
  slug: string;
  title: string;
  venue: string;
  year: number;
  type: string;
  abstract: string;
  tags: string[];
  href?: string;
  pdfUrl?: string;
  externalLinks?: { label: string; href: string }[];
};

export const publications: Publication[] = [
  {
    slug: "bezpieczenstwo-separatyzmu-2021",
    title: "Bezpieczeństwo separatyzmu – implikacje separatyzmu na bezpieczeństwo w regionie na przykładzie wybranych państw azjatyckich",
    venue: "Bliski Wschód – tożsamość i polityka",
    year: 2021,
    type: "Rozdział w monografii",
    abstract: "",
    tags: ["separatyzm", "bezpieczeństwo", "Azja"],
  },
  {
    slug: "separatyzm-cypryjski-2019",
    title: "Separatyzm cypryjski – wielowymiarowość problemu",
    venue: "Współczesny regionalizm Bliskiego i Dalekiego Wschodu",
    year: 2019,
    type: "Rozdział w monografii",
    abstract: "",
    tags: ["separatyzm", "Cypr", "regionalizm"],
  },
  {
    slug: "recenzja-grosse-pokryzysowa-europa-2018",
    title: "Recenzja: Tomasz Grzegorz Grosse, Pokryzysowa Europa. Dylematy Unii Europejskiej",
    venue: "Wydawnictwo Adam Marszałek",
    year: 2018,
    type: "Recenzja",
    abstract: "",
    tags: ["Unia Europejska", "kryzys", "politologia"],
  },
  {
    slug: "recenzja-sochacki-bosnia-2016",
    title: "Recenzja: Szymon Sochacki, Bośnia i Hercegovina 1995–2012. Studium politologiczne",
    venue: "Wydawnictwo Adam Marszałek",
    year: 2016,
    type: "Recenzja",
    abstract: "",
    tags: ["Bośnia", "Bałkany", "politologia"],
  },
  {
    slug: "languages-tool-nationalists-2016",
    title: "Languages – a Tool in the Hands of Nationalists and Globalists. The Current Situation in Europe.",
    venue: "Wydawnictwo Adam Marszałek",
    year: 2016,
    type: "Artykuł naukowy",
    abstract: "",
    tags: ["język", "nacjonalizm", "globalizacja", "Europa"],
  },
  {
    slug: "recenzja-olszewski-spotkania-2015",
    title: "Recenzja: Edward Olszewski, Bogusław Zieliński (eds.), Spotkania polsko-chorwackie",
    venue: "Wydawnictwo Adam Marszałek",
    year: 2015,
    type: "Recenzja",
    abstract: "",
    tags: ["Chorwacja", "Polska", "relacje kulturowe"],
  },
];

export function getPublicationBySlug(slug: string): Publication | undefined {
  return publications.find((p) => p.slug === slug);
}
