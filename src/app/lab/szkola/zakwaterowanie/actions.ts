"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ACCOMMODATION_STATUSES, CURRENCIES } from "@/lib/szkola/types";

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
  if (!CURRENCIES.includes(value as (typeof CURRENCIES)[number])) throw new Error("Nieprawidłowa waluta.");
  return value;
}

function requireEnum<T extends string>(formData: FormData, key: string, allowed: readonly T[], fallback: T): T {
  const value = String(formData.get(key) ?? fallback) as T;
  if (!allowed.includes(value)) throw new Error(`Nieprawidłowa wartość pola ${key}.`);
  return value;
}

/**
 * Dodanie zakwaterowania z ogólnej zakładki /lab/szkola/zakwaterowanie
 * (sekcja 1/3 briefu) — session_id NIE jest wymagane na tym etapie.
 * Zwraca id, żeby komponent kliencki mógł od razu policzyć sugestię zjazdu.
 */
export async function createAccommodationGeneral(formData: FormData): Promise<{ id: string }> {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nazwa obiektu jest wymagana.");
  const paymentStatus = requireEnum(formData, "payment_status", ACCOMMODATION_STATUSES, "do_znalezienia");
  const currency = parseCurrency(formData);
  const price = parseOptionalAmount(formData, "price");

  const { data, error } = await supabase
    .from("accommodations")
    .insert({
      session_id: null,
      name,
      address: optionalString(formData, "address"),
      city: optionalString(formData, "city"),
      check_in: optionalString(formData, "check_in"),
      check_out: optionalString(formData, "check_out"),
      price,
      currency,
      payment_status: paymentStatus,
      reservation_number: optionalString(formData, "reservation_number"),
      cancellation_policy: optionalString(formData, "cancellation_policy"),
      free_cancellation_until: optionalString(formData, "free_cancellation_until"),
      breakfast_included: formData.get("breakfast_included") === "on",
      distance_to_venue: optionalString(formData, "distance_to_venue"),
      travel_time_to_venue: optionalString(formData, "travel_time_to_venue"),
      link: optionalString(formData, "link"),
      notes: optionalString(formData, "notes"),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/zakwaterowanie");
  return { id: data.id as string };
}

export async function updateAccommodationGeneral(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Brak identyfikatora noclegu.");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nazwa obiektu jest wymagana.");
  const paymentStatus = requireEnum(formData, "payment_status", ACCOMMODATION_STATUSES, "do_znalezienia");
  const currency = parseCurrency(formData);
  const price = parseOptionalAmount(formData, "price");

  const { data: existing, error: existingError } = await supabase
    .from("accommodations")
    .select("session_id")
    .eq("id", id)
    .single();
  if (existingError) throw new Error(existingError.message);

  const { error } = await supabase
    .from("accommodations")
    .update({
      name,
      address: optionalString(formData, "address"),
      city: optionalString(formData, "city"),
      check_in: optionalString(formData, "check_in"),
      check_out: optionalString(formData, "check_out"),
      price,
      currency,
      payment_status: paymentStatus,
      reservation_number: optionalString(formData, "reservation_number"),
      cancellation_policy: optionalString(formData, "cancellation_policy"),
      free_cancellation_until: optionalString(formData, "free_cancellation_until"),
      breakfast_included: formData.get("breakfast_included") === "on",
      distance_to_venue: optionalString(formData, "distance_to_venue"),
      travel_time_to_venue: optionalString(formData, "travel_time_to_venue"),
      link: optionalString(formData, "link"),
      notes: optionalString(formData, "notes"),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/zakwaterowanie");
  if (existing.session_id) revalidatePath(`/lab/szkola/zjazdy/${existing.session_id}`);
}

export async function deleteAccommodationGeneral(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Brak identyfikatora noclegu.");

  const { data: existing } = await supabase.from("accommodations").select("session_id").eq("id", id).maybeSingle();

  const { error } = await supabase.from("accommodations").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/zakwaterowanie");
  if (existing?.session_id) revalidatePath(`/lab/szkola/zjazdy/${existing.session_id}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}

/** Zatwierdzenie powiązania (sekcja 9/11 briefu) — aktualizuje ISTNIEJĄCY rekord, nigdy nie tworzy nowego. */
export async function linkAccommodationToSession(accommodationId: string, sessionId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("accommodations").update({ session_id: sessionId }).eq("id", accommodationId);
  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/zakwaterowanie");
  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}

/** Usuwa WYŁĄCZNIE relację ze zjazdem (sekcja 11 briefu) — rekord, dokument i koszt zostają nietknięte. */
export async function unlinkAccommodationFromSession(accommodationId: string, previousSessionId: string | null) {
  const supabase = await createClient();

  const { error } = await supabase.from("accommodations").update({ session_id: null }).eq("id", accommodationId);
  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/zakwaterowanie");
  if (previousSessionId) revalidatePath(`/lab/szkola/zjazdy/${previousSessionId}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}
