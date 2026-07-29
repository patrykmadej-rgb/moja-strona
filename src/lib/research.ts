export type ResearchAxisId = "balkans" | "security" | "profiling" | "victimology" | "clinical";

export type Locale = "pl" | "en" | "it";

export type LocalizedResearchAxis = {
  id: ResearchAxisId;
  number: string;
  icon: string;
  title: string;
  shortTitle: string;
  description: string;
  tags: string[];
  questions: string[];
};

export type LocalizedCurrentWorkItem = {
  axis: ResearchAxisId;
  title: string;
  subtitle: string;
  href?: string;
};

export type ResearchAxis = {
  id: ResearchAxisId;
  number: string;
  icon: string;
  titlePl: string;
  titleEn: string;
  titleIt: string;
  shortTitlePl: string;
  shortTitleEn: string;
  shortTitleIt: string;
  descriptionPl: string;
  descriptionEn: string;
  descriptionIt: string;
  tagsPl: string[];
  tagsEn: string[];
  tagsIt: string[];
  questionsPl: string[];
  questionsEn: string[];
  questionsIt: string[];
};

export type CurrentWorkItem = {
  axis: ResearchAxisId;
  titlePl: string;
  titleEn: string;
  titleIt: string;
  subtitlePl: string;
  subtitleEn: string;
  subtitleIt: string;
  /** Link do istniejącej publikacji w src/lib/publications.ts, gdy temat już tam jest pod podobnym tytułem. */
  href?: string;
};

/**
 * Pozycje węzłów na mapie badań (desktop), w procentach kontenera 900×520.
 * Wyprowadzone geometrycznie z viewBox-owych współrzędnych (patrz niżej) tak,
 * żeby żadne dwa węzły (razem z ich dwuliniowymi etykietami, ok. 0.156 szerokości
 * kontenera wysokości każdy) nie nachodziły na siebie — sprawdzone regułą
 * nienachodzenia prostokątów (|dx| ≥ szerokość LUB |dy| ≥ wysokość, z zapasem
 * ~15%). Musi zostać spójne z krzywymi w ResearchMap.tsx
 * (CONNECTIONS/SECONDARY_CONNECTIONS/CONNECTION_DOTS), które są liczone z tych
 * samych współrzędnych viewBox:
 *   balkans: (250,130)  security: (650,130)
 *   profiling: (160,345) clinical: (740,345)
 *   victimology: (450,390)
 */
export const RESEARCH_MAP_NODE_POSITIONS: Record<ResearchAxisId, { x: number; y: number }> = {
  balkans: { x: 27.78, y: 25 },
  security: { x: 72.22, y: 25 },
  profiling: { x: 17.78, y: 66.35 },
  victimology: { x: 50, y: 75 },
  clinical: { x: 82.22, y: 66.35 },
};

