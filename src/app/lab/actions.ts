"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginLab(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // TYMCZASOWE DEBUGOWANIE — pokazuje surowy błąd Supabase ORAZ faktyczną
    // wartość NEXT_PUBLIC_SUPABASE_URL widzianą przez serwer w tym request,
    // żeby zdiagnozować "Invalid path specified in request URL". Wartość
    // URL nie jest sekretem (celowo publiczna), bezpiecznie ją pokazać.
    // Do usunięcia po zdiagnozowaniu.
    const seenUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    console.error("[lab login] Supabase signInWithPassword error:", {
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name,
      seenUrl,
    });
    redirect(
      `/lab?error=${encodeURIComponent(
        `DEBUG: ${error.message} (status: ${error.status}) | NEXT_PUBLIC_SUPABASE_URL widziany przez serwer: "${seenUrl}"`,
      )}`,
    );
  }

  redirect("/lab/artykuly");
}

export async function signOutLab() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/lab");
}
