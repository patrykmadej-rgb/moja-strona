"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateAlerts } from "@/lib/szkola/alertsEngine";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");
  return user.id;
}

export async function markAlertSeen(formData: FormData) {
  await requireUserId();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase.from("school_alerts").update({ status: "seen", updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/lab/szkola/alerty");
}

export async function resolveAlert(formData: FormData) {
  await requireUserId();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase
    .from("school_alerts")
    .update({ status: "resolved", resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/lab/szkola/alerty");
  revalidatePath("/lab/szkola");
}

export async function ignoreAlert(formData: FormData) {
  await requireUserId();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase.from("school_alerts").update({ status: "ignored", updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/lab/szkola/alerty");
  revalidatePath("/lab/szkola");
}

export async function refreshAlerts() {
  const userId = await requireUserId();
  const supabase = await createClient();
  const result = await generateAlerts(supabase, userId);
  revalidatePath("/lab/szkola/alerty");
  revalidatePath("/lab/szkola");
  return result;
}
