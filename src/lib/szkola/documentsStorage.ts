import { createClient } from "@/lib/supabase/client";
import type { DocumentType, RelatedEntityType, SessionDocument } from "@/lib/szkola/types";

export const DOCUMENTS_BUCKET = "school-documents";
const SIGNED_URL_TTL_SECONDS = 60;
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export const ALLOWED_DOCUMENT_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function validateDocumentFile(file: File): string | null {
  if (!ALLOWED_DOCUMENT_FILE_TYPES.includes(file.type as (typeof ALLOWED_DOCUMENT_FILE_TYPES)[number])) {
    return "Ten typ pliku nie jest obsługiwany. Dozwolone: PDF, JPG, PNG, WEBP.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "Plik jest za duży, maksymalnie 20 MB.";
  }
  return null;
}

export async function uploadDocumentFile(
  sessionId: string,
  file: File,
  meta: {
    docType: DocumentType;
    title?: string;
    documentDate?: string | null;
    relatedEntityType?: RelatedEntityType | null;
    relatedEntityId?: string | null;
  },
): Promise<SessionDocument> {
  const validationError = validateDocumentFile(file);
  if (validationError) throw new Error(validationError);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");

  const storagePath = `${user.id}/${sessionId}/documents/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, file, { contentType: file.type || "application/octet-stream" });

  if (uploadError) throw new Error(uploadError.message);

  const { data, error: insertError } = await supabase
    .from("session_documents")
    .insert({
      session_id: sessionId,
      name: file.name,
      title: meta.title || file.name,
      doc_type: meta.docType,
      document_date: meta.documentDate || null,
      storage_path: storagePath,
      file_size: file.size,
      mime_type: file.type || null,
      related_entity_type: meta.relatedEntityType ?? null,
      related_entity_id: meta.relatedEntityId ?? null,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
    throw new Error(insertError.message);
  }

  return data as SessionDocument;
}

export async function deleteDocumentFile(documentId: string, storagePath: string | null): Promise<void> {
  const supabase = createClient();

  if (storagePath) {
    const { error: storageError } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
    if (storageError) throw new Error(storageError.message);
  }

  const { error } = await supabase.from("session_documents").delete().eq("id", documentId);
  if (error) throw new Error(error.message);
}

export async function getDocumentDownloadUrl(storagePath: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error) throw new Error(error.message);
  return data.signedUrl;
}
