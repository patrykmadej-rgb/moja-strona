import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { AlertCategory, AlertPriority, SchoolSession } from "@/lib/szkola/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type AlertDraft = {
  category: AlertCategory;
  priority: AlertPriority;
  title: string;
  description: string | null;
  sessionId: string | null;
  source: string;
  sourceId: string | null;
  actionLabel: string | null;
  actionHref: string | null;
  dedupeKey: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function isSessionActive(session: SchoolSession): boolean {
  return session.status !== "anulowany" && session.status !== "zakonczony";
}

function daysUntil(dateStr: string, now: Date): number {
  return Math.round((new Date(`${dateStr}T00:00:00`).getTime() - now.getTime()) / DAY_MS);
}

async function checkMissingReturnTickets(
  supabase: SupabaseServerClient,
  sessions: SchoolSession[],
  now: Date,
): Promise<AlertDraft[]> {
  const drafts: AlertDraft[] = [];
  for (const session of sessions) {
    if (!isSessionActive(session)) continue;
    const daysAway = daysUntil(session.start_date, now);
    if (daysAway < 0 || daysAway > 21) continue; // tylko zjazdy w ciągu najbliższych 3 tygodni

    const { data: itinerary } = await supabase.from("travel_itineraries").select("id").eq("session_id", session.id).maybeSingle();
    if (!itinerary) {
      drafts.push({
        category: "podroz",
        priority: daysAway <= 7 ? "pilne" : "uwaga",
        title: `Brak biletów — ${session.title}`,
        description: "Nie dodano jeszcze żadnego odcinka podróży dla tego zjazdu.",
        sessionId: session.id,
        source: "missing_travel",
        sourceId: session.id,
        actionLabel: "Dodaj podróż",
        actionHref: `/lab/szkola/zjazdy/${session.id}?tab=podroz`,
        dedupeKey: `missing_travel:${session.id}`,
      });
      continue;
    }

    const { data: segments } = await supabase.from("travel_segments").select("direction, status").eq("itinerary_id", itinerary.id);
    const active = (segments ?? []).filter((s) => s.status !== "anulowane");
    if (!active.some((s) => s.direction === "powrot")) {
      drafts.push({
        category: "podroz",
        priority: daysAway <= 7 ? "pilne" : "uwaga",
        title: `Brak biletu powrotnego — ${session.title}`,
        description: "Zjazd zbliża się, a nie masz jeszcze biletu powrotnego.",
        sessionId: session.id,
        source: "missing_return_ticket",
        sourceId: session.id,
        actionLabel: "Dodaj odcinek",
        actionHref: `/lab/szkola/zjazdy/${session.id}?tab=podroz`,
        dedupeKey: `missing_return_ticket:${session.id}`,
      });
    }
  }
  return drafts;
}

async function checkMissingAccommodation(
  supabase: SupabaseServerClient,
  sessions: SchoolSession[],
  now: Date,
): Promise<AlertDraft[]> {
  const drafts: AlertDraft[] = [];
  for (const session of sessions) {
    if (!isSessionActive(session)) continue;
    // Ta sama zasada co automatyczny status noclegu w Statusie przygotowań
    // (preparation.ts) — ręcznie oznaczone "nocleg niepotrzebny" nie powinno
    // dalej generować alertu o braku noclegu.
    if (session.lodging_not_needed) continue;
    const daysAway = daysUntil(session.start_date, now);
    if (daysAway < 0 || daysAway > 21) continue;

    const { data: accommodations } = await supabase
      .from("accommodations")
      .select("id, payment_status")
      .eq("session_id", session.id);
    const active = (accommodations ?? []).filter((a) => a.payment_status !== "anulowane");
    if (active.length === 0) {
      drafts.push({
        category: "zakwaterowanie",
        priority: daysAway <= 7 ? "pilne" : "uwaga",
        title: `Brak noclegu — ${session.title}`,
        description: "Zjazd zbliża się, a nie masz jeszcze zarezerwowanego noclegu.",
        sessionId: session.id,
        source: "missing_accommodation",
        sourceId: session.id,
        actionLabel: "Dodaj nocleg",
        actionHref: `/lab/szkola/zjazdy/${session.id}?tab=zakwaterowanie`,
        dedupeKey: `missing_accommodation:${session.id}`,
      });
    }
  }
  return drafts;
}

