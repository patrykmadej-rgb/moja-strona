import { getDaysUntil } from "@/lib/szkola/preparation";
import { todayDateString } from "@/lib/lab/format";
import type { Accommodation, SchoolPayment, SessionTask } from "@/lib/szkola/types";

type Deadline = {
  id: string;
  label: string;
  date: string;
  kind: "checklista" | "płatność" | "anulowanie";
};

export default function UpcomingDeadlinesCard({
  tasks,
  payments,
  accommodations,
}: {
  tasks: SessionTask[];
  payments: SchoolPayment[];
  accommodations: Accommodation[];
}) {
  const today = todayDateString();

  const deadlines: Deadline[] = [
    ...tasks
      .filter((t) => !t.is_done && t.due_date)
      .map((t) => ({ id: `task-${t.id}`, label: t.title, date: t.due_date as string, kind: "checklista" as const })),
    ...payments
      .filter((p) => p.status !== "oplacone" && p.status !== "anulowane" && p.due_date)
      .map((p) => ({ id: `payment-${p.id}`, label: "Termin płatności", date: p.due_date as string, kind: "płatność" as const })),
    ...accommodations
      .filter((a) => a.payment_status !== "anulowane" && a.free_cancellation_until)
      .map((a) => ({
        id: `acc-${a.id}`,
        label: `Anulowanie „${a.name}”`,
        date: a.free_cancellation_until as string,
        kind: "anulowanie" as const,
      })),
  ]
    .filter((d) => d.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <h2 className="text-sm font-semibold text-[#201a2b]">Najbliższe terminy</h2>
      {deadlines.length === 0 ? (
        <p className="mt-3 text-xs italic text-[#9a919f]">Brak nadchodzących terminów.</p>
      ) : (
        <ul className="mt-3">
          {deadlines.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 border-b border-[#eee9f2] py-2 text-sm last:border-b-0">
              <div className="min-w-0">
                <p className="truncate text-[#201a2b]">{d.label}</p>
                <p className="text-xs text-[#706878]">{d.kind}</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-[#5b2a86]">
                {getDaysUntil(d.date) === 0 ? "dziś" : `za ${getDaysUntil(d.date)} dni`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
