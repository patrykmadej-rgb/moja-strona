import { createClient } from "@/lib/supabase/client";
import { LIBRARY_COVERS_BUCKET } from "@/lib/lab/library-types";

/**
 * Upload własnej okładki książki (zakres 6 briefu) — z przeglądarki
 * bezpośrednio do Storage, ten sam powód co articleVersionsStorage.ts/
 * documentsStorage.ts/materialsStorage.ts: Server Actions mają domyślny
 * limit rozmiaru body (1 MB w Next.js), zdjęcie okładki (nawet po
 * kompresji przez prepareImageForUpload, cel ~3.5 MB) by go przekroczyło.
 *
 * Bucket prywatny (migracja 024, wzorem article-versions/school-materials/
 * school-documents) — RLS wymaga, żeby pierwszy segment ścieżki był równy
 * auth.uid() właściciela, więc URL do odczytu NIE jest trwały: trzeba go
 * wygenerować (createSignedUrl, 300s) przy każdym renderze — patrz
 * getLibraryCoverSignedUrl, wywoływane po stronie serwera w
 * src/app/lab/biblioteka/page.tsx, tak samo jak article_versions.file_path.
 */
const MAX_COVER_BYTES = 4 * 1024 * 1024;

export async function uploadLibraryCover(bookId: string, blob: Blob): Promise<string> {
  if (blob.size > MAX_COVER_BYTES) {
    throw new Error("Zdjęcie jest za duże (limit 4 MB).");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");

  const storagePath = `${user.id}/${bookId}-${Date.now()}.jpg`;

  const { error } = await supabase.storage.from(LIBRARY_COVERS_BUCKET).upload(storagePath, blob, { contentType: "image/jpeg" });
  if (error) throw new Error(error.message);

  return storagePath;
}

/** Best-effort — brak pliku (już usunięty, literówka w ścieżce po ręcznej migracji) nigdy nie blokuje zmiany okładki w bazie. */
export async function deleteLibraryCover(storagePath: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from(LIBRARY_COVERS_BUCKET).remove([storagePath]);
}

// Odczyt (podpisany URL) NIE ma tu osobnej funkcji — rozwiązywany zbiorczo,
// server-side, wzorem src/app/lab/artykuly/page.tsx (createSignedUrls dla
// WSZYSTKICH okładek jednym wywołaniem), bezpośrednio w
// src/app/lab/biblioteka/page.tsx.
