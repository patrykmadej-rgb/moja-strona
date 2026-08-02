import { createClient } from "@/lib/supabase/client";
import { sanitizeStorageFilename } from "@/lib/storageFilename";
import type { ArticleVersion } from "@/lib/lab/types";

/**
 * Upload wersji artykułu z przeglądarki bezpośrednio do Storage (nie przez
 * Server Action) — ten sam powód co materialsStorage.ts/documentsStorage.ts:
 * Server Actions mają domyślny limit rozmiaru body (1 MB w Next.js), więc
 * większe pliki (typowy .docx/.pdf artykułu) kończyły się błędem sieci
 * ("strona nie może zostać załadowana") zamiast czytelnym komunikatem.
 */

export const VERSIONS_BUCKET = "article-versions";
const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024;

export const ALLOWED_VERSION_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export function validateVersionFile(file: File): string | null {
  if (!ALLOWED_VERSION_FILE_TYPES.includes(file.type as (typeof ALLOWED_VERSION_FILE_TYPES)[number])) {
    return "Ten typ pliku nie jest obsługiwany. Dozwolone: DOCX, PDF.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "Plik jest za duży, maksymalnie 30 MB.";
  }
  return null;
}

export async function uploadArticleVersion(
  articleId: string,
  file: File,
  notes: string | null,
): Promise<ArticleVersion> {
  const validationError = validateVersionFile(file);
  if (validationError) throw new Error(validationError);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");

  const { data: maxRow } = await supabase
    .from("article_versions")
    .select("version_number")
    .eq("article_id", articleId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const versionNumber = (maxRow?.version_number ?? 0) + 1;
  const storagePath = `${articleId}/${versionNumber}_${sanitizeStorageFilename(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(VERSIONS_BUCKET)
    .upload(storagePath, file, { contentType: file.type || "application/octet-stream" });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error: insertError } = await supabase
    .from("article_versions")
    .insert({
      article_id: articleId,
      version_number: versionNumber,
      file_path: storagePath,
      file_name: file.name,
      file_size_bytes: file.size,
      notes,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    await supabase.storage.from(VERSIONS_BUCKET).remove([storagePath]);
    throw new Error(insertError.message);
  }

  await supabase.from("articles").update({ updated_at: new Date().toISOString() }).eq("id", articleId);

  return data as ArticleVersion;
}

export async function getArticleVersionDownloadUrl(storagePath: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from(VERSIONS_BUCKET).createSignedUrl(storagePath, 300);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
