"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ACCOMMODATION_STATUSES,
  ACTIVITY_TO_HOUR_CATEGORY,
  ACTIVITY_TYPES,
  CURRENCIES,
  DOCUMENT_TYPES,
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  MATERIAL_CATEGORIES,
  PAYMENT_CATEGORIES,
  PAYMENT_STATUSES,
  RELATED_ENTITY_TYPES,
  SEGMENT_DIRECTIONS,
  SEGMENT_STATUSES,
  SEGMENT_TYPES,
  SESSION_STATUSES,
  TASK_PRIORITIES,
  TRAINING_HOUR_CATEGORIES,
  type ActivityType,
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

function computeHoursBetween(start: string, end: string): number | null {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return null;
  const minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes <= 0) return null;
  return Math.round((minutes / 60) * 100) / 100;
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
  const semesterIdRaw = String(formData.get("semester_id") ?? "").trim();

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
      semester_id: semesterIdRaw || null,
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

/**
 * Jedyna ręczna decyzja w automatycznym "Statusie przygotowań" dot. noclegu
 * (sekcja 4 briefu) — nie tworzy/usuwa żadnej rezerwacji, tylko przełącza
 * school_sessions.lodging_not_needed, żeby status noclegu pokazywał
 * "Nocleg niewymagany" zamiast "Nocleg nie został jeszcze dodany".
 */
