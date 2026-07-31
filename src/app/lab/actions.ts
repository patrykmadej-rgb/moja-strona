"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginLab(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // TYMCZASOWE DEBUGOWANIE — pokazuje surowy błąd Supabase zamiast
    // generycznego komunikatu, żeby zdiagnozować "niepoprawne hasło" mimo
    // poprawnych danych. Do usunięcia po zdiagnozowaniu.
    console.error("[lab login] Supabase signInWithPassword error:", {
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name,
    });
    redirect(`/lab?error=${encodeURIComponent(`DEBUG: ${error.message} (status: ${error.status}, code: ${error.code})`)}`);
  }

  redirect("/lab/artykuly");
}

export async function signOutLab() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/lab");
}
