import Link from "next/link";
import type { DashboardFilterKey } from "@/lib/dashboard/types";

const OPTIONS: { key: DashboardFilterKey; label: string }[] = [
  { key: "wszystko", label: "Wszystko" },
  { key: "szkola", label: "Szkoła" },
  { key: "artykuly", label: "Artykuły" },
];

/**
 * Sekcja 4 briefu: zwykłe linki (?zakres=...), bez lokalnego stanu Reacta —
 * URL jest jedynym źródłem prawdy, więc filtr jest stabilny przy odświeżeniu
 * "za darmo" i działa nawet bez JS. `filter` przychodzi z searchParams strony
 * (Server Component), filtrowanie faktycznych list dzieje się tam.
 */
export default function DashboardFilterToggle({ current }: { current: DashboardFilterKey }) {
  return (
    <div role="group" aria-label="Filtruj pulpit" className="inline-flex items-center gap-0.5 self-start rounded-[10px] border border-[#e8e2ec] bg-[#fbfafc] p-1">
      {OPTIONS.map((option) => {
        const isActive = option.key === current;
        return (
          <Link
            key={option.key}
            href={option.key === "wszystko" ? "/lab" : `/lab?zakres=${option.key}`}
            aria-current={isActive ? "true" : undefined}
            className={
              isActive
                ? "rounded-[7px] bg-[#f1eafd] px-3 py-1.5 text-[12px] font-medium text-[#5b2a86]"
                : "rounded-[7px] px-3 py-1.5 text-[12px] font-medium text-[#706878] transition-colors hover:bg-white hover:text-[#4c1f72]"
            }
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
