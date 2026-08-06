import { ARTICLE_PRIORITY_SORT_ORDER, type Article } from "@/lib/lab/types";
import type { DashboardArticleRow } from "@/lib/dashboard/types";

const MAX_ACTIVE_ARTICLES = 5;

/**
 * Sekcja 8 briefu: "Artykuły w toku".
 *  - nie pokazuj Opublikowane jako główne "w toku", chyba że brak innych rekordów,
 *  - nie pokazuj On hold, jeśli są aktywne (nie-on-hold) artykuły,
 *  - sortowanie: priorytet (ARTICLE_PRIORITY_SORT_ORDER — TA SAMA stała co
 *    /lab/artykuly, sekcja 18 briefu: nie zmieniamy logiki priorytetów
 *    artykułów, tylko reużywamy), w obrębie priorytetu: updated_at malejąco.
 */
export function selectActiveArticles(articles: Article[]): DashboardArticleRow[] {
  const nonPublished = articles.filter((a) => a.status !== "published");
  const base = nonPublished.length > 0 ? nonPublished : articles;

  const nonOnHold = base.filter((a) => a.priority !== "on_hold");
  const pool = nonOnHold.length > 0 ? nonOnHold : base;

  const sorted = [...pool].sort((a, b) => {
    const priorityDiff = ARTICLE_PRIORITY_SORT_ORDER.indexOf(a.priority) - ARTICLE_PRIORITY_SORT_ORDER.indexOf(b.priority);
    if (priorityDiff !== 0) return priorityDiff;
    return b.updated_at.localeCompare(a.updated_at);
  });

  return sorted.slice(0, MAX_ACTIVE_ARTICLES).map((a) => ({
    id: a.id,
    title: a.title,
    status: a.status,
    priority: a.priority,
    updatedAt: a.updated_at,
  }));
}
