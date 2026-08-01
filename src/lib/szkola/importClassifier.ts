import { IMPORT_DETECTED_TYPES, type ImportDetectedType } from "@/lib/szkola/types";

/**
 * Klasyfikacja regułowa (słowa kluczowe + waga), BEZ AI — patrz uzasadnienie
 * w src/lib/szkola/importExtraction.ts i w podsumowaniu ETAPU 5. Projekt nie
 * ma bezpiecznej, już skonfigurowanej integracji AI do analizy prywatnych
 * dokumentów (klucz OPENAI_API_KEY służy wyłącznie narzędziu /ania do
 * generowania grafik — inny cel, inny zakres zgody). Wspomaganie AI może być
 * dodane w przyszłości jako jawnie włączana, opcjonalna konfiguracja.
 */

export type ClassificationSignal = { text: string; weight: number };

const KEYWORD_WEIGHTS: Record<ImportDetectedType, ClassificationSignal[]> = {
  flight: [
    { text: "boarding pass", weight: 3 },
    { text: "bilet lotniczy", weight: 3 },
    { text: "e-ticket", weight: 2 },
    { text: "numer lotu", weight: 3 },
    { text: "flight number", weight: 3 },
    { text: "odprawa online", weight: 2 },
    { text: "lotnisko", weight: 1 },
    { text: "airport", weight: 1 },
    { text: "airline", weight: 2 },
    { text: "linie lotnicze", weight: 2 },
    { text: "pll lot", weight: 3 },
    { text: "ryanair", weight: 3 },
    { text: "wizz air", weight: 3 },
    { text: "lufthansa", weight: 3 },
    { text: "klm", weight: 2 },
    { text: "check-in online", weight: 1 },
  ],
  train: [
    { text: "bilet kolejowy", weight: 3 },
    { text: "pkp intercity", weight: 3 },
    { text: "koleje", weight: 2 },
    { text: "train ticket", weight: 3 },
    { text: "intercity", weight: 2 },
    { text: "pendolino", weight: 3 },
    { text: "numer pociągu", weight: 2 },
    { text: "peron", weight: 1 },
    { text: "stacja odjazdu", weight: 2 },
  ],
  bus: [
    { text: "bilet autobusowy", weight: 3 },
    { text: "flixbus", weight: 3 },
    { text: "polskibus", weight: 3 },
    { text: "bus ticket", weight: 2 },
    { text: "przystanek", weight: 1 },
  ],
  hotel: [
    { text: "potwierdzenie rezerwacji", weight: 2 },
    { text: "booking.com", weight: 3 },
    { text: "confirmation number", weight: 2 },
    { text: "check-in", weight: 1 },
    { text: "check-out", weight: 1 },
    { text: "nocleg", weight: 2 },
    { text: "hotel", weight: 1 },
    { text: "rezerwacja pokoju", weight: 3 },
    { text: "airbnb", weight: 3 },
    { text: "śniadanie w cenie", weight: 1 },
    { text: "polityka anulowania", weight: 1 },
  ],
  school_payment: [
    { text: "opłata za zjazd", weight: 3 },
    { text: "płatność za szkołę", weight: 3 },
    { text: "rata szkolenia", weight: 3 },
    { text: "czesne", weight: 2 },
    { text: "opłata szkoleniowa", weight: 3 },
    { text: "potwierdzenie płatności", weight: 1 },
  ],
  invoice: [
    { text: "faktura vat", weight: 3 },
    { text: "faktura nr", weight: 2 },
    { text: "invoice", weight: 2 },
    { text: "nabywca", weight: 2 },
    { text: "sprzedawca", weight: 1 },
    { text: "nip:", weight: 1 },
  ],
  receipt: [
    { text: "paragon fiskalny", weight: 3 },
    { text: "paragon nr", weight: 2 },
    { text: "receipt", weight: 2 },
  ],
  school_information: [
    { text: "zjazd", weight: 1 },
    { text: "plan zajęć", weight: 2 },
    { text: "harmonogram zjazdu", weight: 3 },
    { text: "informacja organizacyjna", weight: 3 },
    { text: "szkoła psychoterapii", weight: 2 },
    { text: "grupa szkoleniowa", weight: 2 },
    { text: "prowadzący", weight: 1 },
  ],
  schedule: [
    { text: "harmonogram", weight: 2 },
    { text: "plan dnia", weight: 2 },
    { text: "rozkład zajęć", weight: 2 },
  ],
  certificate: [
    { text: "zaświadczenie", weight: 3 },
    { text: "certyfikat", weight: 3 },
    { text: "certificate", weight: 2 },
    { text: "ukończenia szkolenia", weight: 3 },
  ],
  other: [],
};

export const LOW_CONFIDENCE_THRESHOLD = 0.35;

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export type ClassificationResult = {
  detectedType: ImportDetectedType;
  confidence: number;
  matchedKeywords: string[];
};

/**
 * Klasyfikuje na podstawie treści, tematu, nazwy nadawcy i pliku — nigdy
 * wyłącznie na podstawie nazwy pliku (sekcja 7 specyfikacji). Zwraca zawsze
 * jakiś typ (najlepiej dopasowany, domyślnie "other"), ale caller powinien
 * traktować niską pewność jako sygnał do "Wymaga sprawdzenia" i nie tworzyć
 * automatycznie żadnego rekordu docelowego.
 */
export function classifyImportContent(input: {
  text: string;
  subject?: string | null;
  filename?: string | null;
  senderName?: string | null;
}): ClassificationResult {
  const haystack = normalize(
    [input.text, input.subject, input.filename, input.senderName].filter(Boolean).join(" \n "),
  );

  let bestType: ImportDetectedType = "other";
  let bestScore = 0;
  let bestMatches: string[] = [];
  let bestTypeMax = 1;

  for (const type of IMPORT_DETECTED_TYPES) {
    if (type === "other") continue;
    const signals = KEYWORD_WEIGHTS[type];
    let score = 0;
    const matches: string[] = [];
    for (const signal of signals) {
      if (haystack.includes(normalize(signal.text))) {
        score += signal.weight;
        matches.push(signal.text);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
      bestMatches = matches;
      bestTypeMax = signals.reduce((sum, s) => sum + s.weight, 0);
    }
  }

  // Pewność = znaleziony wynik względem sensownego "dobrego dopasowania" (~40%
  // maksymalnej możliwej wagi TEGO KONKRETNEGO (zwycięskiego) typu) — nie
  // względem sumy wag wszystkich typów naraz (to zaniżałoby pewność dla
  // typów o krótszej liście słów kluczowych niż najdłuższa w całym słowniku).
  const goodMatchScore = bestTypeMax * 0.4;
  const confidence = bestScore === 0 ? 0 : Math.min(bestScore / Math.max(goodMatchScore, 1), 1);

  if (confidence < LOW_CONFIDENCE_THRESHOLD) {
    return { detectedType: bestScore === 0 ? "other" : bestType, confidence, matchedKeywords: bestMatches };
  }

  return { detectedType: bestType, confidence, matchedKeywords: bestMatches };
}

export function isLowConfidence(confidence: number): boolean {
  return confidence < LOW_CONFIDENCE_THRESHOLD;
}
