export type Publication = {
  slug: string;
  title: string;
  venue: string;
  year: number;
  type: string;
  abstractPl: string;
  abstractEn?: string;
  abstractIt?: string;
  /** Język, w jakim napisany jest tytuł/treść publikacji — domyślnie "pl", gdy pole nie jest ustawione. */
  titleLang?: "pl" | "en";
  tags: string[];
  href?: string;
  pdfUrl?: string;
  externalLinks?: { label: string; href: string }[];
  coverImage?: string;
  coverImageThumb?: string;
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
    abstractEn:
      "This article analyses the impact of separatism on the security of states and regions, focusing on examples from Asia. Its starting point is the tension between a state's drive to preserve territorial integrity and the need to protect the identity, rights and security of separatist communities. Drawing on the conflicts in Palestine, Nagorno-Karabakh and Cyprus, alongside other movements present on the Asian continent, the article shows that separatism rarely remains a purely internal matter. It frequently draws in third-party states, reshapes international relations and can destabilise entire regions. At the same time, it cannot be assessed solely as a threat: for some national and ethnic minorities, autonomy or secession represents an attempt to protect their rights, identity and prospects for development. The article therefore argues that the impact of separatism on security depends on the perspective of the parties to the conflict, its underlying conditions and the methods used to pursue political goals.",
    abstractIt:
      "L'articolo analizza l'impatto del separatismo sulla sicurezza degli Stati e delle regioni, concentrandosi su esempi provenienti dall'Asia. Il punto di partenza è la tensione tra l'aspirazione dello Stato a preservare l'integrità territoriale e la necessità di tutelare l'identità, i diritti e la sicurezza delle comunità separatiste. Sulla base dei conflitti in Palestina, nel Nagorno-Karabakh e a Cipro, nonché di altri movimenti presenti nel continente asiatico, l'autore mostra come il separatismo raramente rimanga un problema puramente interno. Esso comporta spesso il coinvolgimento di Stati terzi, modifica le relazioni internazionali e può destabilizzare intere regioni. Allo stesso tempo, non può essere valutato unicamente come una minaccia: per alcune minoranze nazionali ed etniche, l'autonomia o la secessione rappresentano un tentativo di tutelare i propri diritti, la propria identità e le proprie possibilità di sviluppo. L'articolo indica quindi che l'impatto del separatismo sulla sicurezza dipende dalla prospettiva dei partecipanti al conflitto, dalle sue condizioni specifiche e dai metodi utilizzati per il perseguimento degli obiettivi politici.",
    tags: ["Separatyzm", "Bezpieczeństwo międzynarodowe", "Azja", "Konflikty etniczne", "Górski Karabach", "Palestyna", "Cypr"],
    coverImage: "/publications/bezpieczenstwo-separatyzmu-2021.png",
    coverImageThumb: "/publications/bezpieczenstwo-separatyzmu-2021-miniatura.png",
  },
  {
    slug: "separatyzm-cypryjski-2019",
    title: "Separatyzm cypryjski – wielowymiarowość problemu",
    venue: "Współczesny regionalizm Bliskiego i Dalekiego Wschodu",
    year: 2019,
    type: "Rozdział w monografii",
    abstractPl: "",
    tags: ["separatyzm", "Cypr", "regionalizm"],
    coverImage: "/publications/separatyzm-cypryjski-2019.png",
    coverImageThumb: "/publications/separatyzm-cypryjski-2019-miniatura.png",
  },
  {
    slug: "recenzja-grosse-pokryzysowa-europa-2018",
    title: "Recenzja: Tomasz Grzegorz Grosse, Pokryzysowa Europa. Dylematy Unii Europejskiej",
    venue: "Wydawnictwo Adam Marszałek",
    year: 2018,
    type: "Recenzja",
    abstractPl: "",
    tags: ["Unia Europejska", "kryzys", "politologia"],
    coverImage: "/publications/recenzja-grosse-pokryzysowa-europa-2018.png",
    coverImageThumb: "/publications/recenzja-grosse-pokryzysowa-europa-2018-miniatura.png",
  },
  {
    slug: "recenzja-sochacki-bosnia-2016",
    title: "Recenzja: Szymon Sochacki, Bośnia i Hercegovina 1995–2012. Studium politologiczne",
    venue: "Wydawnictwo Adam Marszałek",
    year: 2016,
    type: "Recenzja",
    abstractPl: "",
    tags: ["Bośnia", "Bałkany", "politologia"],
    coverImage: "/publications/recenzja-sochacki-bosnia-2016.png",
    coverImageThumb: "/publications/recenzja-sochacki-bosnia-2016-miniatura.png",
  },
  {
    slug: "languages-tool-nationalists-2016",
    title: "Languages – a Tool in the Hands of Nationalists and Globalists. The Current Situation in Europe.",
    venue: "Wydawnictwo Adam Marszałek",
    year: 2016,
    type: "Artykuł naukowy",
    titleLang: "en",
    abstractPl:
      "Artykuł analizuje polityczne znaczenie języka we współczesnej Europie oraz napięcie między tendencjami narodowymi a integracyjną polityką Unii Europejskiej. Na przykładzie wymogów językowych stosowanych w procedurach uzyskiwania obywatelstwa pokazuję, że język może pełnić funkcję narzędzia integracji społecznej, ale również bariery ograniczającej dostęp do pełni praw obywatelskich. Drugim obszarem analizy jest wielojęzyczność Unii Europejskiej, oparta na zasadzie równego traktowania języków urzędowych państw członkowskich. Artykuł omawia praktyczne konsekwencje tego modelu, w tym problemy wynikające z rozbieżności między poszczególnymi wersjami językowymi prawa unijnego. Zestawienie polityk krajowych z podejściem instytucji europejskich ukazuje język jako istotny element sporów o tożsamość, suwerenność, równość i przyszły kształt integracji europejskiej.",
    abstractEn:
      "The article examines the political significance of language in contemporary Europe and the tension between national tendencies and the integration-oriented policy of the European Union. Using language requirements in citizenship procedures as an example, it demonstrates that language may serve both as an instrument of social integration and as a barrier restricting access to full citizenship rights. The second area of analysis concerns the European Union's multilingualism, founded on the principle of equal treatment of the official languages of its Member States. The article discusses the practical consequences of this model, including problems caused by discrepancies between different language versions of EU law. By comparing national language policies with the approach adopted by European institutions, the article presents language as an important dimension of disputes concerning identity, sovereignty, equality and the future shape of European integration.",
    abstractIt:
      "L'articolo analizza il significato politico della lingua nell'Europa contemporanea e la tensione tra le tendenze nazionali e la politica di integrazione dell'Unione Europea. Attraverso l'esempio dei requisiti linguistici applicati nelle procedure di acquisizione della cittadinanza, l'autore mostra come la lingua possa fungere sia da strumento di integrazione sociale, sia da barriera che limita l'accesso alla piena titolarità dei diritti di cittadinanza. Il secondo ambito di analisi riguarda il multilinguismo dell'Unione Europea, fondato sul principio della parità di trattamento delle lingue ufficiali degli Stati membri. L'articolo discute le conseguenze pratiche di questo modello, compresi i problemi derivanti dalle discrepanze tra le diverse versioni linguistiche del diritto dell'Unione. Il confronto tra le politiche nazionali e l'approccio delle istituzioni europee mostra la lingua come un elemento rilevante nelle dispute su identità, sovranità, uguaglianza e futuro assetto dell'integrazione europea.",
    tags: ["Polityka językowa", "Wielojęzyczność", "Unia Europejska", "Obywatelstwo", "Nacjonalizm", "Globalizacja"],
    externalLinks: [
      { label: "CEJSH", href: "https://cejsh.icm.edu.pl/cejsh/element/bwmeta1.element.ojs-doi-10_15804_rop201606" },
      { label: "CEEOL", href: "https://www.ceeol.com/search/article-detail?id=563178" },
    ],
    pdfUrl: "/publikacje/languages-tool-nationalists-2016.pdf",
    coverImage: "/publications/languages-tool-nationalists-2016.png",
    coverImageThumb: "/publications/languages-tool-nationalists-2016-miniatura.png",
  },
  {
    slug: "recenzja-olszewski-spotkania-2015",
    title: "Recenzja: Edward Olszewski, Bogusław Zieliński (eds.), Spotkania polsko-chorwackie",
    venue: "Wydawnictwo Adam Marszałek",
    year: 2015,
    type: "Recenzja",
    abstractPl:
      "Tekst stanowi recenzję interdyscyplinarnej monografii zbiorowej „Spotkania polsko-chorwackie” pod redakcją Edwarda Olszewskiego i Bogusława Zielińskiego. Publikacja ukazuje relacje między Polską a Chorwacją z perspektywy historycznej, politycznej i kulturowej, zwracając uwagę zarówno na doświadczenia łączące oba państwa, jak i na odmienność ich dróg rozwoju. Istotnym kontekstem rozważań jest integracja Chorwacji z Unią Europejską oraz znaczenie polskich doświadczeń transformacyjnych i europejskich dla stosunków dwustronnych. W recenzji podkreślam szeroki zakres tematyczny książki oraz wartość zestawienia różnych perspektyw badawczych. Monografia zostaje przedstawiona jako użyteczne źródło wiedzy o polsko-chorwackich kontaktach, miejscu Chorwacji w Europie oraz znaczeniu współpracy naukowej i kulturowej dla wzajemnego poznania obu społeczeństw.",
    abstractEn:
      "The text reviews the interdisciplinary edited volume “Spotkania polsko-chorwackie” (“Polish-Croatian Meetings”), edited by Edward Olszewski and Bogusław Zieliński. The book examines relations between Poland and Croatia from historical, political and cultural perspectives, addressing both the experiences shared by the two countries and the differences between their respective paths of development. An important context for the discussion is Croatia's integration into the European Union and the relevance of Poland's transformation and European experience to bilateral relations. The review highlights the publication's broad thematic scope and the value of combining different academic perspectives. The volume is presented as a useful contribution to understanding Polish-Croatian relations, Croatia's place in Europe and the role of academic and cultural cooperation in strengthening mutual knowledge between the two societies.",
    abstractIt:
      "Il testo costituisce la recensione della monografia collettanea interdisciplinare «Spotkania polsko-chorwackie» (Incontri polacco-croati), curata da Edward Olszewski e Bogusław Zieliński. La pubblicazione illustra le relazioni tra Polonia e Croazia da una prospettiva storica, politica e culturale, ponendo l'attenzione sia sulle esperienze che accomunano i due Paesi, sia sulla diversità dei rispettivi percorsi di sviluppo. Un contesto rilevante della trattazione è l'integrazione della Croazia nell'Unione Europea e il significato delle esperienze polacche di trasformazione ed europeizzazione per le relazioni bilaterali. Nella recensione si sottolinea l'ampio respiro tematico del volume e il valore del confronto tra diverse prospettive di ricerca. La monografia viene presentata come una fonte utile di conoscenza sui contatti polacco-croati, sul posto della Croazia in Europa e sul significato della cooperazione scientifica e culturale per la reciproca conoscenza tra le due società.",
    tags: ["Stosunki polsko-chorwackie", "Chorwacja", "Bałkany", "Integracja europejska", "Stosunki międzynarodowe", "Recenzja naukowa"],
    externalLinks: [
      { label: "CEJSH", href: "https://cejsh.icm.edu.pl/cejsh/element/bwmeta1.element.ojs-doi-10_15804_rop201510" },
      { label: "CEEOL", href: "https://www.ceeol.com/search/article-detail?id=525489" },
    ],
    pdfUrl: "/publikacje/recenzja-olszewski-spotkania-2015.pdf",
    coverImage: "/publications/recenzja-olszewski-spotkania-2015.png",
    coverImageThumb: "/publications/recenzja-olszewski-spotkania-2015-miniatura.png",
  },
];

export function getPublicationBySlug(slug: string): Publication | undefined {
  return publications.find((p) => p.slug === slug);
}
