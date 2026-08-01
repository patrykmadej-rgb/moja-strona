import type { Currency, ImportDetectedType, ImportExtractedData } from "@/lib/szkola/types";

/**
 * Wyciąganie pól z tekstu dokumentu — regułowe (regex + słowa kluczowe), bez AI.
 * Celowo NIE zgaduje pól, których nie da się wiarygodnie rozpoznać (sekcja 8
 * specyfikacji) — brakujące dopasowanie zostaje `null`, użytkownik uzupełnia
 * ręcznie w formularzu przed zatwierdzeniem.
 */

const MONTHS_PL: Record<string, number> = {
  stycznia: 1,
  lutego: 2,
  marca: 3,
  kwietnia: 4,
  maja: 5,
  czerwca: 6,
  lipca: 7,
  sierpnia: 8,
  wrzesnia: 9,
  pazdziernika: 10,
  listopada: 11,
  grudnia: 12,
};

function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Zwraca pierwszą znalezioną datę w tekście jako "YYYY-MM-DD", albo null. */
export function extractDate(text: string): string | null {
  const isoMatch = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const dmyMatch = text.match(/\b(\d{1,2})[.\/-](\d{1,2})[.\/-](20\d{2})\b/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${pad(month)}-${pad(day)}`;
    }
  }

  const normalized = stripDiacritics(text.toLowerCase());
  const monthNames = Object.keys(MONTHS_PL).join("|");
  const plMatch = normalized.match(new RegExp(`\\b(\\d{1,2})\\s+(${monthNames})\\s+(20\\d{2})\\b`));
  if (plMatch) {
    const day = Number(plMatch[1]);
    const month = MONTHS_PL[plMatch[2]];
    const year = Number(plMatch[3]);
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  return null;
}

/** Zwraca WSZYSTKIE znalezione daty (do wyliczenia zakresu np. check-in/check-out). */
export function extractAllDates(text: string): string[] {
  const dates = new Set<string>();
  const isoMatches = text.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g);
  for (const m of isoMatches) dates.add(`${m[1]}-${m[2]}-${m[3]}`);

  const dmyMatches = text.matchAll(/\b(\d{1,2})[.\/-](\d{1,2})[.\/-](20\d{2})\b/g);
  for (const m of dmyMatches) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) dates.add(`${year}-${pad(month)}-${pad(day)}`);
  }

  const normalized = stripDiacritics(text.toLowerCase());
  const monthNames = Object.keys(MONTHS_PL).join("|");
  const plMatches = normalized.matchAll(new RegExp(`\\b(\\d{1,2})\\s+(${monthNames})\\s+(20\\d{2})\\b`, "g"));
  for (const m of plMatches) {
    const day = Number(m[1]);
    const month = MONTHS_PL[m[2]];
    const year = Number(m[3]);
    dates.add(`${year}-${pad(month)}-${pad(day)}`);
  }

  return Array.from(dates).sort();
}

export function extractTime(text: string): string | null {
  const match = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (!match) return null;
  return `${pad(Number(match[1]))}:${match[2]}`;
}

const CURRENCY_ALIASES: Record<string, Currency> = {
  pln: "PLN",
  zł: "PLN",
  zl: "PLN",
  eur: "EUR",
  "€": "EUR",
  dkk: "DKK",
  kr: "DKK",
};

export function extractAmount(text: string): { amount: number; currency: Currency | null } | null {
  // Dwie alternatywy dla części całkowitej: albo poprawnie pogrupowane tysiące
  // (separator WYMAGANY między każdą trójką cyfr), albo zwykły ciąg cyfr bez
  // separatora — bez tego drugiego wariantu kwoty ≥1000 zapisane bez
  // separatora tysięcy (np. "1200,00 PLN", częste w polskich dokumentach)
  // w ogóle się nie dopasowywały.
  const withCurrencyAfter = text.match(/\b(\d{1,3}(?:[ .]\d{3})+(?:,\d{2})?|\d+(?:,\d{2})?)\s*(PLN|zł|zl|EUR|€|DKK|kr)\b/i);
  const withCurrencyBefore = text.match(/\b(PLN|EUR|DKK)\s*(\d{1,3}(?:[ .,]\d{2,3})+|\d+)\b/i);

  const match = withCurrencyAfter ?? withCurrencyBefore;
  if (!match) return null;

  const isAfter = Boolean(withCurrencyAfter);
  const rawAmount = isAfter ? match[1] : match[2];
  const rawCurrency = isAfter ? match[2] : match[1];

  const normalizedAmount = rawAmount.replace(/\s/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const amount = Number(normalizedAmount);
  if (Number.isNaN(amount)) return null;

  const currency = CURRENCY_ALIASES[rawCurrency.toLowerCase()] ?? null;
  return { amount, currency };
}

function extractAfterKeywords(text: string, keywords: string[]): string | null {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[:\\s]+([A-Z0-9][A-Z0-9\\-/]{3,14})`, "i");
    const match = text.match(regex);
    if (match) return match[1];
  }
  return null;
}

