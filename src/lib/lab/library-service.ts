import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { LibraryBook, LibraryLoan, OwnershipStatus, ReadingStatus } from "@/lib/lab/library-types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Warstwa serwisowa /lab/biblioteka — czyste funkcje (bez "use server"),
 * współdzielone przez src/app/lab/biblioteka/actions.ts. Wzorzec zgodny z
 * src/lib/szkola/importDuplicates.ts i src/lib/szkola/alertsEngine.ts:
 * przyjmują już zalogowanego klienta Supabase + userId, więc dokładnie ta
 * sama logika (reguły biznesowe, wykrywanie duplikatów, limity wypożyczeń)
 * może w przyszłości obsłużyć też endpoint/narzędzie czatowe — bez
 * duplikowania reguł ani omijania RLS.
 *
 * Zakładany kontrakt wejścia: stringi są już przycięte (trim) i pola
 * wymagane już zwalidowane jako niepuste przez wywołującego (server action
 * parsujący FormData) — ta warstwa pilnuje wyłącznie reguł biznesowych
 * (duplikaty, spójność statusu wypożyczenia/własności), nie formatu wejścia.
 */

export type LibraryServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: "title" | "author"; duplicates?: LibraryBook[] };

export type LibraryBookInput = {
  title: string;
  author: string;
  ownershipStatus: OwnershipStatus;
  readingStatus: ReadingStatus;
  category: string | null;
  language: string | null;
  year: number | null;
  isbn: string | null;
  publisher: string | null;
  notes: string | null;
};

export type LoanInput = {
  borrowerName: string;
  loanedAt: string;
  note: string | null;
};

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Wykrywanie potencjalnych duplikatów: najpierw ISBN, potem znormalizowany tytuł+autor (sekcja 5 briefu) — nie blokuje różnych wydań, tylko ostrzega. */
export async function findDuplicateBooks(
  supabase: SupabaseServerClient,
  userId: string,
  input: { isbn: string | null; title: string; author: string },
): Promise<LibraryBook[]> {
  const matches = new Map<string, LibraryBook>();

  if (input.isbn) {
    const { data } = await supabase.from("library_books").select("*").eq("user_id", userId).eq("isbn", input.isbn);
    for (const row of data ?? []) matches.set(row.id, row as LibraryBook);
  }

  const normTitle = normalizeText(input.title);
  const normAuthor = normalizeText(input.author);
  if (normTitle && normAuthor) {
    const { data } = await supabase.from("library_books").select("*").eq("user_id", userId);
    for (const row of data ?? []) {
      if (normalizeText(row.title) === normTitle && normalizeText(row.author) === normAuthor) {
        matches.set(row.id, row as LibraryBook);
      }
    }
  }

  return Array.from(matches.values());
}

export async function getActiveLoanForBook(
  supabase: SupabaseServerClient,
  bookId: string,
): Promise<LibraryLoan | null> {
  // Brak .eq("user_id", ...): library_loans nie ma tej kolumny — RLS
  // (migracja 022) już ogranicza wynik do wypożyczeń książek należących do
  // zalogowanego użytkownika przez EXISTS na library_books.
  const { data } = await supabase.from("library_loans").select("*").eq("book_id", bookId).is("returned_at", null).maybeSingle();
  return (data as LibraryLoan | null) ?? null;
}

export async function createBook(
  supabase: SupabaseServerClient,
  userId: string,
  input: LibraryBookInput,
  opts: { skipDuplicateCheck?: boolean } = {},
): Promise<LibraryServiceResult<LibraryBook>> {
  if (!opts.skipDuplicateCheck) {
    const duplicates = await findDuplicateBooks(supabase, userId, {
      isbn: input.isbn,
      title: input.title,
      author: input.author,
    });
    if (duplicates.length > 0) {
      return { ok: false, error: "Podobna pozycja jest już w Twojej bibliotece.", duplicates };
    }
  }

  // Status czytania eksponowany tylko dla posiadanych — dla planowanych do
  // zakupu wymuszamy "unread" niezależnie od tego, co przyszło z formularza
  // (spójne z ograniczeniem CHECK library_books_wishlist_unread w bazie).
  const readingStatus = input.ownershipStatus === "wishlist" ? "unread" : input.readingStatus;

  const { data, error } = await supabase
    .from("library_books")
    .insert({
      user_id: userId,
      title: input.title,
      author: input.author,
      ownership_status: input.ownershipStatus,
      reading_status: readingStatus,
      category: input.category,
      language: input.language,
      year: input.year,
      isbn: input.isbn,
      publisher: input.publisher,
      notes: input.notes,
    })
    .select("*")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Nie udało się dodać książki." };
  return { ok: true, data: data as LibraryBook };
}

