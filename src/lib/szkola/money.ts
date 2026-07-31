import type { Currency } from "@/lib/szkola/types";

export function formatMoney(amount: number, currency: Currency | string | null): string {
  const value = amount.toLocaleString("pl-PL", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${value} ${currency ?? "PLN"}`;
}

/**
 * Sumuje kwoty w podziale na walutę — nigdy nie dodaje różnych walut do
 * siebie (świadomie brak automatycznego przeliczania kursów).
 */
export function sumByCurrency<T extends { amount: number; currency: Currency | string | null }>(
  items: T[],
): Partial<Record<Currency, number>> {
  const sums: Partial<Record<Currency, number>> = {};
  for (const item of items) {
    const currency = (item.currency ?? "PLN") as Currency;
    sums[currency] = (sums[currency] ?? 0) + Number(item.amount);
  }
  return sums;
}

export function formatCurrencySums(sums: Partial<Record<Currency, number>>): string {
  const entries = Object.entries(sums) as [Currency, number][];
  if (entries.length === 0) return "—";
  return entries.map(([currency, amount]) => formatMoney(amount, currency)).join(" + ");
}
