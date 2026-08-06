import type { DashboardArticleRow, DashboardAttentionItem, UpcomingDeadline, WeeklyPriority } from "@/lib/dashboard/types";

/**
 * Sekcja 12 briefu: dokładnie 3 priorytety —
 *  1. najbardziej pilny alert (attentionItems jest już posortowane wg ważności),
 *  2. następny termin wymagający przygotowania,
 *  3. najwyżej priorytetowy artykuł wymagający działania (activeArticles jest
 *     już posortowane wg priorytetu, patrz articles.ts).
 * "Nie pokazuj duplikatów tej samej sprawy" — pilnujemy unikalności przez
 * entityKey (identyfikator PRAWDZIWEGO bytu — artykułu/zjazdu/odcinka, patrz
 * komentarz w types.ts), NIE przez `id` wiersza — te dwa mają różny kształt
 * (np. "article-deadline-{id}" vs "article:{id}") i porównanie po `id`
 * nigdy by się nie zgodziło mimo dotyczenia tej samej sprawy.
 */
export function buildWeeklyPriorities(input: {
  attentionItems: DashboardAttentionItem[];
  upcomingDeadlines: UpcomingDeadline[];
  activeArticles: DashboardArticleRow[];
}): WeeklyPriority[] {
  const used = new Set<string>();
  const priorities: Omit<WeeklyPriority, "rank">[] = [];

  const topAlert = input.attentionItems[0];
  if (topAlert) {
    priorities.push({
      title: topAlert.title,
      severity: topAlert.severity,
      actionLabel: topAlert.actionLabel,
      actionHref: topAlert.actionHref,
    });
    used.add(topAlert.entityKey);
  }

  const nextDeadline = input.upcomingDeadlines.find((d) => !used.has(d.entityKey));
  if (nextDeadline) {
    priorities.push({
      title: `Przygotuj się: ${nextDeadline.title}`,
      severity: "urgent",
      actionLabel: "Zobacz szczegóły",
      actionHref: nextDeadline.actionHref,
    });
    used.add(nextDeadline.entityKey);
  }

  const priorityArticle = input.activeArticles.find((a) => !used.has(`article:${a.id}`) && a.priority !== "on_hold");
  if (priorityArticle) {
    priorities.push({
      title: `Zajmij się: ${priorityArticle.title}`,
      severity: "review",
      actionLabel: "Otwórz artykuł",
      actionHref: `/lab/artykuly/${priorityArticle.id}`,
    });
    used.add(`article:${priorityArticle.id}`);
  }

  return priorities.slice(0, 3).map((p, index) => ({ ...p, rank: (index + 1) as 1 | 2 | 3 }));
}
