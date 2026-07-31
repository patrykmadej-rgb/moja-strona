"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createArticle(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Tytuł jest wymagany.");

  const language = String(formData.get("language") ?? "").trim() || null;
  const target_journal = String(formData.get("target_journal") ?? "").trim() || null;
  const discipline = String(formData.get("discipline") ?? "").trim() || null;
  const abstract = String(formData.get("abstract") ?? "").trim() || null;
  const keywords = String(formData.get("keywords") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const { data: article, error } = await supabase
    .from("articles")
    .insert({
      title,
      language,
      target_journal,
      discipline,
      abstract,
      keywords,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/lab/artykuly");
  redirect(`/lab/artykuly/${article.id}`);
}

export async function deleteArticle(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  const { data: versions } = await supabase
    .from("article_versions")
    .select("file_path")
    .eq("article_id", id);

  const paths = (versions ?? [])
    .map((v) => v.file_path)
    .filter((p): p is string => Boolean(p));

  if (paths.length > 0) {
    await supabase.storage.from("article-versions").remove(paths);
  }

  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/lab/artykuly");
}
