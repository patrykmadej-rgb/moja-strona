"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createBook,
  createLoan,
  deleteBook,
  returnLoan as returnLoanService,
  setCover,
  setOwnershipStatus,
  setReadingStatus,
  updateBook,
  type CoverUpdate,
  type LibraryBookInput,
} from "@/lib/lab/library-service";
import { OWNERSHIP_STATUSES, READING_STATUSES, type LibraryBook, type OwnershipStatus, type ReadingStatus } from "@/lib/lab/library-types";
import { todayDateString } from "@/lib/lab/format";

const LAB_LIBRARY_PATH = "/lab/biblioteka";

export type LibraryActionError = {
  error: string;
  field?: "title" | "author";
  duplicates?: Pick<LibraryBook, "id" | "title" | "author" | "ownership_status">[];
};

/**
 * Błąd zwrócony jako wartość (nie rzucony) — tak samo jak w
 * src/app/lab/schowek/actions.ts i src/app/lab/artykuly/[id]/actions.ts,
 * bo Next.js w buildzie produkcyjnym zamienia treść RZUCONYCH wyjątków z
 * akcji serwerowych na ogólny komunikat.
 */

function parseBookInput(formData: FormData): { input: LibraryBookInput } | { error: LibraryActionError } {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: { error: "Tytuł jest wymagany.", field: "title" } };

  const author = String(formData.get("author") ?? "").trim();
  if (!author) return { error: { error: "Autor jest wymagany.", field: "author" } };

  const ownershipStatusRaw = String(formData.get("ownershipStatus") ?? "");
  const ownershipStatus = (OWNERSHIP_STATUSES as readonly string[]).includes(ownershipStatusRaw)
    ? (ownershipStatusRaw as OwnershipStatus)
    : "wishlist";

  const readingStatusRaw = String(formData.get("readingStatus") ?? "");
  const readingStatus = (READING_STATUSES as readonly string[]).includes(readingStatusRaw) ? (readingStatusRaw as ReadingStatus) : "unread";

  const category = String(formData.get("category") ?? "").trim() || null;
  const language = String(formData.get("language") ?? "").trim() || null;
  const isbn = String(formData.get("isbn") ?? "").trim() || null;
  const publisher = String(formData.get("publisher") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const coverUrl = String(formData.get("coverUrl") ?? "").trim() || null;

  const yearRaw = String(formData.get("year") ?? "").trim();
  let year: number | null = null;
  if (yearRaw) {
    const parsed = Number.parseInt(yearRaw, 10);
    if (!Number.isFinite(parsed)) return { error: { error: "Rok wydania musi być liczbą." } };
    year = parsed;
  }

  return { input: { title, author, ownershipStatus, readingStatus, category, language, year, isbn, publisher, notes, coverUrl } };
}

export async function createLibraryBook(formData: FormData): Promise<LibraryActionError | undefined> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Brak autoryzacji." };

    const parsed = parseBookInput(formData);
    if ("error" in parsed) return parsed.error;

    const confirmDuplicate = formData.get("confirmDuplicate") === "true";

    const result = await createBook(supabase, user.id, parsed.input, { skipDuplicateCheck: confirmDuplicate });
    if (!result.ok) {
      return {
        error: result.error,
        field: result.field,
        duplicates: result.duplicates?.map((b) => ({ id: b.id, title: b.title, author: b.author, ownership_status: b.ownership_status })),
      };
    }

    revalidatePath(LAB_LIBRARY_PATH);
    return undefined;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Nie udało się dodać książki." };
  }
}

export async function updateLibraryBook(formData: FormData): Promise<LibraryActionError | undefined> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Brak autoryzacji." };

    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Brak identyfikatora książki." };

    const parsed = parseBookInput(formData);
    if ("error" in parsed) return parsed.error;

    const result = await updateBook(supabase, user.id, id, parsed.input);
    if (!result.ok) return { error: result.error, field: result.field };

    revalidatePath(LAB_LIBRARY_PATH);
    return undefined;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Nie udało się zapisać zmian." };
  }
}

export async function deleteLibraryBook(formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Brak autoryzacji." };

    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Brak identyfikatora książki." };

    const result = await deleteBook(supabase, user.id, id);
    if (!result.ok) return { error: result.error };

    revalidatePath(LAB_LIBRARY_PATH);
    return undefined;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Nie udało się usunąć książki." };
  }
}

export async function moveBookOwnership(bookId: string, ownershipStatus: OwnershipStatus): Promise<{ error: string } | { success: true }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Brak autoryzacji." };

    const result = await setOwnershipStatus(supabase, user.id, bookId, ownershipStatus);
    if (!result.ok) return { error: result.error };

    revalidatePath(LAB_LIBRARY_PATH);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Nie udało się zmienić statusu." };
  }
}

export async function updateReadingStatus(bookId: string, readingStatus: ReadingStatus): Promise<{ error: string } | { success: true }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Brak autoryzacji." };

    const result = await setReadingStatus(supabase, user.id, bookId, readingStatus);
    if (!result.ok) return { error: result.error };

    revalidatePath(LAB_LIBRARY_PATH);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Nie udało się zmienić statusu czytania." };
  }
}

/** Zewnętrzny URL (Google Books/Open Library) — "Znajdź okładkę" / wybór spośród wyników wyszukiwania. `null` = usuń okładkę. */
export async function updateLibraryBookCover(bookId: string, coverUrl: string | null): Promise<{ error: string } | { success: true }> {
  return applyCoverUpdate(bookId, { source: "url", url: coverUrl });
}

/** Zakres 6 briefu: ścieżka we WŁASNYM Storage (bucket library-covers) po udanym uploadzie — patrz src/lib/lab/libraryCoverStorage.ts. */
export async function updateLibraryBookCoverStorage(bookId: string, storagePath: string): Promise<{ error: string } | { success: true }> {
  return applyCoverUpdate(bookId, { source: "storage", path: storagePath });
}

async function applyCoverUpdate(bookId: string, update: CoverUpdate): Promise<{ error: string } | { success: true }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Brak autoryzacji." };

    const result = await setCover(supabase, user.id, bookId, update);
    if (!result.ok) return { error: result.error };

    revalidatePath(LAB_LIBRARY_PATH);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Nie udało się zapisać okładki." };
  }
}

export async function createLibraryLoan(formData: FormData): Promise<{ error: string } | undefined> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Brak autoryzacji." };

    const bookId = String(formData.get("bookId") ?? "");
    if (!bookId) return { error: "Brak identyfikatora książki." };

    const borrowerName = String(formData.get("borrowerName") ?? "").trim();
    if (!borrowerName) return { error: "Podaj komu wypożyczono książkę." };

    const loanedAt = String(formData.get("loanedAt") ?? "").trim() || todayDateString();
    const note = String(formData.get("note") ?? "").trim() || null;

    const result = await createLoan(supabase, user.id, bookId, { borrowerName, loanedAt, note });
    if (!result.ok) return { error: result.error };

    revalidatePath(LAB_LIBRARY_PATH);
    return undefined;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Nie udało się zapisać wypożyczenia." };
  }
}

export async function returnLibraryLoan(loanId: string): Promise<{ error: string } | { success: true }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Brak autoryzacji." };

    const result = await returnLoanService(supabase, loanId, todayDateString());
    if (!result.ok) return { error: result.error };

    revalidatePath(LAB_LIBRARY_PATH);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Nie udało się oznaczyć zwrotu." };
  }
}
