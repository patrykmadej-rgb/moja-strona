import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import LibraryExplorer from "@/components/lab/LibraryExplorer";
import { LIBRARY_COVERS_BUCKET, type LibraryBook, type LibraryLoan } from "@/lib/lab/library-types";

export const metadata: Metadata = {
  title: "Biblioteka",
};

const SIGNED_URL_TTL_SECONDS = 300;

export default async function BibliotekaPage() {
  const supabase = await createClient();

  // RLS (migracja 022) ogranicza wynik do wierszy zalogowanego użytkownika
  // — brak dodatkowego filtra .eq("user_id", ...) jest celowy i spójny
  // z resztą /lab (patrz np. schowek/page.tsx, artykuly/page.tsx).
  const { data: booksData } = await supabase.from("library_books").select("*").order("created_at", { ascending: false });

  const { data: loans } = await supabase.from("library_loans").select("*").order("loaned_at", { ascending: false });

  const books = (booksData as LibraryBook[] | null) ?? [];

  // Zakres 6 briefu: ręcznie wgrane okładki żyją w PRYWATNYM buckecie —
  // trwały URL nie istnieje, trzeba podpisać ścieżkę na krótko przy każdym
  // renderze. Jedno zbiorcze wywołanie (createSignedUrls) dla WSZYSTKICH
  // książek z cover_storage_path naraz, wzorem src/app/lab/artykuly/page.tsx
  // (podpisywanie najnowszych wersji artykułów) — nie N osobnych zapytań.
  // cover_storage_path ma pierwszeństwo przed cover_url (patrz komentarz w
  // library-types.ts) — jeśli podpisanie się nie uda, książka po prostu
  // pokazuje placeholder (LibraryCoverImage już to obsługuje), nigdy błąd.
  const storagePaths = books.map((b) => b.cover_storage_path).filter((p): p is string => Boolean(p));

  const signedUrlByPath = new Map<string, string>();
  if (storagePaths.length > 0) {
    const { data: signedUrls } = await supabase.storage.from(LIBRARY_COVERS_BUCKET).createSignedUrls(storagePaths, SIGNED_URL_TTL_SECONDS);
    for (const s of signedUrls ?? []) {
      if (s.path && s.signedUrl) signedUrlByPath.set(s.path, s.signedUrl);
    }
  }

  const booksWithResolvedCovers: LibraryBook[] = books.map((book) =>
    book.cover_storage_path
      ? { ...book, cover_url: signedUrlByPath.get(book.cover_storage_path) ?? null }
      : book,
  );

  return (
    <div className="min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <LibraryExplorer books={booksWithResolvedCovers} loans={(loans as LibraryLoan[] | null) ?? []} />
      </div>
    </div>
  );
}
