import "server-only";

/**
 * Heurystyka "czy strona 1 wystarczy" — po rozpoznaniu KAŻDEJ strony sprawdza,
 * czy tekst zawiera typowe sygnały biletu/rezerwacji (data, godzina,
 * przewoźnik, numer rezerwacji, trasa). Jeśli tak, OCR kończy się od razu,
 * bez renderowania/rozpoznawania kolejnych stron — większość biletów i
 * potwierdzeń rezerwacji ma wszystkie istotne dane na pierwszej stronie,
 * a strony 2+ to zwykle regulamin/warunki przewozu, nieprzydatne do
 * klasyfikacji. Celowo ODDZIELNA od assessOcrQuality (index.ts): tamta
 * ocenia jakość KOŃCOWEGO wyniku (czy ufać wynikowi), ta decyduje w trakcie
 * pętli stron, czy w ogóle warto próbować dalej.
 */

const CARRIER_PATTERN =
  /\b(ryanair|wizz\s?air|lot\b|lufthansa|easyjet|klm|air\s?france|british\s?airways|pkp|flixbus|deutsche\s?bahn|sas\b|norwegian|eurowings|swiss|vueling|transavia|finnair)\b/i;

const DATE_PATTERN = /\b\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}\b/;
const ISO_DATE_PATTERN = /\b20\d{2}-\d{2}-\d{2}\b/;
const TIME_PATTERN = /\b\d{1,2}:\d{2}\b/;
const BOOKING_REF_PATTERN = /\b(?:rezerwacj\w*|booking\s?ref\w*|pnr|nr\s?rezerwacji)\b[:\s]*[A-Z0-9]{5,8}\b/i;
const ROUTE_PATTERN =
  /\b[A-ZŁŚŻŹĆŃÓĄĘ][\p{L}]{2,}\s*(?:->|→|-{1,2}>?|do)\s*[A-ZŁŚŻŹĆŃÓĄĘ][\p{L}]{2,}\b/u;

export function hasEnoughSignalToStopEarly(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;

  const hasDate = DATE_PATTERN.test(trimmed) || ISO_DATE_PATTERN.test(trimmed);
  const hasTime = TIME_PATTERN.test(trimmed);
  const hasCarrier = CARRIER_PATTERN.test(trimmed);
  const hasBookingRef = BOOKING_REF_PATTERN.test(trimmed);
  const hasRoute = ROUTE_PATTERN.test(trimmed);

  return hasDate || hasTime || hasCarrier || hasBookingRef || hasRoute;
}
