"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function requireString(formData: FormData, key: string, errorMessage: string): string {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(errorMessage);
  return value;
}

function parseAmount(formData: FormData, key: string, errorMessage: string): number {
  const raw = String(formData.get(key) ?? "").trim();
  const value = Number(raw);
  if (!raw || Number.isNaN(value) || value < 0) throw new Error(errorMessage);
  return value;
}

export async function updateHourRequirement(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Brak identyfikatora wymagania.");

  const requiredHours = parseAmount(
    formData,
    "required_hours",
    "Liczba wymaganych godzin jest wymagana i musi być nieujemna.",
  );
  const label = requireString(formData, "label", "Etykieta jest wymagana.");

  const { error } = await supabase
    .from("training_hour_requirements")
    .update({
      required_hours: requiredHours,
      label,
      active: formData.get("active") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/godziny");
}
