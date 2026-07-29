export type Publication = {
  slug: string;
  title: string;
  venue: string;
  year: number;
  type: string;
  abstractPl: string;
  abstractEn?: string;
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
    abstractPl:
      "Artykuł analizuje wpływ separatyzmu na bezpieczeństwo państw i regionów, koncentrując się na przykładach z Azji. Punktem wyjścia jest napięcie między dążeniem państwa do zachowania integralności terytorialnej a potrzebą ochrony tożsamości, praw i bezpieczeństwa społeczności separatystycznych. Na podstawie konfliktów w Palestynie, Górskim Karabachu i na Cyprze oraz innych ruchów obecnych na kontynencie azjatyckim pokazuję, że separatyzm rzadko pozostaje wyłącznie problemem wewnętrznym. Prowadzi często do zaangażowania państw trzecich, zmienia relacje międzynarodowe i może destabilizować całe regiony. Jednocześnie nie sposób ocenić go wyłącznie jako zagrożenia: dla części mniejszości narodowych i etnicznych autonomia lub secesja stanowią próbę ochrony ich praw, tożsamości i możliwości rozwoju. Artykuł wskazuje zatem, że wpływ separatyzmu na bezpieczeństwo zależy od perspektywy uczestników konfliktu, jego uwarunkowań oraz metod wykorzystywanych do realizacji celów politycznych.",
    tags: ["Separatyzm", "Bezpieczeństwo międzynarodowe", "Azja", "Konflikty etniczne", "Górski Karabach", "Palestyna", "Cypr"],
  },
  {
    slug: "separatyzm-cypryjski-2019",
    title: "Separatyzm cypryjski – wielowymiarowość problemu",
    venue: "Współczesny regionalizm Bliskiego i Dalekiego Wschodu",
    year: 2019,
    type: "Rozdział w monografii",
    abstractPl: "",
    tags: ["separatyzm", "Cypr", "regionalizm"],
  },
  {
    slug: "recenzja-grosse-pokryzysowa-europa-2018",
    title: "Recenzja: Tomasz Grzegorz Grosse, Pokryzysowa Europa. Dylematy Unii Europejskiej",
    venue: "Wydawnictwo Adam Marszałek",
    year: 2018,
    type: "Recenzja",
    abstractPl: "",
    tags: ["Unia Europejska", "kryzys", "politologia"],
  },
  {
    slug: "recenzja-sochacki-bosnia-2016",
    title: "Recenzja: Szymon Sochacki, Bośnia i Hercegovina 1995–2012. Studium politologiczne",
    venue: "Wydawnictwo Adam Marszałek",
    year: 2016,
    type: "Recenzja",
    abstractPl: "",
    tags: ["Bośnia", "Bałkany", "politologia"],
  },
  {
    slug: "languages-tool-nationalists-2016",
    title: "Languages – a Tool in the Hands of Nationalists and Globalists. The Current Situation in Europe.",
    venue: "Wydawnictwo Adam Marszałek",
    year: 2016,
    type: "Artykuł naukowy",
    abstractPl:
      "Artykuł analizuje polityczne znaczenie języka we współczesnej Europie oraz napięcie między tendencjami narodowymi a integracyjną polityką Unii Europejskiej. Na przykładzie wymogów językowych stosowanych w procedurach uzyskiwania obywatelstwa pokazuję, że język może pełnić funkcję narzędzia integracji społecznej, ale również bariery ograniczającej dostęp do pełni praw obywatelskich. Drugim obszarem analizy jest wielojęzyczność Unii Europejskiej, oparta na zasadzie równego traktowania języków urzędowych państw członkowskich. Artykuł omawia praktyczne konsekwencje tego modelu, w tym problemy wynikające z rozbieżności między poszczególnymi wersjami językowymi prawa unijnego. Zestawienie polityk krajowych z podejściem instytucji europejskich ukazuje język jako istotny element sporów o tożsamość, suwerenność, równość i przyszły kształt integracji europejskiej.",
    abstractEn:
      "The article examines the political significance of language in contemporary Europe and the tension between national tendencies and the integration-oriented policy of the European Union. Using language requirements in citizenship procedures as an example, it demonstrates that language may serve both as an instrument of social integration and as a barrier restricting access to full citizenship rights. The second area of analysis concerns the European Union's multilingualism, founded on the principle of equal treatment of the official languages of its Member States. The article discusses the practical consequences of this model, including problems caused by discrepancies between different language versions of EU law. By comparing national language policies with the approach adopted by European institutions, the article presents language as an important dimension of disputes concerning identity, sovereignty, equality and the future shape of European integration.",
    tags: ["Polityka językowa", "Wielojęzyczność", "Unia Europejska", "Obywatelstwo", "Nacjonalizm", "Globalizacja"],
    externalLinks: [
      { label: "CEJSH", href: "https://cejsh.icm.edu.pl/cejsh/element/bwmeta1.element.ojs-doi-10_15804_rop201606" },
      { label: "CEEOL", href: "https://www.ceeol.com/search/article-detail?id=563178" },
    ],
    pdfUrl: "/publikacje/languages-tool-nationalists-2016.pdf",
  },
  {
    slug: "recenzja-olszewski-spotkania-2015",
    title: "Recenzja: Edward Olszewski, Bogusław Zieliński (eds.), Spotkania polsko-chorwackie",
    venue: "Wydawnictwo Adam Marszałek",
    year: 2015,
    type: "Recenzja",
    abstractPl: "",
    tags: ["Chorwacja", "Polska", "relacje kulturowe"],
  },
];

export function getPublicationBySlug(slug: string): Publication | undefined {
  return publications.find((p) => p.slug === slug);
}
