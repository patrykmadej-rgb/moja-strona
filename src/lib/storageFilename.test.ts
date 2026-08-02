import { describe, expect, it } from "vitest";
import { sanitizeStorageFilename } from "./storageFilename";

describe("sanitizeStorageFilename", () => {
  it("strips Polish diacritics that Supabase Storage rejects in object keys", () => {
    expect(sanitizeStorageFilename("Recenzja książki .docx")).toBe("Recenzja_ksiazki_.docx");
  });

  it("collapses spaces and other unsafe characters into single underscores", () => {
    expect(sanitizeStorageFilename("plik  z    wieloma   spacjami.pdf")).toBe("plik_z_wieloma_spacjami.pdf");
  });

  it("leaves an already-safe ASCII filename unchanged", () => {
    expect(sanitizeStorageFilename("report_v2-final.pdf")).toBe("report_v2-final.pdf");
  });

  it("trims leading/trailing separators produced by leading/trailing unsafe characters", () => {
    expect(sanitizeStorageFilename("  §test§  .pdf")).toBe("test_.pdf");
  });

  it("never returns an empty string, even for input that is entirely unsafe characters", () => {
    expect(sanitizeStorageFilename("???")).toBe("plik");
  });
});
