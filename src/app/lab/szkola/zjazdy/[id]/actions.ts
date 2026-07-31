"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SESSION_STATUSES, TASK_PRIORITIES } from "@/lib/szkola/types";

function requireSessionId(formData: FormData): string {
  const id = String(formData.get("session_id") ?? "");
  if (!id) throw new Error("Brak identyfikatora zjazdu.");
  return id;
}

export async function updateSession(formData: FormData) {
  const supabase = await createClient();
  const id = requireSessionId(formData);

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Tytuł zjazdu jest wymagany.");

  const start_date = String(formData.get("start_date") ?? "");
  if (!start_date) throw new Error("Data rozpoczęcia jest wymagana.");

  const status = String(formData.get("status") ?? "do_zaplanowania");
  if (!SESSION_STATUSES.includes(status as (typeof SESSION_STATUSES)[number])) {
    throw new Error("Nieprawidłowy status.");
  }

  const sessionNumberRaw = String(formData.get("session_number") ?? "").trim();

  const { error } = await supabase
    .from("school_sessions")
    .update({
      title,
      session_number: sessionNumberRaw ? Number(sessionNumberRaw) : null,
      topic: String(formData.get("topic") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
      venue: String(formData.get("venue") ?? "").trim() || null,
      start_date,
      end_date: String(formData.get("end_date") ?? "").trim() || null,
      lead_trainer: String(formData.get("lead_trainer") ?? "").trim() || null,
      status,
      training_year: String(formData.get("training_year") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${id}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}

export async function addTask(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Treść zadania jest wymagana.");

  const priority = String(formData.get("priority") ?? "normalny");
  if (!TASK_PRIORITIES.includes(priority as (typeof TASK_PRIORITIES)[number])) {
    throw new Error("Nieprawidłowy priorytet.");
  }

  const { data: maxRow } = await supabase
    .from("session_tasks")
    .select("sort_order")
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("session_tasks").insert({
    session_id: sessionId,
    title,
    priority,
    due_date: String(formData.get("due_date") ?? "").trim() || null,
    sort_order: (maxRow?.sort_order ?? -1) + 1,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}

export async function toggleTask(sessionId: string, taskId: string, isDone: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("session_tasks").update({ is_done: isDone }).eq("id", taskId);
  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}

export async function deleteTask(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);
  const taskId = String(formData.get("id") ?? "");

  const { error } = await supabase.from("session_tasks").delete().eq("id", taskId);
  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}
