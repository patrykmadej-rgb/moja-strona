import { describe, expect, it } from "vitest";
import { findDuplicateInboxItem, findDuplicateReservation, hashFileBuffer } from "./importDuplicates";

type Filters = Record<string, unknown>;
type Row = Record<string, unknown>;

/**
 * Minimalny fałszywy klient Supabase odwzorowujący łańcuch
 * from().select().eq()...neq()/gte()/lte() używany w importDuplicates.ts.
 * Filtrowanie po stronie Postgresa (RLS, indeksy) nie jest tu testowane —
 * to zakres integracyjny. Ten test sprawdza logikę rozgałęzień i mapowania
 * wyników (kolejność sprawdzeń, krótkie spięcie, typ dopasowania, treść podsumowania).
 */
function createMockSupabase(resolve: (table: string, filters: Filters) => Row[]) {
  const calls: { table: string; filters: Filters }[] = [];

  const from = (table: string) => {
    const filters: Filters = {};
    const builder = {
      select() {
        return builder;
      },
      eq(col: string, val: unknown) {
        filters[col] = val;
        return builder;
      },
      neq(col: string, val: unknown) {
        filters[`${col}__neq`] = val;
        return builder;
      },
      gte(col: string, val: unknown) {
        filters[`${col}__gte`] = val;
        return builder;
      },
      lte(col: string, val: unknown) {
        filters[`${col}__lte`] = val;
        return builder;
      },
      then(onFulfilled: (value: { data: Row[] }) => unknown, onRejected?: (reason: unknown) => unknown) {
        calls.push({ table, filters });
        return Promise.resolve({ data: resolve(table, filters) }).then(onFulfilled, onRejected);
      },
    };
    return builder;
  };

  return { supabase: { from } as never, calls };
}

describe("hashFileBuffer", () => {
  it("returns a 64-character hex sha256 digest", () => {
    const hash = hashFileBuffer(Buffer.from("test content"));
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns the same hash for identical content and a different hash for different content", () => {
    const a = hashFileBuffer(Buffer.from("dokument A"));
    const b = hashFileBuffer(Buffer.from("dokument A"));
    const c = hashFileBuffer(Buffer.from("dokument B"));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});

describe("findDuplicateInboxItem", () => {
  it("returns a file_hash match when an identical file hash is found, without checking the filename", () => {
    let filenameQueried = false;
    const { supabase } = createMockSupabase((table, filters) => {
      if ("file_hash" in filters) {
        return [{ id: "existing-1", original_filename: "bilet.pdf" }];
      }
      filenameQueried = true;
      return [];
    });

    return findDuplicateInboxItem(supabase, "user-1", { fileHash: "abc123", filename: "bilet.pdf" }).then((matches) => {
      expect(matches).toHaveLength(1);
      expect(matches[0]).toMatchObject({ id: "existing-1", matchType: "file_hash", table: "import_inbox_items" });
      expect(filenameQueried).toBe(false);
    });
  });

  it("falls back to filename match when there is no file hash match", () => {
    const { supabase } = createMockSupabase((_table, filters) => {
      if ("file_hash" in filters) return [];
      if ("original_filename" in filters) return [{ id: "existing-2", original_filename: "rezerwacja.eml" }];
      return [];
    });

    return findDuplicateInboxItem(supabase, "user-1", { fileHash: "zzz", filename: "rezerwacja.eml" }).then((matches) => {
      expect(matches).toHaveLength(1);
      expect(matches[0]).toMatchObject({ matchType: "filename", table: "import_inbox_items" });
    });
  });

  it("returns an empty array when neither a hash nor a filename is provided", () => {
    const { supabase } = createMockSupabase(() => [{ id: "should-not-appear", original_filename: "x" }]);

    return findDuplicateInboxItem(supabase, "user-1", {}).then((matches) => {
      expect(matches).toEqual([]);
    });
  });
});

describe("findDuplicateReservation", () => {
  it("returns a booking_reference match and does not fall back to amount/date matching", () => {
    let amountDateQueried = false;
    const { supabase } = createMockSupabase((_table, filters) => {
      if ("booking_reference" in filters) {
        return [{ id: "res-1", booking_reference: "FR7X9K2", amount: 350, currency: "PLN" }];
      }
      amountDateQueried = true;
      return [];
    });

    return findDuplicateReservation(supabase, "user-1", {
      reservationType: "flight",
      bookingReference: "FR7X9K2",
      amount: 350,
      currency: "PLN",
      startAt: "2026-09-18T07:30:00.000Z",
    }).then((matches) => {
      expect(matches).toHaveLength(1);
      expect(matches[0]).toMatchObject({ matchType: "booking_reference", table: "imported_reservations" });
      expect(amountDateQueried).toBe(false);
    });
  });

  it("falls back to amount+date match when there is no booking reference match", () => {
    const { supabase } = createMockSupabase((_table, filters) => {
      if ("booking_reference" in filters) return [];
      if ("amount" in filters) return [{ id: "res-2", amount: 620, currency: "PLN", start_at: "2026-09-18T00:00:00.000Z" }];
      return [];
    });

    return findDuplicateReservation(supabase, "user-1", {
      reservationType: "hotel",
      amount: 620,
      currency: "PLN",
      startAt: "2026-09-18T00:00:00.000Z",
    }).then((matches) => {
      expect(matches).toHaveLength(1);
      expect(matches[0].matchType).toBe("amount_and_date");
      expect(matches[0].summary).toContain("620");
      expect(matches[0].summary).toContain("2026-09-18");
    });
  });

  it("returns an empty array when nothing matches", () => {
    const { supabase } = createMockSupabase(() => []);

    return findDuplicateReservation(supabase, "user-1", {
      reservationType: "flight",
      bookingReference: "NOPE",
      amount: 999,
      currency: "PLN",
      startAt: "2026-01-01T00:00:00.000Z",
    }).then((matches) => {
      expect(matches).toEqual([]);
    });
  });
});
