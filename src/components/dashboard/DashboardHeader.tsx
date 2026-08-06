import Link from "next/link";
import { FilePlus2, Plane, Inbox } from "lucide-react";

export default function DashboardHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-cormorant)] text-[32px] font-semibold leading-[1.1] text-[#201a2b]">Pulpit</h1>
        <p className="mt-1.5 text-[13px] text-[#706878]">Centrum dowodzenia dla szkoły psychoterapii i artykułów naukowych.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/lab/artykuly/nowy"
          className="flex h-10 items-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#32134f]"
        >
          <FilePlus2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Dodaj artykuł
        </Link>
        <Link
          href="/lab/szkola/podroze"
          className="flex h-10 items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-4 text-[13px] font-medium text-[#201a2b] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]"
        >
          <Plane className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Dodaj odcinek podróży
        </Link>
        <Link
          href="/lab/szkola/import"
          className="flex h-10 items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-4 text-[13px] font-medium text-[#201a2b] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]"
        >
          <Inbox className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Importuj dokument
        </Link>
      </div>
    </div>
  );
}
