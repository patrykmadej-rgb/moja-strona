export type Publication = {
  slug: string;
  title: string;
  venue: string;
  /** Opcjonalne, gdy status to "w-trakcie" i rok publikacji nie jest jeszcze znany. */
  year?: number;
  type: string;
  abstractPl: string;
  abstractEn?: string;
  abstractIt?: string;
  /** Język, w jakim napisany jest tytuł/treść publikacji — domyślnie "pl", gdy pole nie jest ustawione. */
  titleLang?: "pl" | "en";
  /** Domyślnie "opublikowana", gdy pole nie jest ustawione. */
  status?: "opublikowana" | "w-trakcie";
  expectedPublicationDate?: string;
  coAuthors?: string[];
  tags: string[];
  href?: string;
  pdfUrl?: string;
  externalLinks?: { label: string; href: string }[];
  coverImage?: string;
  coverImageThumb?: string;
};

/** Klucz sortowania malejąco: publikacje "w-trakcie" bez roku traktowane jako najnowsze. */
export function getPublicationSortYear(pub: Publication): number {
  if (pub.year !== undefined) return pub.year;
  return pub.status === "w-trakcie" ? Infinity : -Infinity;
}

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
    externalLinks: [
      { label: "CEEOL", href: "https://www.ceeol.com/search/article-detail?id=772504" },
    ],
    coverImage: "/publications/recenzja-grosse-pokryzysowa-europa-2018.png",
    coverImageThumb: "/publications/recenzja-grosse-pokryzysowa-europa-2018-miniatura.png",
  },
  {
    slug: "recenzja-sochacki-bosnia-2016",
    title: "Recenzja: Szymon Sochacki, Bośnia i Hercegovina 1995–2012. Studium politologiczne",
    venue: "Wydawnictwo Adam Marszałek",
    year: 2016,
    type: "Recenzja",
    abstractPl:
      "W recenzji analizuję książkę Szymona Sochackiego Bośnia i Hercegowina 1995–2012. Studium politologiczne, poświęconą powojennemu systemowi politycznemu tego państwa. Publikacja przedstawia rozpad Jugosławii, porozumienie z Dayton, strukturę administracyjną Bośni i Hercegowiny, działalność partii politycznych, przebieg wyborów oraz kierunki polityki wewnętrznej i zagranicznej. Jej zaletami są logiczna konstrukcja, szeroka baza źródłowa oraz uporządkowane przedstawienie rozwoju instytucjonalnego kraju.\n\nJednocześnie wskazuję na liczne błędy rzeczowe i terminologiczne, niespójny system skrótów, zbyt opisowy charakter analizy prawnej oraz problemy z jakością materiałów graficznych. Szczególnie istotne zastrzeżenia dotyczą sposobu przedstawienia narodów konstytutywnych oraz modelu demokracji konsocjonalnej. Książka dostarcza wartościowych informacji, jednak ze względu na występujące nieścisłości wymaga od czytelnika krytycznego podejścia i znajomości realiów Bałkanów.",
    tags: [
      "Bośnia i Hercegowina",
      "Bałkany Zachodnie",
      "system polityczny",
      "demokracja konsocjonalna",
      "porozumienie z Dayton",
      "recenzja naukowa",
    ],
    externalLinks: [
      {
        label: "ResearchGate",
        href: "https://www.researchgate.net/publication/360673352_Book_review_Szymon_Sochacki_Bosnia_i_Hercegowina_1995_-_2012_Studium_politologiczne_Bosnia_Herzegovina_1995_-_2012_Political_science_study_Wydawnictwo_Adam_Marszalek_Torun_2015_pp_345",
      },
      {
        label: "CEJSH",
        href: "https://cejsh.icm.edu.pl/cejsh/element/bwmeta1.element.ojs-doi-10_15804_rop201614?q=bwmeta1.element.ojs-issn-2082-3959-year-2016-issue-7;13&qt=CHILDREN-STATELESS",
      },
    ],
    pdfUrl:
      "https://cejsh.icm.edu.pl/cejsh/element/bwmeta1.element.ojs-doi-10_15804_rop201614/c/16-3f20d5c0-87ad-487b-bafc-87a8ca9c3753.pdf.pdf",
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
  {
    slug: "osobowosc-zalezna-uwarunkowania-rozwojowe-2027",
    title: "Analiza uwarunkowań rozwojowych minimalizujących ryzyko kształtowania się osobowości zależnej w dzieciństwie i wczesnej adolescencji",
    venue: "Zachowania – Osobowość – Umysł – Emocje. Wybrane zagadnienia socjologii, psychologii i pedagogiki (Center for American & European Studies Publishing Press)",
    type: "Rozdział w monografii",
    status: "w-trakcie",
    expectedPublicationDate: "luty 2027",
    coAuthors: ["Mateusz Jakóbiak"],
    abstractPl:
      "Artykuł analizuje uwarunkowania rozwojowe, które mogą zmniejszać ryzyko utrwalenia zależnego stylu funkcjonowania w dzieciństwie i wczesnej adolescencji. Na podstawie klasycznych teorii psychologicznych oraz wyników badań empirycznych pokazujemy, że osobowość zależna nie rozwija się wskutek jednego doświadczenia ani określonej postawy rodzicielskiej. Jej kształtowanie może być rezultatem wzajemnego oddziaływania temperamentu dziecka, jakości przywiązania, zachowań opiekunów, doświadczeń sprawstwa i późniejszych relacji społecznych. Szczególną uwagę poświęcamy nadopiekuńczości, wyręczaniu, kontroli psychologicznej oraz ograniczaniu prawa dziecka do podejmowania decyzji i popełniania błędów. Wskazujemy trzy szczególnie ważne etapy rozwoju: wczesne dzieciństwo, okres szkolny i wczesną adolescencję. Najważniejszym czynnikiem ochronnym jest bezpieczna relacja, która pozwala dziecku stopniowo rozwijać autonomię, poczucie kompetencji i własną tożsamość bez obawy przed utratą bliskości.",
    abstractEn:
      "Dependent personality disorder is characterized by an excessive need to be cared for, submissiveness, difficulty making decisions and fear of separation. This paper analyses developmental conditions that may reduce the risk of consolidating a dependent pattern of functioning in childhood and early adolescence. It is a problem-oriented narrative review. Classical developmental theories are confronted with prospective research, twin studies, retrospective studies and meta-analyses concerning attachment, overprotection, psychological control and autonomy support. Empirical findings indicate that autonomy restriction, high control, substitution for the child, maltreatment and neglect may contribute to conditions that favour dependency. The evidence does not, however, permit any single parenting practice to be treated as a direct cause of DPD. A transactional model, in which child temperament, caregiver behaviour, attachment quality, agency experiences and later social relationships interact over time, is the most justified.",
    tags: ["Psychologia", "Osobowość zależna", "Psychologia rozwojowa", "Autonomia dziecka", "Teoria przywiązania", "Nadopiekuńczość", "Profilaktyka zaburzeń osobowości"],
    coverImage: "/publications/osobowosc-zalezna-uwarunkowania-rozwojowe-2027.png",
    coverImageThumb: "/publications/osobowosc-zalezna-uwarunkowania-rozwojowe-2027-miniatura.png",
  },
  {
    slug: "demographic-crisis-western-balkans-2026",
    title: "Demographic Crisis and the Institutional Capacity of the Western Balkan States",
    venue: "Reality of Politics. Estimates – Comments – Forecasts (Wydawnictwo Adam Marszałek)",
    type: "Artykuł naukowy",
    titleLang: "en",
    status: "w-trakcie",
    abstractPl:
      "Artykuł analizuje sposób, w jaki Albania, Bośnia i Hercegowina, Kosowo, Czarnogóra, Macedonia Północna oraz Serbia reagują na spadek liczby ludności, starzenie się społeczeństw i emigrację. Na podstawie strategii rządowych, raportów Komisji Europejskiej oraz ocen SIGMA pokazuję, że działania władz koncentrują się przede wszystkim na zwiększaniu dzietności, ograniczaniu wyjazdów, zachęcaniu emigrantów do powrotu i współpracy z diasporą. Znacznie rzadziej obejmują natomiast dostosowanie administracji publicznej, zatrudnienia, finansowania i sieci usług do funkcjonowania z mniejszą i starszą populacją. Powstaje w ten sposób luka adaptacyjna między próbami odwrócenia zmian demograficznych a przygotowaniem państwa na ich trwałe konsekwencje. Analiza wskazuje, że o zdolności instytucjonalnej nie decyduje liczba przyjętych strategii, lecz przejrzystość zatrudnienia, stabilność organizacyjna, podział kompetencji, sposób finansowania oraz rzeczywiste wykorzystanie cyfryzacji.",
    abstractEn:
      "The Western Balkan states have for many years faced population decline, ageing and emigration. The purpose of this article is to determine how the authorities of Albania, Bosnia and Herzegovina, Kosovo, Montenegro, North Macedonia and Serbia respond to these developments and whether the measures they undertake include the adaptation of public administration. The analysis covers demographic and migration strategies, documents concerning the diaspora, the European Commission's 2025 reports and the SIGMA assessment for 2024. Government documents were used to examine political objectives, whereas external reports were used to assess their implementation and the situation of public administration. The analysis indicates that the authorities focus mainly on increasing fertility, limiting emigration, returns and cooperation with the diaspora. They devote considerably less attention to preparing public administration and the network of services for permanent operation with a smaller and older population. This creates a gap between attempts to reverse demographic change and the adaptation of the state to its consequences. The number of adopted strategies does not explain the size of this gap. The distribution of competences, political employment practices, institutional stability and the use of digitalisation are more important.",
    tags: ["Bałkany Zachodnie", "Kryzys demograficzny", "Zdolność instytucjonalna państwa", "Administracja publiczna", "Polityka demograficzna", "Integracja europejska"],
    externalLinks: [
      { label: "CEEOL", href: "https://www.ceeol.com/search/journal-detail?id=1717" },
    ],
    coverImage: "/publications/demographic-crisis-western-balkans-2026.png",
    coverImageThumb: "/publications/demographic-crisis-western-balkans-2026-miniatura.png",
  },
  {
    slug: "recenzja-vidacak-western-balkans-eu-2026",
    title: "Review of the book \"The Western Balkans and the Challenges of EU Accession: The Resilient Transformation\" edited by Igor Vidačak",
    venue: "Reality of Politics. Estimates – Comments – Forecasts (Wydawnictwo Adam Marszałek)",
    type: "Recenzja",
    titleLang: "en",
    status: "w-trakcie",
    abstractPl:
      "Recenzja dotyczy monografii zbiorowej „The Western Balkans and the Challenges of EU Accession: The Resilient Transformation” pod redakcją Igora Vidačaka. Książka analizuje proces integracji Bałkanów Zachodnich z Unią Europejską, obejmując wiarygodność polityki rozszerzenia, reformy administracji publicznej, migrację oraz transformację gospodarczą, cyfrową i energetyczną. W recenzji doceniam aktualność publikacji, szeroki zakres materiału i trafne analizy pozornych reform oraz słabości instytucjonalnych. Wskazuję jednak, że tytułowa koncepcja „odpornej transformacji” nie została zastosowana jako wspólna metoda badawcza. Poszczególne rozdziały odmiennie rozumieją trwałość, głębokość i społeczną dystrybucję reform, przez co książka nie tworzy spójnego modelu analitycznego. Zwracam również uwagę na niewystarczające uwzględnienie kryzysu demograficznego oraz dominację perspektywy instytucji europejskich. Publikacja stanowi wartościowe kompendium problemów akcesyjnych, lecz nie realizuje w pełni swojej głównej obietnicy teoretycznej.",
    tags: ["Bałkany Zachodnie", "Integracja europejska", "Rozszerzenie Unii Europejskiej", "Odporność instytucjonalna", "Reformy demokratyczne", "Recenzja naukowa"],
    externalLinks: [
      { label: "CEEOL", href: "https://www.ceeol.com/search/journal-detail?id=1717" },
    ],
    coverImage: "/publications/recenzja-vidacak-western-balkans-eu-2026.png",
    coverImageThumb: "/publications/recenzja-vidacak-western-balkans-eu-2026-miniatura.png",
  },
  {
    slug: "separatyzm-bez-secesji-rs-bih-2026",
    title:
      "Separatyzm bez secesji. Kwestionowanie kompetencji i ograniczanie funkcjonowania instytucji państwowych Bośni i Hercegowiny przez władze Republiki Serbskiej",
    venue: "Reality of Politics. Estimates – Comments – Forecasts (Wydawnictwo Adam Marszałek)",
    type: "Artykuł naukowy",
    status: "w-trakcie",
    abstractPl:
      "Przedmiotem artykułu jest polityka władz Republiki Serbskiej wobec instytucji Bośni i Hercegowiny od przyjęcia konkluzji Zgromadzenia Narodowego Republiki Serbskiej 10 grudnia 2021 r. do uchylenia sześciu ustaw 18 października 2025 r. Celem badania było ustalenie, czy działania te prowadziły do wytworzenia trwałej zdolności secesyjnej, czy też służyły ograniczaniu wykonywania kompetencji państwowych bez przeprowadzenia secesji. Zastosowano analizę instytucjonalną oraz ustrukturyzowaną analizę dokumentów. Porównano zakres aktów normatywnych, czynności wykonawczych i ich trwałość w odniesieniu do sądownictwa, organów ścigania, administracji wyborczej, obronności i podatków pośrednich. Ustalono, że eskalacja miała charakter selektywny. Najsilniej obejmowała instytucje zdolne do kontroli lub sankcjonowania elit Republiki Serbskiej, podczas gdy współpraca zapewniająca dochody i usługi publiczne była utrzymywana. Różnica między szerokimi deklaracjami a ograniczonym wykonaniem, niewielka skala odejść z instytucji państwowych oraz uchylenie ustaw w październiku 2025 r. wskazują, że analizowana polityka nie tworzyła kompletnej infrastruktury niepodległego państwa. Jej rezultatem było natomiast okresowe osłabienie jurysdykcji, pewności prawa i zdolności koordynacyjnej Bośni i Hercegowiny. Separatyzm bez secesji stanowił zatem sposób prowadzenia konfliktu o zakres i wykonalność kompetencji państwowych, a zarazem instrument ochrony pozycji politycznej władz Republiki Serbskiej.",
    abstractEn:
      "The article examines the policy of the Republika Srpska authorities towards the institutions of Bosnia and Herzegovina from the adoption of the Republika Srpska National Assembly conclusions on 10 December 2021 to the repeal of six laws on 18 October 2025. It asks whether these actions produced a durable capacity for secession or restricted the exercise of state competences without carrying secession through. The study combines institutional analysis with a structured qualitative analysis of documents. Normative scope, executive implementation and durability are compared across the judiciary, law-enforcement agencies, election administration, defence and indirect taxation. The findings show a selective pattern of escalation. Institutions capable of overseeing or sanctioning the Republika Srpska elite were targeted most strongly, while cooperation delivering revenue and public services was largely preserved. The gap between extensive declarations and limited implementation, the small number of departures from state institutions and the repeal of the laws in October 2025 indicate that a comprehensive infrastructure of an independent state was not created. The policy nevertheless temporarily weakened jurisdiction, legal certainty and the coordinating capacity of Bosnia and Herzegovina. Separatism without secession therefore operated as a method of contesting the scope and enforceability of state competences and as an instrument for protecting the political position of the Republika Srpska authorities.",
    tags: [
      "Republika Serbska",
      "Bośnia i Hercegowina",
      "Separatyzm",
      "Secesja",
      "Dezintegracja instytucjonalna",
      "Bałkany Zachodnie",
    ],
    externalLinks: [
      { label: "CEEOL", href: "https://www.ceeol.com/search/journal-detail?id=1717" },
    ],
    coverImage: "/publications/separatyzm-bez-secesji-rs-bih-2026.png",
    coverImageThumb: "/publications/separatyzm-bez-secesji-rs-bih-2026-miniatura.png",
  },
];

