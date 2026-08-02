import { createClient } from "@/lib/supabase/client";
import { sanitizeStorageFilename } from "@/lib/storageFilename";
import type { MaterialCategory, SessionMaterial } from "@/lib/szkola/types";

export const MATERIALS_BUCKET = "school-materials";
const SIGNED_URL_TTL_SECONDS = 60;
const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024;

export const ALLOWED_MATERIAL_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
] as const;

export function validateMaterialFile(file: File): string | null {
  if (!ALLOWED_MATERIAL_FILE_TYPES.includes(file.type as (typeof ALLOWED_MATERIAL_FILE_TYPES)[number])) {
    return "Ten typ pliku nie jest obsługiwany.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "Plik jest za duży, maksymalnie 30 MB.";
  }
  return null;
}

export async function uploadMaterialFile(
  sessionId: string,
  file: File,
  meta: { category?: MaterialCategory | null; folder?: string | null } = {},
): Promise<SessionMaterial> {
  const validationError = validateMaterialFile(file);
  if (validationError) throw new Error(validationError);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");

  const storagePath = `${user.id}/${sessionId}/materials/${Date.now()}-${sanitizeStorageFilename(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(MATERIALS_BUCKET)
    .upload(storagePath, file, { contentType: file.type || "application/octet-stream" });

  if (uploadError) throw new Error(uploadError.message);

  const { data, error: insertError } = await supabase
    .from("session_materials")
    .insert({
      session_id: sessionId,
      name: file.name,
      file_type: file.type || null,
      storage_path: storagePath,
      file_size: file.size,
      material_type: "plik",
      title: file.name,
      category: meta.category ?? null,
      folder: meta.folder ?? null,
      added_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    await supabase.storage.from(MATERIALS_BUCKET).remove([storagePath]);
    throw new Error(insertError.message);
  }

  return data as SessionMaterial;
}

/** Dodaje materiał bez pliku: link zewnętrzny albo luźną notatkę własną. */
export async function addMaterialEntry(
  sessionId: string,
  input: {
    materialType: "link" | "notatka";
    title: string;
    externalLink?: string;
    description?: string;
    category?: MaterialCategory | null;
  },
): Promise<SessionMaterial> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");

  const { data, error } = await supabase
    .from("session_materials")
    .insert({
      session_id: sessionId,
      name: input.title,
      title: input.title,
      material_type: input.materialType,
      external_link: input.materialType === "link" ? input.externalLink || null : null,
      description: input.description || null,
      category: input.category ?? null,
      added_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as SessionMaterial;
}

export async function deleteMaterialFile(materialId: string, storagePath: string | null): Promise<void> {
  const supabase = createClient();

  if (storagePath) {
    const { error: storageError } = await supabase.storage.from(MATERIALS_BUCKET).remove([storagePath]);
    if (storageError) throw new Error(storageError.message);
  }

  const { error } = await supabase.from("session_materials").delete().eq("id", materialId);
  if (error) throw new Error(error.message);
}

export async function getMaterialDownloadUrl(storagePath: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(MATERIALS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error) throw new Error(error.message);
  return data.signedUrl;
}
