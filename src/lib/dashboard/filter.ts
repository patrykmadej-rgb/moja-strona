import type { DashboardFilterKey, DashboardSource } from "@/lib/dashboard/types";

/**
 * Sekcja 4 briefu: filtr wpływa na sekcję uwagi/terminy/aktywność/priorytety
 * — każda z tych list ma pole `source`, więc filtrowanie jest jedną, wspólną
 * funkcją zamiast czterech osobnych implementacji w komponentach.
 */
export function filterBySource<T extends { source: DashboardSource }>(items: T[], filter: DashboardFilterKey): T[] {
  if (filter === "wszystko") return items;
  const source: DashboardSource = filter === "szkola" ? "school" : "article";
  return items.filter((item) => item.source === source);
}

export function parseDashboardFilter(value: string | string[] | undefined): DashboardFilterKey {
  if (value === "szkola" || value === "artykuly") return value;
  return "wszystko";
}
