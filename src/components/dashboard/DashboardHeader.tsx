import Link from "next/link";
import { FilePlus2, Plane, Inbox } from "lucide-react";

export default function DashboardHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-cormorant)] text-[22px] font-semibold leading-[1.1] text-[#201a2b] min-[768px]:text-[32px]">
          Pulpit
        </h1>
        <p className="mt-1.5 hidden text-[13px] text-[#706878] min-[768px]:block">
          Centrum dowodzenia dla szkoły psychoterapii i artykułów naukowych.
        </p>
      </div>
      {/* Poniżej 768px cały rząd przycisków znika (sekcja 2 briefu: "zastąp
          wielkie przyciski mniejszymi, praktycznymi podglądami"). "Dodaj
          artykuł" nadal jest dostępny na mobile przez bottom nav → Więcej →
          Artykuły (ArticlesPageHeader ma własny przycisk). "Dodaj odcinek
          podróży"/"Importuj dokument" są świadomie mniej eksponowane na
          telefonie — mobilny moduł Szkoły (sekcja 3 briefu) pokazuje
          uproszczoną listę zjazdów zamiast pełnej nawigacji podstron, więc
          te dwie akcje pozostają w pełni dostępne na desktopie bez zmian.
          Od 768px rząd wraca dokładnie w dotychczasowej postaci. */}
      <div className="hidden w-full flex-col gap-2 min-[500px]:flex-row min-[500px]:flex-wrap min-[500px]:items-center min-[768px]:flex min-[768px]:w-auto">
        <Link
          href="/lab/artykuly/nowy"
          className="flex h-10 items-center justify-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#32134f]"
        >
          <FilePlus2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Dodaj artykuł
        </Link>
        <Link
          href="/lab/szkola/podroze"
          className="flex h-10 items-center justify-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-4 text-[13px] font-medium text-[#201a2b] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]"
        >
          <Plane className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Dodaj odcinek podróży
        </Link>
        <Link
          href="/lab/szkola/import"
          className="flex h-10 items-center justify-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-4 text-[13px] font-medium text-[#201a2b] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]"
        >
          <Inbox className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Importuj dokument
        </Link>
      </div>
    </div>
  );
}
