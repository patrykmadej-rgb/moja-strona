"use client";

import { useState, type MouseEventHandler } from "react";
import { useRouter } from "next/navigation";
import { BookCheck, Loader2 } from "lucide-react";
import { moveBookOwnership } from "@/app/lab/biblioteka/actions";
import LibraryCoverImage from "@/components/lab/LibraryCoverImage";
import LibraryStatusIcon from "@/components/lab/LibraryStatusIcon";
import type { LibraryBook, LibraryLoan } from "@/lib/lab/library-types";

/**
 * Kompaktowy, w pełni klikalny wiersz książki (sekcja 4 briefu — usunięte
 * menu "⋮"; cała pozycja otwiera panel szczegółów, gdzie żyją wszystkie
 * działania: edycja, status, wypożyczenie/zwrot, usunięcie, okładka —
 * LibraryBookDetailsModal.tsx). Jedyny wyjątek to "Kupiona" na liście
 * zakupowej: to świadomie zostaje jako natychmiastowa akcja w wierszu
 * (sekcja 4 briefu: "łatwo dostępna akcja Kupiona"), z `stopPropagation`,
 * żeby nie otwierała przy okazji panelu szczegółów.
 */
export default function LibraryBookCard({
  book,
  activeLoan,
  onOpenDetails,
  onToast,
}: {
  book: LibraryBook;
  activeLoan: LibraryLoan | null;
  onOpenDetails: () => void;
  onToast: (message: string) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const isOwned = book.ownership_status === "owned";

  const handleMoveToOwned: MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    const result = await moveBookOwnership(book.id, "owned");
    setPending(false);
    if ("error" in result) {
      onToast(result.error);
    } else {
      onToast("Przeniesiono do „Moje książki”.");
      router.refresh();
    }
  };

  const displayStatus = isOwned ? (activeLoan ? "loaned" : book.reading_status) : null;

  // role="button" na <div>, nie zagnieżdżony <button> — wewnątrz jest drugi,
  // realny <button> ("Kupiona"), a interaktywna treść w interaktywnej treści
  // jest nieprawidłowa w HTML (przeglądarka po cichu "zamyka" zewnętrzny
  // <button>, łamiąc kliki). Ten sam wzorzec co ArticleTableRow.tsx.
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpenDetails();
      }}
      className="flex w-full cursor-pointer items-center gap-3 rounded-[12px] border border-[#e8e2ec] bg-white px-3 py-2.5 text-left transition-colors hover:border-[#d9cde5] hover:bg-[#faf8fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5b2a86]/40"
    >
      <LibraryCoverImage url={book.cover_url} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#201a2b]">{book.title}</p>
        <p className="truncate text-xs text-[#706878]">{book.author}</p>
      </div>

      {displayStatus && <LibraryStatusIcon status={displayStatus} />}

      {!isOwned && (
        <button
          type="button"
          disabled={pending}
          onClick={handleMoveToOwned}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] bg-[#5b2a86] px-3 text-xs font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} /> : <BookCheck className="h-3.5 w-3.5" strokeWidth={1.75} />}
          Kupiona
        </button>
      )}
    </div>
  );
}