async function checkCancellationDeadlines(
  supabase: SupabaseServerClient,
  sessions: SchoolSession[],
  now: Date,
): Promise<AlertDraft[]> {
  const drafts: AlertDraft[] = [];
  const sessionById = new Map(sessions.map((s) => [s.id, s]));
  const { data: accommodations } = await supabase
    .from("accommodations")
    .select("id, session_id, name, free_cancellation_until, payment_status")
    .not("free_cancellation_until", "is", null);

  for (const accommodation of accommodations ?? []) {
    if (accommodation.payment_status === "anulowane") continue;
    const days = daysUntil(accommodation.free_cancellation_until as string, now);
    if (days < 0 || days > 3) continue;
    const session = accommodation.session_id ? sessionById.get(accommodation.session_id) : null;
    drafts.push({
      category: "zakwaterowanie",
      priority: days <= 1 ? "pilne" : "uwaga",
      title: `Kończy się termin darmowego anulowania — ${accommodation.name}`,
      description: `Bezpłatne anulowanie tylko do ${accommodation.free_cancellation_until}.`,
      sessionId: session?.id ?? null,
      source: "cancellation_deadline",
      sourceId: accommodation.id,
      actionLabel: "Zobacz zakwaterowanie",
      actionHref: session ? `/lab/szkola/zjazdy/${session.id}?tab=zakwaterowanie` : null,
      dedupeKey: `cancellation_deadline:${accommodation.id}`,
    });
  }
  return drafts;
}

/**
 * Szkoła jest opłacana semestralnie z góry (migracja 019) — status płatności
 * patrzy na school_semesters.payment_status semestru przypisanego do zjazdu
 * (session.semester_id), NIE na płatność school_payments per-zjazd (ta sama
 * zasada co automatyczny status "Semestr opłacony" w preparation.ts).
 */
async function checkUnpaidSessions(
  supabase: SupabaseServerClient,
  sessions: SchoolSession[],
  now: Date,
): Promise<AlertDraft[]> {
  const drafts: AlertDraft[] = [];
  const semesterIds = Array.from(new Set(sessions.map((s) => s.semester_id).filter((id): id is string => Boolean(id))));
  const semesterPaymentStatusById = new Map<string, string>();
  if (semesterIds.length > 0) {
    const { data: semesters } = await supabase.from("school_semesters").select("id, payment_status").in("id", semesterIds);
    for (const semester of semesters ?? []) {
      semesterPaymentStatusById.set(semester.id, semester.payment_status);
    }
  }

  for (const session of sessions) {
    if (!isSessionActive(session)) continue;
    const daysAway = daysUntil(session.start_date, now);
    if (daysAway < 0 || daysAway > 14) continue;

    const paymentStatus = session.semester_id ? semesterPaymentStatusById.get(session.semester_id) : undefined;
    const isPaid = paymentStatus === "oplacone" || paymentStatus === "anulowane";
    if (!isPaid) {
      drafts.push({
        category: "platnosc",
        priority: "pilne",
        title: `Nieopłacony semestr — ${session.title}`,
        description: session.semester_id
          ? "Zjazd zbliża się, a semestr, do którego należy, nie jest jeszcze oznaczony jako opłacony."
          : "Zjazd zbliża się, a nie ma przypisanego semestru — nie da się potwierdzić opłaty.",
        sessionId: session.id,
        source: "unpaid_session",
        sourceId: session.id,
        actionLabel: "Zobacz semestry",
        actionHref: "/lab/szkola/semestry",
        dedupeKey: `unpaid_session:${session.id}`,
      });
    }
  }
  return drafts;
}

