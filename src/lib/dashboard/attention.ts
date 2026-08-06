import type { Article } from "@/lib/lab/types";
import type { SchoolAlert } from "@/lib/szkola/types";
import { ATTENTION_SEVERITY_ORDER, type AttentionSeverity, type DashboardAttentionItem } from "@/lib/dashboard/types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** school_alerts.priority (alertsEngine.ts) już koduje ważność — reużywamy ją zamiast wymyślać drugą klasyfikację. */
const SCHOOL_ALERT_SEVERITY: Record<SchoolAlert["priority"], AttentionSeverity> = {
  pilne: "critical",
  uwaga: "urgent",
  informacja: "review",
};

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / DAY_MS);
}

function schoolAlertsToAttentionItems(alerts: SchoolAlert[]): DashboardAttentionItem[] {
  return alerts.map((alert) => ({
    id: `school-alert-${alert.id}`,
    source: "school",
    title: alert.title,
    context: alert.description ?? "",
    severity: SCHOOL_ALERT_SEVERITY[alert.priority],
    actionLabel: alert.action_label ?? "Sprawdź",
    actionHref: alert.action_href ?? "/lab/szkola/alerty",
    dueDate: null,
    createdAt: alert.detected_at,
    // session_id (jeśli jest) to najbardziej stabilny wspólny identyfikator
    // z resztą pulpitu (np. "Zjazd" w Nadchodzących terminach) — inaczej
    // fallback na sam alert, żeby zawsze mieć jakiś klucz.
    entityKey: alert.session_id ? `session:${alert.session_id}` : `school-alert:${alert.id}`,
  }));
}

/** Sekcja 10 poprzedniego etapu (podróże/zakwaterowanie) — rekordy zapisane bez zjazdu, jeszcze nie widoczne w school_alerts. */
function unassignedRecordsToAttentionItems(input: {
  unassignedSegments: { id: string; departure_place: string | null; arrival_place: string | null; created_at: string }[];
  unassignedAccommodations: { id: string; name: string; created_at: string }[];
}): DashboardAttentionItem[] {
  const segmentItems: DashboardAttentionItem[] = input.unassignedSegments.map((s) => ({
    id: `unassigned-segment-${s.id}`,
    source: "school",
    title: "Odcinek podróży niepowiązany ze zjazdem",
    context: `${s.departure_place || "?"} → ${s.arrival_place || "?"}`,
    severity: "review",
    actionLabel: "Powiąż ze zjazdem",
    actionHref: "/lab/szkola/podroze",
    dueDate: null,
    createdAt: s.created_at,
    entityKey: `travel-segment:${s.id}`,
  }));

  const accommodationItems: DashboardAttentionItem[] = input.unassignedAccommodations.map((a) => ({
    id: `unassigned-accommodation-${a.id}`,
    source: "school",
    title: "Zakwaterowanie niepowiązane ze zjazdem",
    context: a.name,
    severity: "review",
    actionLabel: "Powiąż ze zjazdem",
    actionHref: "/lab/szkola/zakwaterowanie",
    dueDate: null,
    createdAt: a.created_at,
    entityKey: `accommodation:${a.id}`,
  }));

  return [...segmentItems, ...accommodationItems];
}

/** Importy needs_review/error — na bieżąco, nie czekamy na cotygodniowy cron jak school_alerts (stale_import ma próg 2 dni). */
function importsToAttentionItems(
  imports: { id: string; original_filename: string | null; raw_email_subject: string | null; status: string; ocr_status: string | null; received_at: string }[],
): DashboardAttentionItem[] {
  return imports.map((item) => {
    const label = item.original_filename ?? item.raw_email_subject ?? "bez nazwy";
    const isOcrFailure = item.status === "error" && item.ocr_status === "failed";
    return {
      id: `import-${item.id}`,
      source: "school" as const,
      title: isOcrFailure ? "OCR zakończył się błędem" : item.status === "error" ? "Import zakończył się błędem" : "Import wymaga sprawdzenia",
      context: label,
      severity: (item.status === "error" ? "urgent" : "review") as AttentionSeverity,
      actionLabel: "Sprawdź import",
      actionHref: `/lab/szkola/import/${item.id}`,
      dueDate: null,
      createdAt: item.received_at,
      entityKey: `import:${item.id}`,
    };
  });
}