export function extractBookingReference(text: string): string | null {
  return extractAfterKeywords(text, [
    "numer rezerwacji",
    "nr rezerwacji",
    "booking reference",
    "booking number",
    "confirmation number",
    "numer potwierdzenia",
    "pnr",
    "reservation number",
  ]);
}

export function extractFlightNumber(text: string): string | null {
  const nearKeyword = text.match(/(?:numer lotu|flight|rejs)[:\s]+([A-Z]{2}\s?\d{2,4})/i);
  if (nearKeyword) return nearKeyword[1].replace(/\s+/g, "");
  return null;
}

export function extractCarrier(text: string, knownCarriers: string[]): string | null {
  const normalized = stripDiacritics(text.toLowerCase());
  for (const carrier of knownCarriers) {
    if (normalized.includes(stripDiacritics(carrier.toLowerCase()))) return carrier;
  }
  return null;
}

const KNOWN_AIRLINES = ["Ryanair", "Wizz Air", "LOT", "Lufthansa", "KLM", "SAS", "Norwegian", "easyJet"];
const KNOWN_RAIL = ["PKP Intercity", "PKP", "Deutsche Bahn", "DSB"];
const KNOWN_BUS = ["FlixBus", "PolskiBus", "Flixbus"];

/** IATA-style lotnisko/miasto: szuka "z X do Y" / "from X to Y" / strzałki "X -> Y" / "X - Y". */
export function extractRoute(text: string): { origin: string | null; destination: string | null } {
  // Strzałka ("->"/"→") sprawdzana NAJPIERW i osobno od samego myślnika —
  // myślnik samodzielnie jest zbyt niejednoznaczny (często pojawia się
  // wcześniej w tytule dokumentu, np. "Bilet lotniczy - Ryanair") i przy
  // dopasowaniu "pierwszej pasującej pary" dawał origin/destination z
  // tytułu zamiast z faktycznej trasy niżej w tekście.
  const arrow = text.match(/([A-ZŁŚŻŹĆŃÓĄĘ][\p{L} ]{2,20})\s*(?:->|→)\s*([A-ZŁŚŻŹĆŃÓĄĘ][\p{L} ]{2,20})/u);
  if (arrow) return { origin: arrow[1].trim(), destination: arrow[2].trim() };

  const hyphen = text.match(/([A-ZŁŚŻŹĆŃÓĄĘ][\p{L} ]{2,20})\s*-\s*([A-ZŁŚŻŹĆŃÓĄĘ][\p{L} ]{2,20})/u);
  if (hyphen) return { origin: hyphen[1].trim(), destination: hyphen[2].trim() };

  const fromTo = text.match(/z\s+([A-ZŁŚŻŹĆŃÓĄĘ][\p{L}]{2,20})\s+do\s+([A-ZŁŚŻŹĆŃÓĄĘ][\p{L}]{2,20})/u);
  if (fromTo) return { origin: fromTo[1], destination: fromTo[2] };

  return { origin: null, destination: null };
}