async function checkCalendarChanges(supabase: SupabaseServerClient, userId: string): Promise<AlertDraft[]> {
  const drafts: AlertDraft[] = [];
  const { data: changes } = await supabase
    .from("school_calendar_changes")
    .select("id, session_id, change_type, impact_level, impact_summary, session:school_sessions(title)")
    .eq("user_id", userId)
    .eq("status", "new");

  for (const change of changes ?? []) {
    const sessionTitle = (change as unknown as { session: { title: string } | null }).session?.title ?? "zjazd";
    if (change.impact_level === "conflict") {
      drafts.push({
        category: "kalendarz",
        priority: "pilne",
        title: `Konflikt podróży — ${sessionTitle}`,
        description: change.impact_summary,
        sessionId: change.session_id,
        source: "calendar_conflict",
        sourceId: change.id,
        actionLabel: "Zobacz zmiany",
        actionHref: "/lab/szkola/kalendarz/zmiany",
        dedupeKey: `calendar_conflict:${change.id}`,
      });
    } else {
      drafts.push({
        category: "kalendarz",
        priority: change.impact_level === "warning" ? "uwaga" : "informacja",
        title: `Zmiana w kalendarzu — ${sessionTitle}`,
        description: change.impact_summary ?? `Wykryto zmianę typu: ${change.change_type}.`,
        sessionId: change.session_id,
        source: "calendar_change",
        sourceId: change.id,
        actionLabel: "Zobacz zmiany",
        actionHref: "/lab/szkola/kalendarz/zmiany",
        dedupeKey: `calendar_change:${change.id}`,
      });
    }
  }
  return drafts;
}

async function checkStaleImports(supabase: SupabaseServerClient, userId: string, now: Date): Promise<AlertDraft[]> {
  const drafts: AlertDraft[] = [];
  const { data: items } = await supabase
    .from("import_inbox_items")
    .select("id, original_filename, raw_email_subject, status, received_at")
    .eq("user_id", userId)
    .in("status", ["needs_review", "error"]);

  for (const item of items ?? []) {
    const ageDays = Math.round((now.getTime() - new Date(item.received_at).getTime()) / DAY_MS);
    if (ageDays < 2) continue; // daj chwilę, zanim zaalarmujemy
    drafts.push({
      category: "import",
      priority: item.status === "error" ? "uwaga" : "informacja",
      title: `Import wymaga sprawdzenia — ${item.original_filename ?? item.raw_email_subject ?? "bez nazwy"}`,
      description:
        item.status === "error" ? "Przetwarzanie się nie powiodło — sprawdź lub przetwórz ponownie." : "Czeka na sprawdzenie od kilku dni.",
      sessionId: null,
      source: "stale_import",
      sourceId: item.id,
      actionLabel: "Otwórz import",
      actionHref: `/lab/szkola/import/${item.id}`,
      dedupeKey: `stale_import:${item.id}`,
    });
  }
  return drafts;
}

async function checkMissingHours(supabase: SupabaseServerClient): Promise<AlertDraft[]> {
  const drafts: AlertDraft[] = [];
  const { data: requirements } = await supabase.from("training_hour_requirements").select("*").eq("active", true);
  const activeRequirements = (requirements ?? []).filter((r) => r.required_hours > 0);
  if (activeRequirements.length === 0) return drafts;

  const { data: entries } = await supabase.from("training_hours_entries").select("category, hours, attended").eq("attended", true);
  const totalsByCategory = new Map<string, number>();
  for (const entry of entries ?? []) {
    totalsByCategory.set(entry.category, (totalsByCategory.get(entry.category) ?? 0) + entry.hours);
  }

  for (const requirement of activeRequirements) {
    const completed = totalsByCategory.get(requirement.category) ?? 0;
    const remaining = requirement.required_hours - completed;
    if (remaining <= 0) continue;
    const percentDone = completed / requirement.required_hours;
    if (percentDone >= 0.5) continue; // alarmuj tylko gdy realnie brakuje dużo, nie przy każdym niedoborze
    drafts.push({
      category: "godziny",
      priority: "informacja",
      title: `Brakuje godzin — ${requirement.label}`,
      description: `Zrealizowano ${completed} z ${requirement.required_hours} wymaganych godzin.`,
      sessionId: null,
      source: "missing_hours",
      sourceId: requirement.id,
      actionLabel: "Zobacz godziny",
      actionHref: "/lab/szkola/godziny",
      dedupeKey: `missing_hours:${requirement.id}`,
    });
  }
  return drafts;
}

