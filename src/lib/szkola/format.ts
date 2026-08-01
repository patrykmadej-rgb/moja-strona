function parseDateOnly(dateOnly: string): Date {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** "Piątek, 18 września 2026" — dla nagłówków dni w planie zajęć. */
export function formatWeekdayDate(dateOnly: string): string {
  const date = parseDateOnly(dateOnly);
  const weekday = date.toLocaleDateString("pl-PL", { weekday: "long" });
  const rest = date.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${rest}`;
}

export function formatHours(hours: number | null): string {
  if (!hours) return "0 godz.";
  const normalized = Math.round(hours * 100) / 100;
  return `${normalized.toLocaleString("pl-PL")} godz.`;
}

export function formatSessionDateRange(startDate: string, endDate: string | null): string {
  const start = parseDateOnly(startDate);
  if (!endDate || endDate === startDate) {
    return start.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
  }

  const end = parseDateOnly(endDate);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  const startLabel = sameMonth
    ? start.toLocaleDateString("pl-PL", { day: "numeric" })
    : start.toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
  const endLabel = end.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

  return `${startLabel}–${endLabel}`;
}
