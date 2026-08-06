"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateItinerary } from "@/lib/szkola/travelItinerary";
import { CURRENCIES, SEGMENT_DIRECTIONS, SEGMENT_STATUSES, SEGMENT_TYPES } from "@/lib/szkola/types";

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
 * Dodanie odcinka podróży z ogólnej zakładki /lab/szkola/podroze (sekcja 1
 * briefu) — session_id NIE jest wymagane na tym etapie (użytkownik najpierw
 * wpisuje realne dane podróży, dopasowanie do zjazdu przychodzi w drugim
 * kroku przez linkSegmentToSession/leave unlinked). Zwraca id, żeby
 * komponent kliencki mógł od razu policzyć sugestię i pokazać modal.
 */
export async function createTravelSegmentGeneral(formData: FormData): Promise<{ id: string }> {
  const supabase = await createClient();

  const segmentType = requireEnum(formData, "segment_type", SEGMENT_TYPES, "inne");
  const direction = String(formData.get("direction") ?? "");
  if (direction && !SEGMENT_DIRECTIONS.includes(direction as (typeof SEGMENT_DIRECTIONS)[number])) {
    throw new Error("Nieprawidłowy kierunek.");
  }
  const status = requireEnum(formData, "status", SEGMENT_STATUSES, "do_zakupu");
  const currency = parseCurrency(formData);
  const price = parseOptionalAmount(formData, "price");

  const { data, error } = await supabase
    .from("travel_segments")
    .insert({
      itinerary_id: null,
      session_id: null,
      segment_type: segmentType,
      direction: direction || null,
      departure_date: optionalString(formData, "departure_date"),
      departure_time: optionalString(formData, "departure_time"),
      arrival_date: optionalString(formData, "arrival_date"),
      arrival_time: optionalString(formData, "arrival_time"),
      departure_place: optionalString(formData, "departure_place"),
      arrival_place: optionalString(formData, "arrival_place"),
      carrier: optionalString(formData, "carrier"),
      transport_number: optionalString(formData, "transport_number"),
      reservation_number: optionalString(formData, "reservation_number"),
      seat: optionalString(formData, "seat"),
      baggage: optionalString(formData, "baggage"),
      price,
      currency,
      status,
      link: optionalString(formData, "link"),
      notes: optionalString(formData, "notes"),
      sort_order: 0,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/podroze");
  return { id: data.id as string };
}

export async function updateTravelSegmentGeneral(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Brak identyfikatora odcinka.");

  const segmentType = requireEnum(formData, "segment_type", SEGMENT_TYPES, "inne");
  const direction = String(formData.get("direction") ?? "");
  if (direction && !SEGMENT_DIRECTIONS.includes(direction as (typeof SEGMENT_DIRECTIONS)[number])) {
    throw new Error("Nieprawidłowy kierunek.");
  }
  const status = requireEnum(formData, "status", SEGMENT_STATUSES, "do_zakupu");
  const currency = parseCurrency(formData);
  const price = parseOptionalAmount(formData, "price");

  const { data: existing, error: existingError } = await supabase
    .from("travel_segments")
    .select("session_id")
    .eq("id", id)
    .single();
  if (existingError) throw new Error(existingError.message);

  const { error } = await supabase
    .from("travel_segments")
    .update({
      segment_type: segmentType,
      direction: direction || null,
      departure_date: optionalString(formData, "departure_date"),
      departure_time: optionalString(formData, "departure_time"),
      arrival_date: optionalString(formData, "arrival_date"),
      arrival_time: optionalString(formData, "arrival_time"),
      departure_place: optionalString(formData, "departure_place"),
      arrival_place: optionalString(formData, "arrival_place"),
      carrier: optionalString(formData, "carrier"),
      transport_number: optionalString(formData, "transport_number"),
      reservation_number: optionalString(formData, "reservation_number"),
      seat: optionalString(formData, "seat"),
      baggage: optionalString(formData, "baggage"),
      price,
      currency,
      status,
      link: optionalString(formData, "link"),
      notes: optionalString(formData, "notes"),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/podroze");
  if (existing.session_id) revalidatePath(`/lab/szkola/zjazdy/${existing.session_id}`);
}

export async function deleteTravelSegmentGeneral(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Brak identyfikatora odcinka.");

  const { data: existing } = await supabase.from("travel_segments").select("session_id").eq("id", id).maybeSingle();

  const { error } = await supabase.from("travel_segments").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/podroze");
  if (existing?.session_id) revalidatePath(`/lab/szkola/zjazdy/${existing.session_id}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}

/**
 * Zatwierdzenie powiązania (sekcja 9/11 briefu) — aktualizuje ISTNIEJĄCY
 * rekord (session_id + itinerary_id, get-or-create, żeby odcinek pozostał
 * widoczny też w istniejącej ścieżce zakładki Podróże danego zjazdu, która
 * czyta przez itinerary_id bez zmian). Nigdy nie tworzy nowego rekordu.
 */
export async function linkSegmentToSession(segmentId: string, sessionId: string) {
  const supabase = await createClient();
  const itineraryId = await getOrCreateItinerary(supabase, sessionId);

  const { error } = await supabase
    .from("travel_segments")
    .update({ session_id: sessionId, itinerary_id: itineraryId })
    .eq("id", segmentId);
  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/podroze");
  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}

/** Usuwa WYŁĄCZNIE relację ze zjazdem (sekcja 11 briefu) — rekord, dokument i koszt zostają nietknięte. */
export async function unlinkSegmentFromSession(segmentId: string, previousSessionId: string | null) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("travel_segments")
    .update({ session_id: null, itinerary_id: null })
    .eq("id", segmentId);
  if (error) throw new Error(error.message);

  revalidatePath("/lab/szkola/podroze");
  if (previousSessionId) revalidatePath(`/lab/szkola/zjazdy/${previousSessionId}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}
