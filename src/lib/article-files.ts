import { createClient } from "@/lib/supabase/client";

export const FILES_BUCKET = "article-files";
const SIGNED_URL_TTL_SECONDS = 60;
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export const ALLOWED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
] as const;

export type ArticleFile = {
  id: string;
  article_id: string;
  file_name: string;
  storage_path: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
};

export function validateFile(file: File): string | null {
  if (!ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])) {
    return "Ten typ pliku nie jest obsługiwany.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "Plik jest za duży, maksymalnie 20 MB.";
  }
  return null;
}

export async function listFiles(articleId: string): Promise<ArticleFile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("article_files")
    .select("*")
    .eq("article_id", articleId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as ArticleFile[] | null) ?? [];
}

export async function uploadFile(articleId: string, file: File): Promise<ArticleFile> {
  const validationError = validateFile(file);
  if (validationError) throw new Error(validationError);

  const supabase = createClient();
  const storagePath = `${articleId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(FILES_BUCKET)
    .upload(storagePath, file, { contentType: file.type || "application/octet-stream" });

  if (uploadError) throw new Error(uploadError.message);

  const { data, error: insertError } = await supabase
    .from("article_files")
    .insert({
      article_id: articleId,
      file_name: file.name,
      storage_path: storagePath,
      file_size: file.size,
      file_type: file.type || null,
    })
    .select()
    .single();

  if (insertError) {
    await supabase.storage.from(FILES_BUCKET).remove([storagePath]);
    throw new Error(insertError.message);
  }

  return data as ArticleFile;
}

export async function deleteFile(fileId: string, storagePath: string): Promise<void> {
  const supabase = createClient();

  const { error: storageError } = await supabase.storage.from(FILES_BUCKET).remove([storagePath]);
  if (storageError) throw new Error(storageError.message);

  const { error } = await supabase.from("article_files").delete().eq("id", fileId);
  if (error) throw new Error(error.message);
}

export async function getDownloadUrl(storagePath: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(FILES_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error) throw new Error(error.message);
  return data.signedUrl;
}
