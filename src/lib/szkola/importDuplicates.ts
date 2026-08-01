import "server-only";
import { createHash } from "node:crypto";
import type { createClient } from "@/lib/supabase/server";
import type { Currency, ImportDetectedType } from "@/lib/szkola/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export function hashFileBuffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export type DuplicateMatch = {
  id: string;
  matchType: "file_hash" | "filename" | "booking_reference" | "amount_and_date";
  table: "import_inbox_items" | "imported_reservations";
  summary: string;
};

/** Sekcja 12 specyfikacji: hash pliku i nazwa pliku — przed zapisem NOWEGO elementu skrzynki. */
export async function findDuplicateInboxItem(
  supabase: SupabaseServerClient,
  userId: string,
  input: { fileHash?: string | null; filename?: string | null },
): Promise<DuplicateMatch[]> {
  const matches: DuplicateMatch[] = [];

  if (input.fileHash) {
    const { data } = await supabase
      .from("import_inbox_items")
      .select("id, original_filename")
      .eq("user_id", userId)
      .eq("file_hash", input.fileHash)
      .neq("status", "rejected");
    for (const row of data ?? []) {
      matches.push({
        id: row.id,
        matchType: "file_hash",
        table: "import_inbox_items",
        summary: `Identyczny plik: ${row.original_filename ?? "bez nazwy"}`,
      });
    }
  }

  if (matches.length === 0 && input.filename) {
    const { data } = await supabase
      .from("import_inbox_items")
      .select("id, original_filename")
      .eq("user_id", userId)
      .eq("original_filename", input.filename)
      .neq("status", "rejected");
    for (const row of data ?? []) {
      matches.push({
        id: row.id,
        matchType: "filename",
        table: "import_inbox_items",
        summary: `Ten sam plik: ${row.original_filename}`,
      });
    }
  }

  return matches;
}

/** Sekcja 12: numer rezerwacji, oraz kwota+data (obejmuje też "numer lotu i datę"/"przewoźnika" — pokrywa się z tą samą rezerwacją). */
export async function findDuplicateReservation(
  supabase: SupabaseServerClient,
  userId: string,
  input: {
    reservationType: ImportDetectedType;
    bookingReference?: string | null;
    amount?: number | null;
    currency?: Currency | null;
    startAt?: string | null;
  },
): Promise<DuplicateMatch[]> {
  const matches: DuplicateMatch[] = [];

  if (input.bookingReference) {
    const { data } = await supabase
      .from("imported_reservations")
      .select("id, booking_reference, amount, currency")
      .eq("user_id", userId)
      .eq("booking_reference", input.bookingReference)
      .neq("status", "rejected");
    for (const row of data ?? []) {
      matches.push({
        id: row.id,
        matchType: "booking_reference",
        table: "imported_reservations",
        summary: `Ten sam numer rezerwacji: ${row.booking_reference}`,
      });
    }
  }

  if (matches.length === 0 && input.amount != null && input.startAt) {
    const dateOnly = input.startAt.slice(0, 10);
    const { data } = await supabase
      .from("imported_reservations")
      .select("id, amount, currency, start_at")
      .eq("user_id", userId)
      .eq("reservation_type", input.reservationType)
      .eq("amount", input.amount)
      .gte("start_at", `${dateOnly}T00:00:00.000Z`)
      .lte("start_at", `${dateOnly}T23:59:59.999Z`)
      .neq("status", "rejected");
    for (const row of data ?? []) {
      matches.push({
        id: row.id,
        matchType: "amount_and_date",
        table: "imported_reservations",
        summary: `Ta sama kwota (${row.amount} ${row.currency ?? ""}) i data (${dateOnly})`,
      });
    }
  }

  return matches;
}
