"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sanitizeStorageFilename } from "@/lib/storageFilename";

const BUCKET = "documents";

export async function createIdea(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const file = formData.get("file");

  if (!title) throw new Error("Tytuł jest wymagany.");

  const { data: idea, error } = await supabase
    .from("article_ideas")
    .insert({ user_id: user.id, title, description: description || null, tags })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (file instanceof File && file.size > 0) {
    const path = `${user.id}/ideas/${idea.id}-${sanitizeStorageFilename(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || "application/pdf" });

    if (uploadError) throw new Error(uploadError.message);

    const { error: updateError } = await supabase
      .from("article_ideas")
      .update({ pdf_path: path })
      .eq("id", idea.id);

    if (updateError) throw new Error(updateError.message);
  }

  revalidatePath("/panel/pomysly");
}

export async function deleteIdea(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const pdfPath = String(formData.get("pdf_path") ?? "");

  if (pdfPath) {
    await supabase.storage.from(BUCKET).remove([pdfPath]);
  }

  const { error } = await supabase.from("article_ideas").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/panel/pomysly");
}
