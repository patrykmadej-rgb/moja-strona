import { describe, expect, it } from "vitest";
import { classifyImportContent, isLowConfidence } from "./importClassifier";
import {
  extractAllDates,
  extractAmount,
  extractBookingReference,
  extractDate,
  extractReservationFields,
  extractRoute,
  extractSessionReference,
} from "./importFieldExtraction";

// Fikcyjne teksty testowe — nie prawdziwe dokumenty.
const FLIGHT_TEXT = `
Bilet lotniczy — Ryanair
Numer rezerwacji: FR7X9K2
Numer lotu: FR1234
Pasażer: Jan Kowalski
Warszawa -> Kopenhaga
Data: 18.09.2026
Godzina odlotu: 07:30
Miejsce: 14C
Cena: 350,00 PLN
`;

const HOTEL_TEXT = `
Potwierdzenie rezerwacji — Booking.com
Hotel: Comfort Inn Centrum
Check-in: 18.09.2026
Check-out: 20.09.2026
Numer rezerwacji: BK998877
Śniadanie w cenie
Bezpłatne anulowanie do 10.09.2026
Cena: 620 PLN
`;

const SCHOOL_PAYMENT_TEXT = `
Potwierdzenie płatności za szkołę psychoterapii
Tytułem: Opłata za zjazd VI
Kwota: 1200,00 PLN
Data: 01.09.2026
Odbiorca: Szkoła Psychoterapii Sp. z o.o.
`;

const SCHOOL_INFO_TEXT = `
Temat: Informacja organizacyjna — Zjazd VI
Przypominamy o terminie zjazdu VI: 18-20 września 2026.
Sala 204, prowadzący: dr Anna Nowak.
Plan zajęć w załączniku.
`;

const RECEIPT_TEXT = `
Paragon fiskalny nr PF-2024/551
Kwota: 45,50 PLN
`;

describe("classifyImportContent", () => {
  it("rozpoznaje lot na podstawie treści biletu", () => {
    const result = classifyImportContent({ text: FLIGHT_TEXT, subject: "Twój bilet Ryanair", filename: "eticket.pdf" });
    expect(result.detectedType).toBe("flight");
    expect(isLowConfidence(result.confidence)).toBe(false);
  });

  it("rozpoznaje hotel na podstawie potwierdzenia rezerwacji", () => {
    const result = classifyImportContent({ text: HOTEL_TEXT, subject: "Potwierdzenie rezerwacji Booking.com" });
    expect(result.detectedType).toBe("hotel");
    expect(isLowConfidence(result.confidence)).toBe(false);
  });

  it("rozpoznaje płatność za szkołę", () => {
    const result = classifyImportContent({ text: SCHOOL_PAYMENT_TEXT });
    expect(result.detectedType).toBe("school_payment");
    expect(isLowConfidence(result.confidence)).toBe(false);
  });

  it("rozpoznaje wiadomość organizacyjną", () => {
    const result = classifyImportContent({ text: SCHOOL_INFO_TEXT, subject: "Informacja organizacyjna — Zjazd VI" });
    expect(result.detectedType).toBe("school_information");
    expect(isLowConfidence(result.confidence)).toBe(false);
  });

  it("rozpoznaje paragon", () => {
    const result = classifyImportContent({ text: RECEIPT_TEXT });
    expect(result.detectedType).toBe("receipt");
  });

  it("zwraca niską pewność i nie zgaduje dla niejasnej treści", () => {
    const result = classifyImportContent({ text: "Cześć, jak się masz? Do zobaczenia wkrótce." });
    expect(isLowConfidence(result.confidence)).toBe(true);
  });

  it("nie opiera się wyłącznie na nazwie pliku", () => {
    // Nazwa pliku sugeruje fakturę, ale treść jednoznacznie mówi o hotelu.
    const result = classifyImportContent({ text: HOTEL_TEXT, filename: "faktura.pdf" });
    expect(result.detectedType).toBe("hotel");
  });
});

describe("extractDate / extractAllDates", () => {
  it("rozpoznaje datę w formacie DD.MM.YYYY", () => {
    expect(extractDate("Data: 18.09.2026")).toBe("2026-09-18");
  });

  it("rozpoznaje datę w formacie ISO", () => {
    expect(extractDate("Wystawiono 2026-09-18")).toBe("2026-09-18");
  });

  it("rozpoznaje datę zapisaną słownie po polsku", () => {
    expect(extractDate("Zjazd odbędzie się 18 września 2026")).toBe("2026-09-18");
  });

  it("zwraca null, gdy nie ma żadnej daty", () => {
    expect(extractDate("Brak jakiejkolwiek daty w tym tekście")).toBeNull();
  });

  it("zwraca posortowaną listę wszystkich dat (check-in/check-out)", () => {
    const dates = extractAllDates(HOTEL_TEXT);
    expect(dates).toContain("2026-09-18");
    expect(dates).toContain("2026-09-20");
    expect(dates[0] <= dates[dates.length - 1]).toBe(true);
  });
});

