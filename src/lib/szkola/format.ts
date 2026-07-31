function parseDateOnly(dateOnly: string): Date {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day);
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