async function checkMissingCertificates(
  supabase: SupabaseServerClient,
  sessions: SchoolSession[],
  now: Date,
): Promise<AlertDraft[]> {
  const drafts: AlertDraft[] = [];
  for (const session of sessions) {
    if (session.status !== "zakonczony") continue;
    const daysSince = -daysUntil(session.end_date ?? session.start_date, now);
    if (daysSince < 14 || daysSince > 120) continue; // rozsądne okno po zjeździe, nie na zawsze

    const { data: docs } = await supabase.from("session_documents").select("id").eq("session_id", session.id).eq("doc_type", "zaswiadczenie");
    if (!docs || docs.length === 0) {
      drafts.push({
        category: "dokumenty",
        priority: "informacja",
        title: `Brak zaświadczenia — ${session.title}`,
        description: "Zjazd zakończony, a nie dodano jeszcze zaświadczenia o udziale.",
        sessionId: session.id,
        source: "missing_certificate",
        sourceId: session.id,
        actionLabel: "Zobacz dokumenty",
        actionHref: `/lab/szkola/zjazdy/${session.id}?tab=dokumenty`,
        dedupeKey: `missing_certificate:${session.id}`,
      });
    }
  }
  return drafts;
}

/** Zapisuje/aktualizuje alerty i AUTOMATYCZNIE ROZWIĄZUJE te, których warunek już nie zachodzi. */
async function upsertAlerts(supabase: SupabaseServerClient, userId: string, drafts: AlertDraft[]): Promise<number> {
  let created = 0;
  const currentDedupeKeys = new Set(drafts.map((d) => d.dedupeKey));
  const sources = Array.from(new Set(drafts.map((d) => d.source)));

  for (const draft of drafts) {
    const { data: existing } = await supabase
      .from("school_alerts")
      .select("id, status")
      .eq("user_id", userId)
      .eq("dedupe_key", draft.dedupeKey)
      .in("status", ["new", "seen"])
      .maybeSingle();

    if (existing) {
      await supabase
        .from("school_alerts")
        .update({ description: draft.description, detected_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      continue;
    }

    const { error } = await supabase.from("school_alerts").insert({
      user_id: userId,
      category: draft.category,
      priority: draft.priority,
      title: draft.title,
      description: draft.description,
      session_id: draft.sessionId,
      source: draft.source,
      source_id: draft.sourceId,
      action_label: draft.actionLabel,
      action_href: draft.actionHref,
      dedupe_key: draft.dedupeKey,
      status: "new",
    });
    if (!error) created += 1;
  }

  // Auto-rozwiązanie: aktywne alerty z tych samych reguł, których dedupe_key
  // nie występuje już w bieżącym zestawie draftów — warunek przestał zachodzić.
  if (sources.length > 0) {
    const { data: staleActive } = await supabase
      .from("school_alerts")
      .select("id, dedupe_key")
      .eq("user_id", userId)
      .in("source", sources)
      .in("status", ["new", "seen"]);

    for (const alert of staleActive ?? []) {
      if (alert.dedupe_key && !currentDedupeKeys.has(alert.dedupe_key)) {
        await supabase
          .from("school_alerts")
          .update({ status: "resolved", resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("id", alert.id);
      }
    }
  }

  return created;
}

export async function generateAlerts(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<{ recordsProcessed: number; alertsCreated: number }> {
  const now = new Date();
  const { data: sessionsData } = await supabase.from("school_sessions").select("*");
  const sessions = (sessionsData as SchoolSession[] | null) ?? [];

  const drafts: AlertDraft[] = [];
  drafts.push(...(await checkMissingReturnTickets(supabase, sessions, now)));
  drafts.push(...(await checkMissingAccommodation(supabase, sessions, now)));
  drafts.push(...(await checkCancellationDeadlines(supabase, sessions, now)));
  drafts.push(...(await checkUnpaidSessions(supabase, sessions, now)));
  drafts.push(...(await checkCalendarChanges(supabase, userId)));
  drafts.push(...(await checkStaleImports(supabase, userId, now)));
  drafts.push(...(await checkMissingHours(supabase)));
  drafts.push(...(await checkMissingCertificates(supabase, sessions, now)));

  const created = await upsertAlerts(supabase, userId, drafts);
  return { recordsProcessed: sessions.length, alertsCreated: created };
}