describe("extractAmount", () => {
  it("rozpoznaje kwotę z przecinkiem i PLN po liczbie", () => {
    const result = extractAmount("Cena: 350,00 PLN");
    expect(result?.amount).toBe(350);
    expect(result?.currency).toBe("PLN");
  });

  it("rozpoznaje EUR", () => {
    const result = extractAmount("Total: 45.50 EUR");
    expect(result?.currency).toBe("EUR");
  });

  it("zwraca null, gdy nie ma kwoty", () => {
    expect(extractAmount("Brak ceny w tym tekście")).toBeNull();
  });

  it("rozpoznaje kwotę ≥1000 zapisaną BEZ separatora tysięcy (regresja)", () => {
    const result = extractAmount("Kwota: 1200,00 PLN");
    expect(result?.amount).toBe(1200);
    expect(result?.currency).toBe("PLN");
  });

  it("nadal rozpoznaje kwotę pogrupowaną separatorem spacji", () => {
    const result = extractAmount("Kwota: 1 200,00 PLN");
    expect(result?.amount).toBe(1200);
  });

  it("nadal rozpoznaje kwotę pogrupowaną separatorem kropki", () => {
    const result = extractAmount("Total: 12.345,67 EUR");
    expect(result?.amount).toBeCloseTo(12345.67);
  });
});

describe("extractBookingReference", () => {
  it("rozpoznaje numer rezerwacji po słowie kluczowym", () => {
    expect(extractBookingReference(FLIGHT_TEXT)).toBe("FR7X9K2");
  });

  it("zwraca null, gdy nie ma numeru rezerwacji", () => {
    expect(extractBookingReference("Zwykły tekst bez numeru")).toBeNull();
  });
});

describe("extractRoute", () => {
  it("rozpoznaje trasę zapisaną ze strzałką", () => {
    const route = extractRoute("Warszawa -> Kopenhaga");
    expect(route.origin).toBe("Warszawa");
    expect(route.destination).toBe("Kopenhaga");
  });

  it("nie daje się zmylić myślnikowi w tytule dokumentu, gdy trasa ze strzałką jest niżej (regresja)", () => {
    const route = extractRoute("Bilet lotniczy Ryanair\nNumer rezerwacji: FR9001\nWarszawa -> Kopenhaga\nCena: 400 PLN");
    expect(route.origin).toBe("Warszawa");
    expect(route.destination).toBe("Kopenhaga");
  });

  it("bez strzałki nadal rozpoznaje trasę zapisaną samym myślnikiem", () => {
    const route = extractRoute("Trasa: Gdansk - Krakow");
    expect(route.origin).toBe("Gdansk");
    expect(route.destination).toBe("Krakow");
  });
});

describe("extractSessionReference", () => {
  it("rozpoznaje zjazd zapisany rzymską cyfrą", () => {
    const result = extractSessionReference("Zjazd VI odbędzie się we wrześniu");
    expect(result.label).toBe("Zjazd VI");
    expect(result.number).toBe(6);
  });

  it("rozpoznaje zjazd zapisany liczbą", () => {
    const result = extractSessionReference("Zjazd nr 6 — informacje");
    expect(result.number).toBe(6);
  });
});

describe("extractReservationFields", () => {
  it("wyciąga pełny komplet pól dla lotu", () => {
    const fields = extractReservationFields("flight", FLIGHT_TEXT);
    expect(fields.origin).toBe("Warszawa");
    expect(fields.destination).toBe("Kopenhaga");
    expect(fields.booking_reference).toBe("FR7X9K2");
    expect(fields.seat).toBe("14C");
    expect(fields.amount).toBe(350);
    expect(fields.currency).toBe("PLN");
    expect(fields.start_at).toContain("2026-09-18");
  });

  it("wyciąga pola dla hotelu, w tym check-in/check-out", () => {
    const fields = extractReservationFields("hotel", HOTEL_TEXT);
    expect(fields.check_in).toBe("2026-09-18");
    expect(fields.check_out).toBe("2026-09-20");
    expect(fields.extra.hotel_name).toContain("Comfort Inn");
    expect(fields.extra.breakfast_included).toBe(true);
  });

  it("nie zgaduje pól, których nie da się rozpoznać", () => {
    const fields = extractReservationFields("other", "Zupełnie nieistotny tekst bez żadnych danych.");
    expect(fields.amount).toBeNull();
    expect(fields.booking_reference).toBeNull();
    expect(fields.origin).toBeNull();
  });
});