export function getPublicationBySlug(slug: string): Publication | undefined {
  return publications.find((p) => p.slug === slug);
}

const POLISH_MONTHS: Record<string, number> = {
  styczen: 1,
  styczeń: 1,
  luty: 2,
  marzec: 3,
  kwiecien: 4,
  kwiecień: 4,
  maj: 5,
  czerwiec: 6,
  lipiec: 7,
  sierpien: 8,
  sierpień: 8,
  wrzesien: 9,
  wrzesień: 9,
  pazdziernik: 10,
  październik: 10,
  listopad: 11,
  grudzien: 12,
  grudzień: 12,
};

/** Wyciąga porównywalną wartość (rok*100+miesiąc) z tekstu typu "luty 2027". Zwraca null, gdy nie da się rozpoznać. */
function parseExpectedPublicationDate(value?: string): number | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  const yearMatch = lower.match(/\d{4}/);
  if (!yearMatch) return null;
  const year = Number(yearMatch[0]);
  const monthWord = lower.match(/[a-ząćęłńóśźż]+/)?.[0];
  const month = (monthWord && POLISH_MONTHS[monthWord]) || 0;
  return year * 100 + month;
}

/**
 * Wybiera 3 publikacje do sekcji "Ostatnie publikacje" na stronie głównej:
 * - dwie najnowsze publikacje opublikowane (lub bez pola status), posortowane malejąco po roku,
 * - na trzecie miejsce: najbardziej aktualna publikacja "w-trakcie" (jeśli taka istnieje),
 *   a w przeciwnym razie trzecia najnowsza publikacja opublikowana.
 */
export function getFeaturedPublications(pubs: Publication[] = publications): Publication[] {
  const isPublished = (p: Publication) => p.status === undefined || p.status === "opublikowana";

  const published = pubs
    .filter(isPublished)
    .sort((a, b) => (b.year ?? -Infinity) - (a.year ?? -Infinity));

  const inProgress = pubs.filter((p) => p.status === "w-trakcie");

  const featured = published.slice(0, 2);

  if (inProgress.length > 0) {
    const [mostCurrent] = [...inProgress].sort((a, b) => {
      const dateA = parseExpectedPublicationDate(a.expectedPublicationDate);
      const dateB = parseExpectedPublicationDate(b.expectedPublicationDate);
      if (dateA !== null && dateB !== null && dateA !== dateB) return dateB - dateA;
      return pubs.indexOf(b) - pubs.indexOf(a);
    });
    featured.push(mostCurrent);
  } else if (published[2]) {
    featured.push(published[2]);
  }

  return featured;
}
