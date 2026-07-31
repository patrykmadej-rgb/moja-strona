import type { SchoolSession } from "@/lib/szkola/types";
import { todayDateString } from "@/lib/lab/format";

export type SessionFilterKey =
  | "wszystkie"
  | "nadchodzace"
  | "wymaga_dzialania"
  | "kompletne"
  | "zakonczone"
  | "anulowane";

export const SESSION_FILTER_LABELS: Record<SessionFilterKey, string> = {
  wszystkie: "Wszystkie",
  nadchodzace: "Nadchodzące",
  wymaga_dzialania: "Wymagające działania",
  kompletne: "Kompletne",
  zakonczone: "Zakończone",
  anulowane: "Anulowane",
};

export function matchesSessionFilter(session: SchoolSession, filter: SessionFilterKey): boolean {
  const today = todayDateString();
  switch (filter) {
    case "wszystkie":
      return true;
    case "nadchodzace":
      return session.start_date >= today && session.status !== "anulowany";
    case "wymaga_dzialania":
      return session.status === "wymaga_dzialania";
    case "kompletne":
      return session.status === "kompletny";
    case "zakonczone":
      return session.status === "zakonczony";
    case "anulowane":
      return session.status === "anulowany";
    default:
      return true;
  }
}
