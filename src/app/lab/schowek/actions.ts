"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionError = { error: string; field?: "title" | "content" };

/**
 * Błąd zwrócony jako wartość (nie rzucony) — Next.js w buildzie produkcyjnym
 * zamienia treść RZUCONYCH wyjątków z akcji serwerowych na ogólny komunikat,
 * więc konkretna przyczyna byłaby niewidoczna dla użytkownika (ten sam wzorzec
 * i uzasadnienie co w src/app/lab/artykuly/[id]/actions.ts).
 */
export async function createClipboardItem(formData: FormData): Promise<ActionError | undefined> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Brak autoryzacji." };

    const title = String(formData.get("title") ?? "").trim();
    if (!title) return { error: "Nazwa jest wymagana.", field: "title" };

    const content = String(formData.get("content") ?? "").trim();
    if (!content) return { error: "Treść jest wymagana.", field: "content" };

    const category = String(formData.get("category") ?? "").trim() || null;
    const language = String(formData.get("language") ?? "").trim() || null;

    const { error } = await supabase.from("clipboard_items").insert({
      user_id: user.id,
      title,
      category,
      language,
      content,
    });

    if (error) throw new Error(error.message);

    revalidatePath("/lab/schowek");
    return undefined;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Nie udało się dodać tekstu." };
  }
}

export async function updateClipboardItem(formData: FormData): Promise<ActionError | undefined> {
  try {
    const supabase = await createClient();
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Brak identyfikatora wpisu." };

    const title = String(formData.get("title") ?? "").trim();
    if (!title) return { error: "Nazwa jest wymagana.", field: "title" };

    const content = String(formData.get("content") ?? "").trim();
    if (!content) return { error: "Treść jest wymagana.", field: "content" };

    const category = String(formData.get("category") ?? "").trim() || null;
    const language = String(formData.get("language") ?? "").trim() || null;

    const { error } = await supabase
      .from("clipboard_items")
      .update({
        title,
        category,
        language,
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/lab/schowek");
    return undefined;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Nie udało się zapisać zmian." };
  }
}

export async function deleteClipboardItem(formData: FormData): Promise<ActionError | undefined> {
  try {
    const supabase = await createClient();
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Brak identyfikatora wpisu." };

    const { error } = await supabase.from("clipboard_items").delete().eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/lab/schowek");
    return undefined;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Nie udało się usunąć wpisu." };
  }
}
