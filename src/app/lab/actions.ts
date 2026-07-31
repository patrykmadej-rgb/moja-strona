"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginLab(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/lab?error=${encodeURIComponent("Nieprawidłowy e-mail lub hasło.")}`);
  }

  redirect("/lab/artykuly");
}

export async function signOutLab() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/lab");
}