const TOP_STALE_DAYS = 14;
const TOP_CRITICAL_DAYS = 30;
const DEADLINE_URGENT_DAYS = 7;

/** Kandydaci per artykuł — reduceArticleCandidates niżej zostawia tylko najpoważniejszego per artykuł, żeby nie zaśmiecać listy kilkoma wierszami dla tej samej sprawy. */
function articleCandidates(article: Article, versionCount: number, now: Date): DashboardAttentionItem[] {
  const candidates: DashboardAttentionItem[] = [];
  const base = { source: "article" as const, createdAt: article.updated_at, entityKey: `article:${article.id}` };

  if (article.priority === "top" && article.status !== "published") {
    const staleDays = daysBetween(now, new Date(article.updated_at));
    if (staleDays >= TOP_STALE_DAYS) {
      candidates.push({
        ...base,
        id: `article-stale-${article.id}`,
        title: `Artykuł Top bez aktualizacji od ${staleDays} dni`,
        context: article.title,
        severity: staleDays >= TOP_CRITICAL_DAYS ? "critical" : "urgent",
        actionLabel: "Otwórz artykuł",
        actionHref: `/lab/artykuly/${article.id}`,
      });
    }
  }

  if (article.deadline) {
    const daysUntil = daysBetween(new Date(article.deadline), now);
    if (daysUntil <= DEADLINE_URGENT_DAYS) {
      candidates.push({
        ...base,
        id: `article-deadline-${article.id}`,
        title: daysUntil < 0 ? "Termin wysłania minął" : "Termin wysłania zbliża się",
        context: article.title,
        severity: daysUntil < 0 || daysUntil <= 2 ? "critical" : "urgent",
        actionLabel: "Otwórz artykuł",
        actionHref: `/lab/artykuly/${article.id}`,
        dueDate: article.deadline,
      });
    }
  }

  if (article.status === "post_review_revisions") {
    candidates.push({
      ...base,
      id: `article-post-review-${article.id}`,
      title: "Poprawki po recenzji wymagają działania",
      context: article.title,
      severity: "urgent",
      actionLabel: "Otwórz artykuł",
      actionHref: `/lab/artykuly/${article.id}`,
    });
  }

  if (article.status === "ready_to_submit") {
    candidates.push({
      ...base,
      id: `article-ready-${article.id}`,
      title: "Artykuł gotowy do wysłania",
      context: article.title,
      severity: "review",
      actionLabel: "Otwórz artykuł",
      actionHref: `/lab/artykuly/${article.id}`,
    });
  }

  if (article.status !== "idea" && versionCount === 0) {
    candidates.push({
      ...base,
      id: `article-no-version-${article.id}`,
      title: "Brak dodanej wersji",
      context: article.title,
      severity: "review",
      actionLabel: "Dodaj wersję",
      actionHref: `/lab/artykuly/${article.id}?tab=wersje`,
    });
  }

  return candidates;
}

/**
 * Jeden artykuł = maksymalnie jeden wiersz (najpoważniejszy kandydat) — unika
 * kilku alertów dla tej samej sprawy. Identyfikator artykułu (UUID, więc SAM
 * zawiera myślniki) jest przekazywany osobno zamiast parsowany z powrotem
 * ze złożonego `id` wiersza — string.split("-") na UUID-zie by go połamał.
 */
function reduceArticleCandidates(candidates: { articleId: string; item: DashboardAttentionItem }[]): DashboardAttentionItem[] {
  const bestByArticle = new Map<string, DashboardAttentionItem>();
  for (const { articleId, item } of candidates) {
    const existing = bestByArticle.get(articleId);
    if (!existing || ATTENTION_SEVERITY_ORDER[item.severity] < ATTENTION_SEVERITY_ORDER[existing.severity]) {
      bestByArticle.set(articleId, item);
    }
  }
  return Array.from(bestByArticle.values());
}

