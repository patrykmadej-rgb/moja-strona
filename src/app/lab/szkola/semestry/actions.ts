"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CURRENCIES, PAYMENT_STATUSES } from "@/lib/szkola/types";

function optionalString(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function parseOptionalAmount(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  if (Number.isNaN(value) || value < 0) throw new Error("Nieprawidłowa kwota.");
  return value;
}

function parseCurrency(formData: FormData): string {
  const value = String(formData.get("currency") ?? "PLN");
  if (!CURRENCIES.includes(value as (typeof CURRENCIES)[number])) {
    throw new Error("Nieprawidłowa waluta.");
  }
  return value;
}

function parsePaymentStatus(formData: FormData): string {
  const value = String(formData.get("payment_status") ?? "do_zaplaty");
  if (!PAYMENT_STATUSES.includes(value as (typeof PAYMENT_STATUSES)[number])) {
    throw new Error("Nieprawidłowy status płatności.");
  }
  return value;
}

export async function createSemester(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nazwa semestru jest wymagana.");

  const start_date = String(formData.get("start_date") ?? "");
  if (!start_date) throw new Error("Data rozpoczęcia semestru jest wymagana.");

  const { error } = await supabase.from("school_semesters").insert({
    name,
    start_date,
    end_date: optionalString(formData, "end_date"),
    payment_due_date: optionalString(formData, "payment_due_date"),
    amount: parseOptionalAmount(formData, "amount"),
    currency: parseCurrency(formData),
    payment_status: parsePaymentStatus(formData),
    paid_at: optionalString(formData, "paid_at"),
    notes: optionalString(formData, "notes"),
    created_by: user.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/semestry");
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}

export async function updateSemester(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Brak identyfikatora semestru.");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nazwa semestru jest wymagana.");

  const start_date = String(formData.get("start_date") ?? "");
  if (!start_date) throw new Error("Data rozpoczęcia semestru jest wymagana.");

  const { error } = await supabase
    .from("school_semesters")
    .update({
      name,
      start_date,
      end_date: optionalString(formData, "end_date"),
      payment_due_date: optionalString(formData, "payment_due_date"),
      amount: parseOptionalAmount(formData, "amount"),
      currency: parseCurrency(formData),
      payment_status: parsePaymentStatus(formData),
      paid_at: optionalString(formData, "paid_at"),
      notes: optionalString(formData, "notes"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/semestry");
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}

/**
 * school_sessions.semester_id ma "on delete set null" (migracja 019) — usunięcie
 * semestru jest więc bezpieczne, zjazdy tylko tracą przypisanie (status płatności
 * wraca do "brak danych"), nic nie jest kasowane kaskadowo.
 */
export async function deleteSemester(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Brak identyfikatora semestru.");

  const { error } = await supabase.from("school_semesters").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/semestry");
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}