export const researchAxes: ResearchAxis[] = [
  {
    id: "balkans",
    number: "01",
    icon: "/research/icons/balkans-separatism.svg",
    titlePl: "Bałkany Zachodnie, mniejszości i separatyzmy",
    // TODO: przetłumaczyć na EN
    titleEn: "Bałkany Zachodnie, mniejszości i separatyzmy",
    // TODO: przetłumaczyć na IT
    titleIt: "Bałkany Zachodnie, mniejszości i separatyzmy",
    shortTitlePl: "Bałkany i separatyzmy",
    // TODO: przetłumaczyć na EN
    shortTitleEn: "Bałkany i separatyzmy",
    // TODO: przetłumaczyć na IT
    shortTitleIt: "Bałkany i separatyzmy",
    descriptionPl:
      "Badania nad mniejszościami, wielokulturowością, tożsamością, tendencjami separatystycznymi oraz ich wpływem na bezpieczeństwo państw i regionów.",
    // TODO: przetłumaczyć na EN
    descriptionEn:
      "Badania nad mniejszościami, wielokulturowością, tożsamością, tendencjami separatystycznymi oraz ich wpływem na bezpieczeństwo państw i regionów.",
    // TODO: przetłumaczyć na IT
    descriptionIt:
      "Badania nad mniejszościami, wielokulturowością, tożsamością, tendencjami separatystycznymi oraz ich wpływem na bezpieczeństwo państw i regionów.",
    tagsPl: ["Bałkany Zachodnie", "mniejszości", "wielokulturowość", "separatyzmy", "bezpieczeństwo"],
    // TODO: przetłumaczyć na EN
    tagsEn: ["Bałkany Zachodnie", "mniejszości", "wielokulturowość", "separatyzmy", "bezpieczeństwo"],
    // TODO: przetłumaczyć na IT
    tagsIt: ["Bałkany Zachodnie", "mniejszości", "wielokulturowość", "separatyzmy", "bezpieczeństwo"],
    questionsPl: [
      "Jak separatyzmy wpływają na zdolność instytucjonalną i bezpieczeństwo państw?",
      "Kiedy konflikt tożsamościowy prowadzi do dezintegracji instytucjonalnej?",
      "Jaką rolę pełnią aktorzy religijni, polityczni i zewnętrzni?",
    ],
    // TODO: przetłumaczyć na EN
    questionsEn: [
      "Jak separatyzmy wpływają na zdolność instytucjonalną i bezpieczeństwo państw?",
      "Kiedy konflikt tożsamościowy prowadzi do dezintegracji instytucjonalnej?",
      "Jaką rolę pełnią aktorzy religijni, polityczni i zewnętrzni?",
    ],
    // TODO: przetłumaczyć na IT
    questionsIt: [
      "Jak separatyzmy wpływają na zdolność instytucjonalną i bezpieczeństwo państw?",
      "Kiedy konflikt tożsamościowy prowadzi do dezintegracji instytucjonalnej?",
      "Jaką rolę pełnią aktorzy religijni, polityczni i zewnętrzni?",
    ],
  },
  {
    id: "security",
    number: "02",
    icon: "/research/icons/security-psychology.svg",
    titlePl: "Psychologia bezpieczeństwa i prewencja",
    // TODO: przetłumaczyć na EN
    titleEn: "Psychologia bezpieczeństwa i prewencja",
    // TODO: przetłumaczyć na IT
    titleIt: "Psychologia bezpieczeństwa i prewencja",
    shortTitlePl: "Psychologia bezpieczeństwa",
    // TODO: przetłumaczyć na EN
    shortTitleEn: "Psychologia bezpieczeństwa",
    // TODO: przetłumaczyć na IT
    shortTitleIt: "Psychologia bezpieczeństwa",
    descriptionPl:
      "Wykorzystanie psychologii do identyfikowania zagrożeń, zapobiegania przemocy i wspierania decyzji służących zwiększaniu bezpieczeństwa.",
    // TODO: przetłumaczyć na EN
    descriptionEn:
      "Wykorzystanie psychologii do identyfikowania zagrożeń, zapobiegania przemocy i wspierania decyzji służących zwiększaniu bezpieczeństwa.",
    // TODO: przetłumaczyć na IT
    descriptionIt:
      "Wykorzystanie psychologii do identyfikowania zagrożeń, zapobiegania przemocy i wspierania decyzji służących zwiększaniu bezpieczeństwa.",
    tagsPl: ["ocena zagrożeń", "prewencja", "decyzje państwa", "metody behawioralne", "bezpieczeństwo wewnętrzne"],
    // TODO: przetłumaczyć na EN
    tagsEn: ["ocena zagrożeń", "prewencja", "decyzje państwa", "metody behawioralne", "bezpieczeństwo wewnętrzne"],
    // TODO: przetłumaczyć na IT
    tagsIt: ["ocena zagrożeń", "prewencja", "decyzje państwa", "metody behawioralne", "bezpieczeństwo wewnętrzne"],
    questionsPl: [
      "Które metody behawioralne rzeczywiście poprawiają ocenę zagrożeń?",
      "Jak ograniczać błędy decyzyjne i pozorną pewność ekspertów?",
      "Jak projektować działania zwiększające bezpieczeństwo bez stygmatyzacji?",
    ],
    // TODO: przetłumaczyć na EN
    questionsEn: [
      "Które metody behawioralne rzeczywiście poprawiają ocenę zagrożeń?",
      "Jak ograniczać błędy decyzyjne i pozorną pewność ekspertów?",
      "Jak projektować działania zwiększające bezpieczeństwo bez stygmatyzacji?",
    ],
    // TODO: przetłumaczyć na IT
    questionsIt: [
      "Które metody behawioralne rzeczywiście poprawiają ocenę zagrożeń?",
      "Jak ograniczać błędy decyzyjne i pozorną pewność ekspertów?",
      "Jak projektować działania zwiększające bezpieczeństwo bez stygmatyzacji?",
    ],
  },
  {
    id: "profiling",
    number: "03",
    icon: "/research/icons/profiling-criminology.svg",
    titlePl: "Profilowanie kryminalne i psychologia sprawcy",
    // TODO: przetłumaczyć na EN
    titleEn: "Profilowanie kryminalne i psychologia sprawcy",
    // TODO: przetłumaczyć na IT
    titleIt: "Profilowanie kryminalne i psychologia sprawcy",
    shortTitlePl: "Profilowanie i kryminologia",
    // TODO: przetłumaczyć na EN
    shortTitleEn: "Profilowanie i kryminologia",
    // TODO: przetłumaczyć na IT
    shortTitleIt: "Profilowanie i kryminologia",
    descriptionPl:
      "Krytyczna ocena profilowania, diagnostyki sądowej oraz wykorzystania temperamentu, osobowości i psychopatologii w analizie zachowań przestępczych.",
    // TODO: przetłumaczyć na EN
    descriptionEn:
      "Krytyczna ocena profilowania, diagnostyki sądowej oraz wykorzystania temperamentu, osobowości i psychopatologii w analizie zachowań przestępczych.",
    // TODO: przetłumaczyć na IT
    descriptionIt:
      "Krytyczna ocena profilowania, diagnostyki sądowej oraz wykorzystania temperamentu, osobowości i psychopatologii w analizie zachowań przestępczych.",
    tagsPl: ["profilowanie", "temperament", "osobowość", "psychopatologia", "walidacja"],
    // TODO: przetłumaczyć na EN
    tagsEn: ["profilowanie", "temperament", "osobowość", "psychopatologia", "walidacja"],
    // TODO: przetłumaczyć na IT
    tagsIt: ["profilowanie", "temperament", "osobowość", "psychopatologia", "walidacja"],
    questionsPl: [
      "Które elementy profilowania mają potwierdzoną wartość empiryczną?",
      "Jak przejść od eksperckiej narracji do ustrukturyzowanego wspomagania decyzji?",
      "Jak integrować FCZ-KT, NEO PI-R i MMPI bez nadinterpretacji?",
    ],
    // TODO: przetłumaczyć na EN
    questionsEn: [
      "Które elementy profilowania mają potwierdzoną wartość empiryczną?",
      "Jak przejść od eksperckiej narracji do ustrukturyzowanego wspomagania decyzji?",
      "Jak integrować FCZ-KT, NEO PI-R i MMPI bez nadinterpretacji?",
    ],
    // TODO: przetłumaczyć na IT
    questionsIt: [
      "Które elementy profilowania mają potwierdzoną wartość empiryczną?",
      "Jak przejść od eksperckiej narracji do ustrukturyzowanego wspomagania decyzji?",
      "Jak integrować FCZ-KT, NEO PI-R i MMPI bez nadinterpretacji?",
    ],
  },
  {
    id: "victimology",
    number: "04",
    icon: "/research/icons/victimology-trauma.svg",
    titlePl: "Wiktymologia, trauma i proces zdrowienia",
    // TODO: przetłumaczyć na EN
    titleEn: "Wiktymologia, trauma i proces zdrowienia",
    // TODO: przetłumaczyć na IT
    titleIt: "Wiktymologia, trauma i proces zdrowienia",
    shortTitlePl: "Wiktymologia, trauma i zdrowienie",
    // TODO: przetłumaczyć na EN
    shortTitleEn: "Wiktymologia, trauma i zdrowienie",
    // TODO: przetłumaczyć na IT
    shortTitleIt: "Wiktymologia, trauma i zdrowienie",
    descriptionPl:
      "Klasyfikacja ofiar, mechanizmy wiktymizacji, trauma oraz czynniki wspierające odbudowę sprawczości, dobrostanu i poczucia bezpieczeństwa.",
    // TODO: przetłumaczyć na EN
    descriptionEn:
      "Klasyfikacja ofiar, mechanizmy wiktymizacji, trauma oraz czynniki wspierające odbudowę sprawczości, dobrostanu i poczucia bezpieczeństwa.",
    // TODO: przetłumaczyć na IT
    descriptionIt:
      "Klasyfikacja ofiar, mechanizmy wiktymizacji, trauma oraz czynniki wspierające odbudowę sprawczości, dobrostanu i poczucia bezpieczeństwa.",
    tagsPl: ["klasyfikacja ofiar", "trauma", "przemoc domowa", "wiktymizacja seksualna", "zdrowienie"],
    // TODO: przetłumaczyć na EN
    tagsEn: ["klasyfikacja ofiar", "trauma", "przemoc domowa", "wiktymizacja seksualna", "zdrowienie"],
    // TODO: przetłumaczyć na IT
    tagsIt: ["klasyfikacja ofiar", "trauma", "przemoc domowa", "wiktymizacja seksualna", "zdrowienie"],
    questionsPl: [
      "Jak rozróżniać ofiarę docelową, faktyczną, dodatkową i symboliczną?",
      "Które cechy zwiększają ekspozycję na wybór przez sprawcę, nie będąc przyczyną przemocy?",
      "Jak wspierać odzyskiwanie szczęścia i sprawczości po przemocy seksualnej?",
    ],
    // TODO: przetłumaczyć na EN
    questionsEn: [
      "Jak rozróżniać ofiarę docelową, faktyczną, dodatkową i symboliczną?",
      "Które cechy zwiększają ekspozycję na wybór przez sprawcę, nie będąc przyczyną przemocy?",
      "Jak wspierać odzyskiwanie szczęścia i sprawczości po przemocy seksualnej?",
    ],
    // TODO: przetłumaczyć na IT
    questionsIt: [
      "Jak rozróżniać ofiarę docelową, faktyczną, dodatkową i symboliczną?",
      "Które cechy zwiększają ekspozycję na wybór przez sprawcę, nie będąc przyczyną przemocy?",
      "Jak wspierać odzyskiwanie szczęścia i sprawczości po przemocy seksualnej?",
    ],
  },
  {
    id: "clinical",
    number: "05",
    icon: "/research/icons/clinical-psychology.svg",
    titlePl: "Psychologia kliniczna i neuroróżnorodność",
    // TODO: przetłumaczyć na EN
    titleEn: "Psychologia kliniczna i neuroróżnorodność",
    // TODO: przetłumaczyć na IT
    titleIt: "Psychologia kliniczna i neuroróżnorodność",
    shortTitlePl: "Psychologia kliniczna",
    // TODO: przetłumaczyć na EN
    shortTitleEn: "Psychologia kliniczna",
    // TODO: przetłumaczyć na IT
    shortTitleIt: "Psychologia kliniczna",
    descriptionPl:
      "Badania nad ograniczeniami diagnostyki, depresją atypową, ADHD, zaburzeniami lękowymi oraz relacją między psychopatologią, sprawstwem i wiktymizacją.",
    // TODO: przetłumaczyć na EN
    descriptionEn:
      "Badania nad ograniczeniami diagnostyki, depresją atypową, ADHD, zaburzeniami lękowymi oraz relacją między psychopatologią, sprawstwem i wiktymizacją.",
    // TODO: przetłumaczyć na IT
    descriptionIt:
      "Badania nad ograniczeniami diagnostyki, depresją atypową, ADHD, zaburzeniami lękowymi oraz relacją między psychopatologią, sprawstwem i wiktymizacją.",
    tagsPl: ["depresja atypowa", "ADHD", "zaburzenia lękowe", "diagnostyka", "farmakoterapia"],
    // TODO: przetłumaczyć na EN
    tagsEn: ["depresja atypowa", "ADHD", "zaburzenia lękowe", "diagnostyka", "farmakoterapia"],
    // TODO: przetłumaczyć na IT
    tagsIt: ["depresja atypowa", "ADHD", "zaburzenia lękowe", "diagnostyka", "farmakoterapia"],
    questionsPl: [
      "Gdzie algorytmy diagnostyczne upraszczają złożony obraz kliniczny?",
      "Jak odróżniać objawy depresji atypowej, ADHD i współchorobowości?",
      "Jak oceniać jakość dowodów łączących zaburzenia psychiczne z przemocą?",
    ],
    // TODO: przetłumaczyć na EN
    questionsEn: [
      "Gdzie algorytmy diagnostyczne upraszczają złożony obraz kliniczny?",
      "Jak odróżniać objawy depresji atypowej, ADHD i współchorobowości?",
      "Jak oceniać jakość dowodów łączących zaburzenia psychiczne z przemocą?",
    ],
    // TODO: przetłumaczyć na IT
    questionsIt: [
      "Gdzie algorytmy diagnostyczne upraszczają złożony obraz kliniczny?",
      "Jak odróżniać objawy depresji atypowej, ADHD i współchorobowości?",
      "Jak oceniać jakość dowodów łączących zaburzenia psychiczne z przemocą?",
    ],
  },
];

