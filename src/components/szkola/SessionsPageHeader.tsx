import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";

export default function SessionsPageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-cormorant)] text-[32px] font-semibold leading-[1.1] text-[#201a2b]">
          Zjazdy
        </h1>
        <p className="mt-1.5 text-[13px] text-[#706878]">
          Wszystkie zjazdy szkoły psychoterapii — przygotowanie, podróż i koszty w jednym miejscu.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          disabled
          title="Synchronizacja Google Calendar jest w przygotowaniu"
          className="flex h-10 items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-4 text-[13px] font-medium text-[#9a919f] opacity-60"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
          Synchronizuj kalendarz
        </button>
        <Link
          href="/lab/szkola/zjazdy/nowy"
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#32134f]"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Dodaj zjazd
        </Link>
      </div>
    </div>
  );
}