export async function updateBook(
  supabase: SupabaseServerClient,
  userId: string,
  bookId: string,
  input: LibraryBookInput,
): Promise<LibraryServiceResult<LibraryBook>> {
  if (input.ownershipStatus === "wishlist") {
    const activeLoan = await getActiveLoanForBook(supabase, bookId);
    if (activeLoan) {
      return {
        ok: false,
        error: "Nie można przenieść na listę zakupową — książka jest obecnie wypożyczona. Najpierw oznacz zwrot.",
      };
    }
  }

  const readingStatus = input.ownershipStatus === "wishlist" ? "unread" : input.readingStatus;

  const { data, error } = await supabase
    .from("library_books")
    .update({
      title: input.title,
      author: input.author,
      ownership_status: input.ownershipStatus,
      reading_status: readingStatus,
      category: input.category,
      language: input.language,
      year: input.year,
      isbn: input.isbn,
      publisher: input.publisher,
      notes: input.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Nie znaleziono książki." };
  return { ok: true, data: data as LibraryBook };
}

export async function deleteBook(supabase: SupabaseServerClient, userId: string, bookId: string): Promise<LibraryServiceResult<null>> {
  // Kasowanie kaskadowe: usunięcie książki usuwa też jej historię
  // wypożyczeń (library_loans.book_id ... on delete cascade, migracja 022)
  // — rozsądne domyślne zachowanie, bo historia bez książki nie ma sensu.
  const { error, count } = await supabase.from("library_books").delete({ count: "exact" }).eq("id", bookId).eq("user_id", userId);

  if (error) return { ok: false, error: error.message };
  if (!count) return { ok: false, error: "Nie znaleziono książki." };
  return { ok: true, data: null };
}

export async function setOwnershipStatus(
  supabase: SupabaseServerClient,
  userId: string,
  bookId: string,
  ownershipStatus: OwnershipStatus,
): Promise<LibraryServiceResult<LibraryBook>> {
  if (ownershipStatus === "wishlist") {
    const activeLoan = await getActiveLoanForBook(supabase, bookId);
    if (activeLoan) {
      return {
        ok: false,
        error: "Nie można przenieść na listę zakupową — książka jest obecnie wypożyczona. Najpierw oznacz zwrot.",
      };
    }
  }

  const patch: Record<string, unknown> = { ownership_status: ownershipStatus, updated_at: new Date().toISOString() };
  if (ownershipStatus === "wishlist") patch.reading_status = "unread";

  const { data, error } = await supabase.from("library_books").update(patch).eq("id", bookId).eq("user_id", userId).select("*").maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Nie znaleziono książki." };
  return { ok: true, data: data as LibraryBook };
}

export async function setReadingStatus(
  supabase: SupabaseServerClient,
  userId: string,
  bookId: string,
  readingStatus: ReadingStatus,
): Promise<LibraryServiceResult<LibraryBook>> {
  const { data: book, error: fetchError } = await supabase
    .from("library_books")
    .select("ownership_status")
    .eq("id", bookId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) return { ok: false, error: fetchError.message };
  if (!book) return { ok: false, error: "Nie znaleziono książki." };
  if (book.ownership_status === "wishlist" && readingStatus !== "unread") {
    return { ok: false, error: "Status czytania dotyczy tylko posiadanych książek." };
  }

  const { data, error } = await supabase
    .from("library_books")
    .update({ reading_status: readingStatus, updated_at: new Date().toISOString() })
    .eq("id", bookId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Nie znaleziono książki." };
  return { ok: true, data: data as LibraryBook };
}

export async function createLoan(
  supabase: SupabaseServerClient,
  userId: string,
  bookId: string,
  input: LoanInput,
): Promise<LibraryServiceResult<LibraryLoan>> {
  const { data: book, error: fetchError } = await supabase
    .from("library_books")
    .select("ownership_status")
    .eq("id", bookId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) return { ok: false, error: fetchError.message };
  if (!book) return { ok: false, error: "Nie znaleziono książki." };
  if (book.ownership_status !== "owned") return { ok: false, error: "Wypożyczyć można tylko posiadaną książkę." };

  const existingActive = await getActiveLoanForBook(supabase, bookId);
  if (existingActive) {
    return { ok: false, error: "Ta książka jest już wypożyczona. Najpierw oznacz zwrot poprzedniego wypożyczenia." };
  }

  const { data, error } = await supabase
    .from("library_loans")
    .insert({ book_id: bookId, borrower_name: input.borrowerName, loaned_at: input.loanedAt, note: input.note })
    .select("*")
    .single();

  if (error) {
    // 23505 = unique_violation — wyścig dwóch równoległych prób wypożyczenia
    // tej samej książki. Baza i tak by to zablokowała (unikalny indeks
    // częściowy library_loans_one_active_per_book_idx, migracja 022), ten
    // catch tylko zamienia surowy kod błędu Postgresa na czytelny komunikat.
    if (error.code === "23505") return { ok: false, error: "Ta książka jest już wypożyczona." };
    return { ok: false, error: error.message };
  }
  return { ok: true, data: data as LibraryLoan };
}

export async function returnLoan(
  supabase: SupabaseServerClient,
  loanId: string,
  returnedAt: string,
): Promise<LibraryServiceResult<LibraryLoan>> {
  const { data, error } = await supabase
    .from("library_loans")
    .update({ returned_at: returnedAt, updated_at: new Date().toISOString() })
    .eq("id", loanId)
    .is("returned_at", null)
    .select("*")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Nie znaleziono aktywnego wypożyczenia." };
  return { ok: true, data: data as LibraryLoan };
}
