import { createClient } from "@/lib/supabase/client";
import { sanitizeStorageFilename } from "@/lib/storageFilename";

/**
 * Upload plików do skrzynki importu — osobny, prywatny bucket school-imports
 * (nie school-documents/school-materials — inny cykl życia: surowe importy
 * czekające na weryfikację, mogą zostać odrzucone). Ścieżka:
 * "{user_id}/imports/{rok}/{miesiąc}/{timestamp}-{filename}".
 *
 * Klient przeglądarki (nie Server Action) — ten sam powód co
 * materialsStorage.ts/documentsStorage.ts: ominięcie domyślnego limitu
 * rozmiaru body Server Actions w Next.js.
 */

export const IMPORTS_BUCKET = "school-imports";
const SIGNED_URL_TTL_SECONDS = 60;
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const ALLOWED_IMPORT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "message/rfc822",
] as const;

function resolveMimeType(file: File): string {
  if (file.name.toLowerCase().endsWith(".eml")) return "message/rfc822";
  return file.type || "application/octet-stream";
}

export function validateImportFile(file: File): string | null {
  const mimeType = resolveMimeType(file);
  if (!ALLOWED_IMPORT_MIME_TYPES.includes(mimeType as (typeof ALLOWED_IMPORT_MIME_TYPES)[number])) {
    return "Ten typ pliku nie jest obsługiwany. Dozwolone: PDF, JPG, PNG, WEBP, DOCX, TXT, EML.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "Plik jest za duży, maksymalnie 25 MB.";
  }
  return null;
}

export async function uploadImportFile(file: File): Promise<{ storagePath: string; mimeType: string }> {
  const validationError = validateImportFile(file);
  if (validationError) throw new Error(validationError);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const mimeType = resolveMimeType(file);
  const storagePath = `${user.id}/imports/${year}/${month}/${Date.now()}-${sanitizeStorageFilename(file.name)}`;

  const { error } = await supabase.storage.from(IMPORTS_BUCKET).upload(storagePath, file, { contentType: mimeType });
  if (error) throw new Error(error.message);

  return { storagePath, mimeType };
}

export async function getImportDownloadUrl(storagePath: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from(IMPORTS_BUCKET).createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function deleteImportFile(storagePath: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(IMPORTS_BUCKET).remove([storagePath]);
  if (error) throw new Error(error.message);
}
