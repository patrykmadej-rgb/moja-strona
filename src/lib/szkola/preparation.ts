import type { SessionTask } from "@/lib/szkola/types";

export function getPreparationPercent(tasks: SessionTask[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.is_done).length;
  return Math.round((done / tasks.length) * 100);
}

export function getMissingTaskTitles(tasks: SessionTask[], max = 3): string[] {
  return tasks
    .filter((t) => !t.is_done)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, max)
    .map((t) => t.title);
}

export function getDaysUntil(dateOnly: string): number {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