export async function toggleLodgingNotNeeded(sessionId: string, notNeeded: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("school_sessions")
    .update({ lodging_not_needed: notNeeded, updated_at: new Date().toISOString() })
    .eq("id", sessionId);
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

// --- Plan zajęć ---

function readScheduleItemFields(formData: FormData) {
  const title = requireString(formData, "title", "Tytuł zajęć jest wymagany.");
  const item_date = requireString(formData, "item_date", "Data jest wymagana.");

  const activityTypeRaw = String(formData.get("activity_type") ?? "");
  if (activityTypeRaw && !ACTIVITY_TYPES.includes(activityTypeRaw as ActivityType)) {
    throw new Error("Nieprawidłowy typ zajęć.");
  }

  const start_time = optionalString(formData, "start_time");
  const end_time = optionalString(formData, "end_time");
  if (start_time && end_time && start_time >= end_time) {
    throw new Error("Godzina rozpoczęcia musi być wcześniejsza niż godzina zakończenia.");
  }

  const hoursRaw = String(formData.get("hours") ?? "").trim();
  const autoHours = start_time && end_time ? computeHoursBetween(start_time, end_time) : null;
  const hours = hoursRaw ? Number(hoursRaw) : autoHours;
  if (hours !== null && (Number.isNaN(hours) || hours < 0)) {
    throw new Error("Nieprawidłowa liczba godzin.");
  }

  return {
    title,
    item_date,
    start_time,
    end_time,
    activity_type: activityTypeRaw || null,
    trainer: optionalString(formData, "trainer"),
    room: optionalString(formData, "room"),
    location: optionalString(formData, "location"),
    hours,
    notes: optionalString(formData, "notes"),
  };
}

export async function addScheduleItem(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);
  const fields = readScheduleItemFields(formData);

  const { data: maxRow } = await supabase
    .from("session_schedule_items")
    .select("sort_order")
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("session_schedule_items").insert({
    session_id: sessionId,
    ...fields,
    sort_order: (maxRow?.sort_order ?? -1) + 1,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola");
}

export async function updateScheduleItem(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Brak identyfikatora punktu planu.");
  const fields = readScheduleItemFields(formData);

  const { error } = await supabase
    .from("session_schedule_items")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola");
}

export async function deleteScheduleItem(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase.from("session_schedule_items").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola");
}

export async function duplicateScheduleItem(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Brak identyfikatora punktu planu.");

  const { data: original, error: fetchError } = await supabase
    .from("session_schedule_items")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const { data: maxRow } = await supabase
    .from("session_schedule_items")
    .select("sort_order")
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("session_schedule_items").insert({
    session_id: original.session_id,
    item_date: original.item_date,
    start_time: original.start_time,
    end_time: original.end_time,
    title: `${original.title} (kopia)`,
    activity_type: original.activity_type,
    trainer: original.trainer,
    room: original.room,
    location: original.location,
    hours: original.hours,
    notes: original.notes,
    sort_order: (maxRow?.sort_order ?? -1) + 1,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
}

export async function duplicateScheduleDay(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);
  const sourceDate = requireString(formData, "source_date", "Brak dnia źródłowego.");
  const targetDate = requireString(formData, "target_date", "Podaj docelową datę.");

  const { data: items, error: fetchError } = await supabase
    .from("session_schedule_items")
    .select("*")
    .eq("session_id", sessionId)
    .eq("item_date", sourceDate)
    .order("sort_order", { ascending: true });
  if (fetchError) throw new Error(fetchError.message);
  if (!items || items.length === 0) throw new Error("Brak punktów planu do skopiowania w tym dniu.");

  const { data: maxRow } = await supabase
    .from("session_schedule_items")
    .select("sort_order")
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextSortOrder = (maxRow?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("session_schedule_items").insert(
    items.map((item) => ({
      session_id: sessionId,
      item_date: targetDate,
      start_time: item.start_time,
      end_time: item.end_time,
      title: item.title,
      activity_type: item.activity_type,
      trainer: item.trainer,
      room: item.room,
      location: item.location,
      hours: item.hours,
      notes: item.notes,
      sort_order: nextSortOrder++,
    })),
  );

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
}

export async function moveScheduleItem(
  sessionId: string,
  itemId: string,
  direction: "up" | "down",
) {
  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("session_schedule_items")
    .select("id, sort_order, item_date")
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);

  const list = items ?? [];
  const index = list.findIndex((i) => i.id === itemId);
  if (index === -1) return;

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= list.length) return;
  if (list[index].item_date !== list[swapWith].item_date) return;

  const a = list[index];
  const b = list[swapWith];

  const { error: err1 } = await supabase
    .from("session_schedule_items")
    .update({ sort_order: b.sort_order })
    .eq("id", a.id);
  if (err1) throw new Error(err1.message);

  const { error: err2 } = await supabase
    .from("session_schedule_items")
    .update({ sort_order: a.sort_order })
    .eq("id", b.id);
  if (err2) throw new Error(err2.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
}

// --- Materiały (metadane; upload/usuwanie pliku obsługuje klient przez
// lib/szkola/materialsStorage.ts, bo server actions mają limit rozmiaru body) ---

export async function updateMaterialMeta(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Brak identyfikatora materiału.");

  const title = requireString(formData, "title", "Nazwa materiału jest wymagana.");
  const categoryRaw = String(formData.get("category") ?? "");
  if (categoryRaw && !MATERIAL_CATEGORIES.includes(categoryRaw as (typeof MATERIAL_CATEGORIES)[number])) {
    throw new Error("Nieprawidłowa kategoria.");
  }

  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("session_materials")
    .update({
      title,
      description: optionalString(formData, "description"),
      category: categoryRaw || null,
      folder: optionalString(formData, "folder"),
      author: optionalString(formData, "author"),
      tags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/materialy");
}

// --- Dokumenty (metadane; upload/usuwanie pliku obsługuje klient przez
// lib/szkola/documentsStorage.ts) ---

export async function updateDocumentMeta(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Brak identyfikatora dokumentu.");

  const title = requireString(formData, "title", "Nazwa dokumentu jest wymagana.");
  const docType = requireEnum(formData, "doc_type", DOCUMENT_TYPES, "inne");

  const relatedTypeRaw = String(formData.get("related_entity_type") ?? "");
  if (relatedTypeRaw && !RELATED_ENTITY_TYPES.includes(relatedTypeRaw as (typeof RELATED_ENTITY_TYPES)[number])) {
    throw new Error("Nieprawidłowy typ powiązania.");
  }

  const { error } = await supabase
    .from("session_documents")
    .update({
      title,
      doc_type: docType,
      document_date: optionalString(formData, "document_date"),
      related_entity_type: relatedTypeRaw || null,
      related_entity_id: optionalString(formData, "related_entity_id"),
      notes: optionalString(formData, "notes"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/dokumenty");
}

export async function deleteDocumentRecord(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase.from("session_documents").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/dokumenty");
}

// --- Godziny szkoleniowe ---

export async function addHoursEntry(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);

  const category = requireEnum(formData, "category", TRAINING_HOUR_CATEGORIES, "inne");
  const hours = parseAmount(formData, "hours", "Liczba godzin jest wymagana i musi być nieujemna.");

  const { error } = await supabase.from("training_hours_entries").insert({
    session_id: sessionId,
    category,
    hours,
    entry_date: optionalString(formData, "entry_date"),
    attended: formData.get("attended") !== "off",
    trainer: optionalString(formData, "trainer"),
    schedule_item_id: optionalString(formData, "schedule_item_id"),
    notes: optionalString(formData, "notes"),
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/godziny");
  revalidatePath("/lab/szkola");
}

export async function updateHoursEntry(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Brak identyfikatora wpisu godzinowego.");

  const category = requireEnum(formData, "category", TRAINING_HOUR_CATEGORIES, "inne");
  const hours = parseAmount(formData, "hours", "Liczba godzin jest wymagana i musi być nieujemna.");

  const { error } = await supabase
    .from("training_hours_entries")
    .update({
      category,
      hours,
      entry_date: optionalString(formData, "entry_date"),
      attended: formData.get("attended") !== "off",
      trainer: optionalString(formData, "trainer"),
      schedule_item_id: optionalString(formData, "schedule_item_id"),
      notes: optionalString(formData, "notes"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/godziny");
  revalidatePath("/lab/szkola");
}

export async function deleteHoursEntry(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase.from("training_hours_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/godziny");
  revalidatePath("/lab/szkola");
}

export async function createHoursEntryFromScheduleItem(formData: FormData) {
  const supabase = await createClient();
  const sessionId = requireSessionId(formData);
  const scheduleItemId = String(formData.get("schedule_item_id") ?? "");
  if (!scheduleItemId) throw new Error("Brak identyfikatora punktu planu.");

  const { data: item, error: fetchError } = await supabase
    .from("session_schedule_items")
    .select("*")
    .eq("id", scheduleItemId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const category = ACTIVITY_TO_HOUR_CATEGORY[item.activity_type as ActivityType] ?? "inne";

  const { error } = await supabase.from("training_hours_entries").insert({
    session_id: sessionId,
    category,
    hours: item.hours ?? 0,
    entry_date: item.item_date,
    attended: true,
    trainer: item.trainer,
    schedule_item_id: item.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
  revalidatePath("/lab/szkola/godziny");
  revalidatePath("/lab/szkola");
}
