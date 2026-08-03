"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ARTICLE_STATUSES, DISCIPLINES, LANGUAGES, type ArticleStatus, type Discipline, type LanguageCode } from "@/lib/lab/types";

function parseDisciplines(formData: FormData): Discipline[] | { error: string } {
  const raw = formData.getAll("disciplines").map((v) => String(v));
  const unique = Array.from(new Set(raw));
  for (const value of unique) {
    if (!DISCIPLINES.includes(value as Discipline)) {
      return { error: "Nieprawidłowa dyscyplina." };
    }
  }
  if (unique.length === 0) {
    return { error: "Wybierz przynajmniej jedną dyscyplinę." };
  }
  return unique as Discipline[];
}

/**
 * Zwraca błąd jako wartość zamiast go rzucać (patrz updateArticle w
 * [id]/actions.ts) — inaczej Next.js w produkcji zamienia treść błędu na
 * ogólny, nieczytelny komunikat. redirect() jest wywoływane wyłącznie po
 * udanym zapisie, poza jakimkolwiek try/catch — redirect() działa przez
 * rzucenie specjalnego, wewnętrznego sygnału Next.js, który nie może
 * zostać przechwycony jako zwykły błąd.
 */
export async function createArticle(formData: FormData): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Brak autoryzacji." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Tytuł jest wymagany." };

  const language_code = String(formData.get("language_code") ?? "");
  if (!LANGUAGES.includes(language_code as LanguageCode)) {
    return { error: "Język jest wymagany." };
  }

  const disciplinesResult = parseDisciplines(formData);
  if (!Array.isArray(disciplinesResult)) return disciplinesResult;
  const disciplines = disciplinesResult;

  const statusInput = String(formData.get("status") ?? "");
  const status: ArticleStatus = ARTICLE_STATUSES.includes(statusInput as ArticleStatus)
    ? (statusInput as ArticleStatus)
    : ARTICLE_STATUSES[0];

  const target_journal = String(formData.get("target_journal") ?? "").trim() || null;
  const abstract = String(formData.get("abstract") ?? "").trim() || null;
  const keywords = String(formData.get("keywords") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const { data: article, error } = await supabase
    .from("articles")
    .insert({
      title,
      status,
      language_code,
      target_journal,
      disciplines,
      abstract,
      keywords,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

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