const MAX_ATTENTION_ITEMS = 12;

/** Jeśli href kończy się identyfikatorem konkretnego rekordu (np. "/import/{uuid}"), zwraca wersję bez niego (ogólną listę) — używane przy zwijaniu duplikatów, gdzie kliknięcie w JEDEN konkretny rekord byłoby mylące. */
function toListHref(href: string): string {
  return href.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "");
}

/**
 * Kilka niezależnych, prawdziwych rekordów bywa opisywanych identycznym
 * tytułem+kontekstem (np. trzy osobne importy tego samego pliku z testów,
 * dziewięć osobnych zmian w kalendarzu typu "created") — bez zwinięcia
 * lista wyglądałaby jak ściana klonów zamiast czytelnego podsumowania.
 * Zwija WYŁĄCZNIE dokładne duplikaty (ten sam source+title+context) w jeden
 * wiersz z licznikiem "(×N)", zachowując najwyższą ważność i najnowszą datę
 * z grupy. Nic nie znika — to prezentacja, nie utrata danych.
 */
function collapseDuplicates(items: DashboardAttentionItem[]): DashboardAttentionItem[] {
  const groups = new Map<string, DashboardAttentionItem[]>();
  for (const item of items) {
    const key = `${item.source}:${item.title}:${item.context}`;
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  return Array.from(groups.values()).map((group) => {
    if (group.length === 1) return group[0];

    const mostSevere = group.reduce((best, item) =>
      ATTENTION_SEVERITY_ORDER[item.severity] < ATTENTION_SEVERITY_ORDER[best.severity] ? item : best,
    );
    const newestCreatedAt = group.reduce((latest, item) => (item.createdAt > latest ? item.createdAt : latest), group[0].createdAt);
    const sameHrefForAll = group.every((item) => item.actionHref === group[0].actionHref);

    return {
      ...mostSevere,
      id: `${mostSevere.id}-group`,
      title: `${mostSevere.title} (×${group.length})`,
      createdAt: newestCreatedAt,
      actionHref: sameHrefForAll ? group[0].actionHref : toListHref(group[0].actionHref),
    };
  });
}

/**
 * Sekcja 6 briefu: buduje i sortuje "Wymaga Twojej uwagi" — nigdy nie
 * przypisuje/nie zmienia niczego, wyłącznie czyta już pobrane dane (żadnych
 * zapytań do bazy tutaj, patrz data.ts). Sortowanie: ważność, potem
 * najbliższy termin (jeśli jest), potem data wykrycia malejąco — NIE
 * wyłącznie createdAt, zgodnie z briefem.
 */
export function buildDashboardAttentionItems(input: {
  schoolAlerts: SchoolAlert[];
  unassignedSegments: { id: string; departure_place: string | null; arrival_place: string | null; created_at: string }[];
  unassignedAccommodations: { id: string; name: string; created_at: string }[];
  needsReviewImports: { id: string; original_filename: string | null; raw_email_subject: string | null; status: string; ocr_status: string | null; received_at: string }[];
  articles: Article[];
  articleVersionCounts: Map<string, number>;
  now?: Date;
}): DashboardAttentionItem[] {
  const now = input.now ?? new Date();

  const schoolItems = [
    ...schoolAlertsToAttentionItems(input.schoolAlerts),
    ...unassignedRecordsToAttentionItems(input),
    ...importsToAttentionItems(input.needsReviewImports),
  ];

  const articleCandidateItems = input.articles.flatMap((article) =>
    articleCandidates(article, input.articleVersionCounts.get(article.id) ?? 0, now).map((item) => ({
      articleId: article.id,
      item,
    })),
  );
  const articleItems = reduceArticleCandidates(articleCandidateItems);

  const all = collapseDuplicates([...schoolItems, ...articleItems]);

  all.sort((a, b) => {
    const severityDiff = ATTENTION_SEVERITY_ORDER[a.severity] - ATTENTION_SEVERITY_ORDER[b.severity];
    if (severityDiff !== 0) return severityDiff;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return all.slice(0, MAX_ATTENTION_ITEMS);
}
