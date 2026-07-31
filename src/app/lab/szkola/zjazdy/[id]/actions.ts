"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ACCOMMODATION_STATUSES,
  CURRENCIES,
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  PAYMENT_CATEGORIES,
  PAYMENT_STATUSES,
  SEGMENT_DIRECTIONS,
  SEGMENT_STATUSES,
  SEGMENT_TYPES,
  SESSION_STATUSES,
  TASK_PRIORITIES,
} from "@/lib/szkola/types";

function requireSessionId(formData: FormData): string {
  const id = String(formData.get("session_id") ?? "");
  if (!id) throw new Error("Brak identyfikatora zjazdu.");
  return id;
}

function optionalString(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

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

function requireEnum<T extends string>(
  formData: FormData,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = String(formData.get(key) ?? fallback) as T;
  if (!allowed.includes(value)) throw new Error(`Nieprawidłowa wartość pola ${key}.`);
  return value;
}

async function getOrCreateItinerary(supabase: SupabaseClient, sessionId: string): Promise<string> {
  const { data: existing } = await supabase
    .from("travel_itineraries")
    .select("id")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data: created, error } = await supabase
    .from("travel_itineraries")
    .insert({ session_id: sessionId })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return created.id as string;
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
  const plannedBudgetRaw = String(formData.get("planned_budget") ?? "").trim();

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
      planned_budget: plannedBudgetRaw ? Number(plannedBudgetRaw) : null,
      planned_budget_currency: String(formData.get("planned_budget_currency") ?? "PLN"),
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

// --- Podróż (odcinki) ---

export async function addSegment(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);

  const segmentType = requireEnum(formData, "segment_type", SEGMENT_TYPES, "inne");
  const direction = String(formData.get("direction") ?? "");
  if (direction && !SEGMENT_DIRECTIONS.includes(direction as (typeof SEGMENT_DIRECTIONS)[number])) {
    throw new Error("Nieprawidłowy kierunek.");
  }
  const status = requireEnum(formData, "status", SEGMENT_STATUSES, "do_zakupu");
  const currency = parseCurrency(formData);
  const price = parseOptionalAmount(formData, "price");

  const itineraryId = await getOrCreateItinerary(supabase, sessionId);

  const { data: maxRow } = await supabase
    .from("travel_segments")
    .select("sort_order")
    .eq("itinerary_id", itineraryId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("travel_segments").insert({
    itinerary_id: itineraryId,
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
    sort_order: (maxRow?.sort_order ?? -1) + 1,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}

export async function updateSegment(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);
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
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}

export async function deleteSegment(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase.from("travel_segments").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}

// --- Zakwaterowanie ---

export async function addAccommodation(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);

  const name = requireString(formData, "name", "Nazwa obiektu jest wymagana.");
  const paymentStatus = requireEnum(formData, "payment_status", ACCOMMODATION_STATUSES, "do_znalezienia");
  const currency = parseCurrency(formData);
  const price = parseOptionalAmount(formData, "price");

  const { error } = await supabase.from("accommodations").insert({
    session_id: sessionId,
    name,
    address: optionalString(formData, "address"),
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
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}

export async function updateAccommodation(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Brak identyfikatora noclegu.");

  const name = requireString(formData, "name", "Nazwa obiektu jest wymagana.");
  const paymentStatus = requireEnum(formData, "payment_status", ACCOMMODATION_STATUSES, "do_znalezienia");
  const currency = parseCurrency(formData);
  const price = parseOptionalAmount(formData, "price");

  const { error } = await supabase
    .from("accommodations")
    .update({
      name,
      address: optionalString(formData, "address"),
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
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}

export async function deleteAccommodation(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase.from("accommodations").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}

// --- Płatności za szkołę ---

export async function addPayment(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);

  const category = requireEnum(formData, "category", PAYMENT_CATEGORIES, "oplata_za_zjazd");
  const status = requireEnum(formData, "status", PAYMENT_STATUSES, "do_zaplaty");
  const currency = parseCurrency(formData);
  const amount = parseAmount(formData, "amount", "Kwota jest wymagana i musi być nieujemna.");

  const { error } = await supabase.from("school_payments").insert({
    session_id: sessionId,
    category,
    amount,
    currency,
    due_date: optionalString(formData, "due_date"),
    paid_date: optionalString(formData, "paid_date"),
    status,
    payment_method: optionalString(formData, "payment_method"),
    document_number: optionalString(formData, "document_number"),
    notes: optionalString(formData, "notes"),
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}

export async function updatePayment(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Brak identyfikatora płatności.");

  const category = requireEnum(formData, "category", PAYMENT_CATEGORIES, "oplata_za_zjazd");
  const status = requireEnum(formData, "status", PAYMENT_STATUSES, "do_zaplaty");
  const currency = parseCurrency(formData);
  const amount = parseAmount(formData, "amount", "Kwota jest wymagana i musi być nieujemna.");

  const { error } = await supabase
    .from("school_payments")
    .update({
      category,
      amount,
      currency,
      due_date: optionalString(formData, "due_date"),
      paid_date: optionalString(formData, "paid_date"),
      status,
      payment_method: optionalString(formData, "payment_method"),
      document_number: optionalString(formData, "document_number"),
      notes: optionalString(formData, "notes"),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}

export async function deletePayment(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase.from("school_payments").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}

// --- Wydatki ---

export async function addExpense(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);

  const name = requireString(formData, "name", "Nazwa wydatku jest wymagana.");
  const category = requireEnum(formData, "category", EXPENSE_CATEGORIES, "inne");
  const status = requireEnum(formData, "status", EXPENSE_STATUSES, "zaplanowany");
  const currency = parseCurrency(formData);
  const amount = parseAmount(formData, "amount", "Kwota jest wymagana i musi być nieujemna.");

  const { error } = await supabase.from("expenses").insert({
    session_id: sessionId,
    name,
    category,
    amount,
    currency,
    expense_date: optionalString(formData, "expense_date"),
    status,
    payment_method: optionalString(formData, "payment_method"),
    document_number: optionalString(formData, "document_number"),
    has_invoice: formData.get("has_invoice") === "on",
    notes: optionalString(formData, "notes"),
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}

export async function updateExpense(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Brak identyfikatora wydatku.");

  const name = requireString(formData, "name", "Nazwa wydatku jest wymagana.");
  const category = requireEnum(formData, "category", EXPENSE_CATEGORIES, "inne");
  const status = requireEnum(formData, "status", EXPENSE_STATUSES, "zaplanowany");
  const currency = parseCurrency(formData);
  const amount = parseAmount(formData, "amount", "Kwota jest wymagana i musi być nieujemna.");

  const { error } = await supabase
    .from("expenses")
    .update({
      name,
      category,
      amount,
      currency,
      expense_date: optionalString(formData, "expense_date"),
      status,
      payment_method: optionalString(formData, "payment_method"),
      document_number: optionalString(formData, "document_number"),
      has_invoice: formData.get("has_invoice") === "on",
      notes: optionalString(formData, "notes"),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}

export async function deleteExpense(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/zjazdy");
  revalidatePath("/lab/szkola");
}
