"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SESSION_CHECKLIST } from "@/lib/szkola/types";

export async function createSession(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Tytuł zjazdu jest wymagany.");

  const start_date = String(formData.get("start_date") ?? "");
  if (!start_date) throw new Error("Data rozpoczęcia jest wymagana.");

  const sessionNumberRaw = String(formData.get("session_number") ?? "").trim();

  const { data: session, error } = await supabase
    .from("school_sessions")
    .insert({
      title,
      session_number: sessionNumberRaw ? Number(sessionNumberRaw) : null,
      topic: String(formData.get("topic") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
      venue: String(formData.get("venue") ?? "").trim() || null,
      start_date,
      end_date: String(formData.get("end_date") ?? "").trim() || null,
      lead_trainer: String(formData.get("lead_trainer") ?? "").trim() || null,
      training_year: String(formData.get("training_year") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const { error: tasksError } = await supabase.from("session_tasks").insert(
    DEFAULT_SESSION_CHECKLIST.map((taskTitle, index) => ({
      session_id: session.id,
      title: taskTitle,
      sort_order: index,
    })),
  );
  if (tasksError) throw new Error(tasksError.message);

  revalidatePath("/lab/szkola");
  revalidatePath("/lab/szkola/zjazdy");
  redirect(`/lab/szkola/zjazdy/${session.id}`);
}

export async function deleteSession(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase.from("school_sessions").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola");
  revalidatePath("/lab/szkola/zjazdy");
}
