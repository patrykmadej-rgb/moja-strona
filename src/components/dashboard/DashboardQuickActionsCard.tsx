import Link from "next/link";
import { CalendarPlus, Bed, WalletCards, GraduationCap, FilePlus2, NotebookPen, type LucideIcon } from "lucide-react";

type QuickAction = { label: string; href: string; icon: LucideIcon };

/**
 * Sekcja 10 briefu: max 6 kafelków, bez duplikowania akcji z nagłówka
 * (Dodaj artykuł / Dodaj odcinek podróży / Importuj dokument już tam są).
 * "Dodaj wersję"/"Dodaj notatkę"/"Dodaj źródło" z przykładu briefu wymagają
 * najpierw wybrania konkretnego artykułu (nie ma globalnego formularza) —
 * zamiast fikcyjnego "szybkiego" kafelka, który i tak wymagałby wyboru
 * artykułu, dostosowano zestaw do akcji faktycznie wykonywalnych od razu
 * (sekcja 10: "Jeżeli lepszy zestaw wynika z istniejących danych, dostosuj
 * go"), zachowując "Dodaj wersję" i "Dodaj notatkę" jako wejście do listy
 * artykułów, skąd te dwie akcje są jeden klik dalej.
 */
const ACTIONS: QuickAction[] = [
  { label: "Dodaj zjazd", href: "/lab/szkola/zjazdy/nowy", icon: CalendarPlus },
  { label: "Dodaj zakwaterowanie", href: "/lab/szkola/zakwaterowanie", icon: Bed },
  { label: "Dodaj semestr", href: "/lab/szkola/semestry", icon: GraduationCap },
  { label: "Dodaj koszt", href: "/lab/szkola/koszty", icon: WalletCards },
  { label: "Dodaj wersję", href: "/lab/artykuly", icon: FilePlus2 },
  { label: "Dodaj notatkę", href: "/lab/artykuly", icon: NotebookPen },
];

export default function DashboardQuickActionsCard() {
  return (
    <section aria-labelledby="dashboard-quick-actions-heading" className="flex h-full flex-col rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <h2 id="dashboard-quick-actions-heading" className="text-sm font-semibold text-[#201a2b]">
        Szybkie akcje
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-start gap-2 rounded-[12px] border border-[#e8e2ec] bg-[#f7f4ef] p-3 transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white text-[#5b2a86]">
                <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="text-xs font-medium text-[#201a2b]">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