export function getResearchAxisById(id: string): ResearchAxis | undefined {
  return researchAxes.find((a) => a.id === id);
}

/**
 * Tematy aktualnie w opracowaniu (nie są jeszcze gotowymi publikacjami).
 * Bez pola `href`, chyba że pokrywają się tytułem z istniejącą pozycją w src/lib/publications.ts.
 */
export const currentWork: CurrentWorkItem[] = [
  {
    axis: "profiling",
    titlePl: "Zaburzenia psychiczne jako predyktory przemocy",
    // TODO: przetłumaczyć na EN
    titleEn: "Zaburzenia psychiczne jako predyktory przemocy",
    // TODO: przetłumaczyć na IT
    titleIt: "Zaburzenia psychiczne jako predyktory przemocy",
    subtitlePl: "Porównanie zaburzeń lękowych, depresyjnych, psychotycznych i zaburzeń osobowości",
    // TODO: przetłumaczyć na EN
    subtitleEn: "Porównanie zaburzeń lękowych, depresyjnych, psychotycznych i zaburzeń osobowości",
    // TODO: przetłumaczyć na IT
    subtitleIt: "Porównanie zaburzeń lękowych, depresyjnych, psychotycznych i zaburzeń osobowości",
  },
  {
    axis: "profiling",
    titlePl: "Profilowanie kryminalne między ekspercką narracją a walidowanym wspomaganiem decyzji",
    // TODO: przetłumaczyć na EN
    titleEn: "Profilowanie kryminalne między ekspercką narracją a walidowanym wspomaganiem decyzji",
    // TODO: przetłumaczyć na IT
    titleIt: "Profilowanie kryminalne między ekspercką narracją a walidowanym wspomaganiem decyzji",
    subtitlePl: "Ustrukturyzowana krytyczna synteza dowodów",
    // TODO: przetłumaczyć na EN
    subtitleEn: "Ustrukturyzowana krytyczna synteza dowodów",
    // TODO: przetłumaczyć na IT
    subtitleIt: "Ustrukturyzowana krytyczna synteza dowodów",
  },
  {
    axis: "balkans",
    titlePl: "Belgijski taniec z porcelaną",
    // TODO: przetłumaczyć na EN
    titleEn: "Belgijski taniec z porcelaną",
    // TODO: przetłumaczyć na IT
    titleIt: "Belgijski taniec z porcelaną",
    subtitlePl: "Aktorzy, interesy i koszty tendencji separatystycznych w państwie federalnym",
    // TODO: przetłumaczyć na EN
    subtitleEn: "Aktorzy, interesy i koszty tendencji separatystycznych w państwie federalnym",
    // TODO: przetłumaczyć na IT
    subtitleIt: "Aktorzy, interesy i koszty tendencji separatystycznych w państwie federalnym",
  },
  {
    axis: "balkans",
    titlePl: "Między sprawstwem, instrumentalizacją a mediacją",
    // TODO: przetłumaczyć na EN
    titleEn: "Między sprawstwem, instrumentalizacją a mediacją",
    // TODO: przetłumaczyć na IT
    titleIt: "Między sprawstwem, instrumentalizacją a mediacją",
    subtitlePl: "Kościół katolicki wobec konfliktów separatystycznych w Europie",
    // TODO: przetłumaczyć na EN
    subtitleEn: "Kościół katolicki wobec konfliktów separatystycznych w Europie",
    // TODO: przetłumaczyć na IT
    subtitleIt: "Kościół katolicki wobec konfliktów separatystycznych w Europie",
  },
  {
    axis: "clinical",
    titlePl: "Atypowa depresja jako przykład ograniczeń współczesnych algorytmów diagnostycznych",
    // TODO: przetłumaczyć na EN
    titleEn: "Atypowa depresja jako przykład ograniczeń współczesnych algorytmów diagnostycznych",
    // TODO: przetłumaczyć na IT
    titleIt: "Atypowa depresja jako przykład ograniczeń współczesnych algorytmów diagnostycznych",
    subtitlePl: "Krytyczny przegląd integracyjny diagnostyki i farmakoterapii",
    // TODO: przetłumaczyć na EN
    subtitleEn: "Krytyczny przegląd integracyjny diagnostyki i farmakoterapii",
    // TODO: przetłumaczyć na IT
    subtitleIt: "Krytyczny przegląd integracyjny diagnostyki i farmakoterapii",
  },
  {
    axis: "security",
    titlePl: "Psychologia w identyfikowaniu i ograniczaniu zagrożeń dla bezpieczeństwa wewnętrznego",
    // TODO: przetłumaczyć na EN
    titleEn: "Psychologia w identyfikowaniu i ograniczaniu zagrożeń dla bezpieczeństwa wewnętrznego",
    // TODO: przetłumaczyć na IT
    titleIt: "Psychologia w identyfikowaniu i ograniczaniu zagrożeń dla bezpieczeństwa wewnętrznego",
    subtitlePl: "Ocena użyteczności metod behawioralnych w procesach decyzyjnych państwa",
    // TODO: przetłumaczyć na EN
    subtitleEn: "Ocena użyteczności metod behawioralnych w procesach decyzyjnych państwa",
    // TODO: przetłumaczyć na IT
    subtitleIt: "Ocena użyteczności metod behawioralnych w procesach decyzyjnych państwa",
  },
  {
    axis: "victimology",
    titlePl: "Zaburzenia lękowe a ryzyko wiktymizacji seksualnej",
    // TODO: przetłumaczyć na EN
    titleEn: "Zaburzenia lękowe a ryzyko wiktymizacji seksualnej",
    // TODO: przetłumaczyć na IT
    titleIt: "Zaburzenia lękowe a ryzyko wiktymizacji seksualnej",
    subtitlePl: "Krytyczny przegląd jakości i kierunku zależności empirycznych",
    // TODO: przetłumaczyć na EN
    subtitleEn: "Krytyczny przegląd jakości i kierunku zależności empirycznych",
    // TODO: przetłumaczyć na IT
    subtitleIt: "Krytyczny przegląd jakości i kierunku zależności empirycznych",
  },
  {
    axis: "victimology",
    titlePl: "Cechy temperamentu i osobowości osób doświadczających przemocy domowej",
    // TODO: przetłumaczyć na EN
    titleEn: "Cechy temperamentu i osobowości osób doświadczających przemocy domowej",
    // TODO: przetłumaczyć na IT
    titleIt: "Cechy temperamentu i osobowości osób doświadczających przemocy domowej",
    subtitlePl: "Przegląd dowodów w świetle RTT i modelu Wielkiej Piątki",
    // TODO: przetłumaczyć na EN
    subtitleEn: "Przegląd dowodów w świetle RTT i modelu Wielkiej Piątki",
    // TODO: przetłumaczyć na IT
    subtitleIt: "Przegląd dowodów w świetle RTT i modelu Wielkiej Piątki",
  },
  {
    axis: "profiling",
    titlePl: "Trójwymiarowa matryca diagnostyczna w profilowaniu przestępców seksualnych",
    // TODO: przetłumaczyć na EN
    titleEn: "Trójwymiarowa matryca diagnostyczna w profilowaniu przestępców seksualnych",
    // TODO: przetłumaczyć na IT
    titleIt: "Trójwymiarowa matryca diagnostyczna w profilowaniu przestępców seksualnych",
    subtitlePl: "Integracja modeli FCZ-KT, NEO PI-R oraz MMPI",
    // TODO: przetłumaczyć na EN
    subtitleEn: "Integracja modeli FCZ-KT, NEO PI-R oraz MMPI",
    // TODO: przetłumaczyć na IT
    subtitleIt: "Integracja modeli FCZ-KT, NEO PI-R oraz MMPI",
  },
  {
    axis: "clinical",
    titlePl: "Cyberprzestępczość a schizoidalne zaburzenie osobowości",
    // TODO: przetłumaczyć na EN
    titleEn: "Cyberprzestępczość a schizoidalne zaburzenie osobowości",
    // TODO: przetłumaczyć na IT
    titleIt: "Cyberprzestępczość a schizoidalne zaburzenie osobowości",
    subtitlePl: "Analiza luki między profilem sprawcy a dowodami klinicznymi",
    // TODO: przetłumaczyć na EN
    subtitleEn: "Analiza luki między profilem sprawcy a dowodami klinicznymi",
    // TODO: przetłumaczyć na IT
    subtitleIt: "Analiza luki między profilem sprawcy a dowodami klinicznymi",
  },
];

function pick<T>(locale: string, pl: T, en: T, it: T): T {
  if (locale === "en") return en;
  if (locale === "it") return it;
  return pl;
}

export function localizeAxis(axis: ResearchAxis, locale: string): LocalizedResearchAxis {
  return {
    id: axis.id,
    number: axis.number,
    icon: axis.icon,
    title: pick(locale, axis.titlePl, axis.titleEn, axis.titleIt),
    shortTitle: pick(locale, axis.shortTitlePl, axis.shortTitleEn, axis.shortTitleIt),
    description: pick(locale, axis.descriptionPl, axis.descriptionEn, axis.descriptionIt),
    tags: pick(locale, axis.tagsPl, axis.tagsEn, axis.tagsIt),
    questions: pick(locale, axis.questionsPl, axis.questionsEn, axis.questionsIt),
  };
}

export function localizeCurrentWorkItem(item: CurrentWorkItem, locale: string): LocalizedCurrentWorkItem {
  return {
    axis: item.axis,
    title: pick(locale, item.titlePl, item.titleEn, item.titleIt),
    subtitle: pick(locale, item.subtitlePl, item.subtitleEn, item.subtitleIt),
    href: item.href,
  };
}