export function extractHotelName(text: string): string | null {
  const match = text.match(/hotel[:\s]+([A-Z][\p{L}0-9 &'-]{2,40})/iu);
  return match ? match[1].trim() : null;
}

export function extractSessionReference(text: string): { label: string | null; number: number | null } {
  const romanMatch = text.match(/zjazd[u]?\s+(I{1,3}V?|IV|V|VI{1,3}|IX|X)\b/iu);
  if (romanMatch) {
    const roman = romanMatch[1].toUpperCase();
    const romanValues: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
    return { label: `Zjazd ${roman}`, number: romanValues[roman] ?? null };
  }
  const numericMatch = text.match(/zjazd[u]?\s+(?:nr\.?\s*)?(\d{1,2})\b/iu);
  if (numericMatch) return { label: `Zjazd ${numericMatch[1]}`, number: Number(numericMatch[1]) };
  return { label: null, number: null };
}

export function extractPassengerName(text: string): string | null {
  const match = text.match(/(?:pasażer|passenger|imię i nazwisko)[:\s]+([A-ZŁŚŻŹĆŃÓĄĘ][\p{L}]+\s+[A-ZŁŚŻŹĆŃÓĄĘ][\p{L}]+)/iu);
  return match ? match[1].trim() : null;
}

export function extractSeat(text: string): string | null {
  const match = text.match(/(?:miejsce|seat)[:\s]+([A-Z]?\d{1,3}[A-Z]?)/i);
  return match ? match[1] : null;
}

function extractDateNearKeyword(text: string, keywords: string[]): string | null {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[^\\n]{0,30}`, "i");
    const match = text.match(regex);
    if (match) {
      const date = extractDate(match[0]);
      if (date) return date;
    }
  }
  return null;
}

/**
 * Check-in/check-out zakotwiczone przy słowach kluczowych — dokument hotelowy
 * często zawiera inne daty (np. termin darmowego anulowania), więc branie
 * po prostu pierwszej/ostatniej daty w całym tekście dawało błędne wyniki.
 * Dopiero brak jednoznacznych etykiet cofa się do tego mniej pewnego fallbacku.
 */
export function extractCheckInCheckOut(text: string): { checkIn: string | null; checkOut: string | null } {
  const checkIn = extractDateNearKeyword(text, ["check-in", "check in", "zameldowanie", "przyjazd"]);
  const checkOut = extractDateNearKeyword(text, ["check-out", "check out", "wymeldowanie", "wyjazd"]);
  if (checkIn || checkOut) return { checkIn, checkOut };

  const dates = extractAllDates(text);
  return { checkIn: dates[0] ?? null, checkOut: dates.length > 1 ? dates[dates.length - 1] : null };
}

export function hasBreakfastMention(text: string): boolean {
  return /śniadani|breakfast/i.test(text);
}

export function extractFreeCancellationDeadline(text: string): string | null {
  const near = text.match(/(?:bezpłatn\w* anulowani\w*|free cancellation)[^\n]{0,40}/iu);
  if (!near) return null;
  return extractDate(near[0]);
}

export type ExtractedReservationFields = {
  provider: string | null;
  booking_reference: string | null;
  origin: string | null;
  destination: string | null;
  start_at: string | null;
  end_at: string | null;
  check_in: string | null;
  check_out: string | null;
  amount: number | null;
  currency: Currency | null;
  payment_status: string | null;
  passenger_name: string | null;
  baggage: string | null;
  seat: string | null;
  cancellation_deadline: string | null;
  extra: ImportExtractedData;
};

function emptyFields(): ExtractedReservationFields {
  return {
    provider: null,
    booking_reference: null,
    origin: null,
    destination: null,
    start_at: null,
    end_at: null,
    check_in: null,
    check_out: null,
    amount: null,
    currency: null,
    payment_status: null,
    passenger_name: null,
    baggage: null,
    seat: null,
    cancellation_deadline: null,
    extra: {},
  };
}

function combineDateTime(date: string | null, time: string | null): string | null {
  if (!date) return null;
  const iso = `${date}T${time ?? "00:00"}:00`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function extractReservationFields(detectedType: ImportDetectedType, text: string): ExtractedReservationFields {
  const fields = emptyFields();
  const amountResult = extractAmount(text);
  if (amountResult) {
    fields.amount = amountResult.amount;
    fields.currency = amountResult.currency;
  }
  fields.booking_reference = extractBookingReference(text);

  if (detectedType === "flight") {
    const route = extractRoute(text);
    fields.origin = route.origin;
    fields.destination = route.destination;
    fields.provider = extractCarrier(text, KNOWN_AIRLINES);
    fields.passenger_name = extractPassengerName(text);
    fields.seat = extractSeat(text);
    const date = extractDate(text);
    const time = extractTime(text);
    fields.start_at = combineDateTime(date, time);
    const flightNumber = extractFlightNumber(text);
    if (flightNumber) fields.extra.transport_number = flightNumber;
    if (/bagaż rejestrowan|checked baggage|20\s?kg|23\s?kg/i.test(text)) fields.extra.baggage = "tak";
    return fields;
  }

  if (detectedType === "train" || detectedType === "bus") {
    const route = extractRoute(text);
    fields.origin = route.origin;
    fields.destination = route.destination;
    fields.provider = extractCarrier(text, detectedType === "train" ? KNOWN_RAIL : KNOWN_BUS);
    fields.seat = extractSeat(text);
    const date = extractDate(text);
    const time = extractTime(text);
    fields.start_at = combineDateTime(date, time);
    return fields;
  }

  if (detectedType === "hotel") {
    const { checkIn, checkOut } = extractCheckInCheckOut(text);
    fields.check_in = checkIn;
    fields.check_out = checkOut;
    fields.extra.hotel_name = extractHotelName(text) ?? undefined;
    fields.extra.breakfast_included = hasBreakfastMention(text);
    fields.cancellation_deadline = extractFreeCancellationDeadline(text)
      ? `${extractFreeCancellationDeadline(text)}T00:00:00.000Z`
      : null;
    return fields;
  }

  if (detectedType === "school_payment" || detectedType === "invoice" || detectedType === "receipt") {
    const date = extractDate(text);
    fields.start_at = date ? `${date}T00:00:00.000Z` : null;
    const recipientMatch = text.match(/(?:odbiorca|sprzedawca|recipient)[:\s]+([^\n,]{3,60})/i);
    if (recipientMatch) fields.extra.recipient = recipientMatch[1].trim();
    const titleMatch = text.match(/(?:tytuł(?:em)?|title)[:\s]+([^\n]{3,80})/i);
    if (titleMatch) fields.extra.payment_title = titleMatch[1].trim();
    fields.booking_reference = fields.booking_reference ?? extractAfterKeywords(text, ["faktura nr", "paragon nr", "nr dokumentu"]);
    return fields;
  }

  if (detectedType === "school_information" || detectedType === "schedule") {
    const dates = extractAllDates(text);
    fields.start_at = dates[0] ? `${dates[0]}T00:00:00.000Z` : null;
    fields.end_at = dates.length > 1 ? `${dates[dates.length - 1]}T00:00:00.000Z` : null;
    const roomMatch = text.match(/(?:sala)[:\s]+([A-Za-z0-9 ]{1,20})/i);
    if (roomMatch) fields.extra.room = roomMatch[1].trim();
    const trainerMatch = text.match(/(?:prowadzący|prowadząca)[:\s]+([^\n,]{3,60})/i);
    if (trainerMatch) fields.extra.trainer = trainerMatch[1].trim();
    return fields;
  }

  return fields;
}
