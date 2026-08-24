"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { BookCheck, ImagePlus, Loader2, Pencil, ShoppingCart, Trash2, Undo2, UserRound, X } from "lucide-react";
import { moveBookOwnership, returnLibraryLoan } from "@/app/lab/biblioteka/actions";
import LibraryCoverImage from "@/components/lab/LibraryCoverImage";
import LibraryReadingStatusSelector from "@/components/lab/LibraryReadingStatusSelector";
import { formatDateOnly } from "@/lib/lab/format";
import type { LibraryBook, LibraryLoan } from "@/lib/lab/library-types";

const actionButtonClass =
  "flex h-10 items-center gap-1.5 rounded-[10px] border border-[#e6deec] px-3.5 text-sm font-medium text-[#201a2b] transition-colors hover:border-[#d9cde5] hover:bg-[#f7f4ef]";

/**
 * Panel szczegółów książki — otwierany kliknięciem całego wiersza na liście
 * (sekcja 4 briefu, zastępuje usunięte menu "⋮"). Skupia wszystkie działania
 * (edycja, zmiana statusu, wypożyczenie, zwrot, usunięcie, zmiana okładki)
 * w jednym miejscu zamiast rozpraszać je po ikonach w wierszu listy.
 * Edytuj/Zmień okładkę/Usuń/Wypożycz NIE mają tu własnej logiki — po prostu
 * zamykają ten panel i otwierają odpowiedni, JUŻ ISTNIEJĄCY modal w
 * LibraryExplorer.tsx (LibraryBookFormModal/LibraryCoverPickerModal/
 * LibraryDeleteModal/LibraryLoanModal), żeby nie duplikować formularzy.
 */
export default function LibraryBookDetailsModal({
  book,
  activeLoan,
  loanHistory,
  onClose,
  onEdit,
  onFindCover,
  onDeleteRequest,
  onLoanRequest,
  onToast,
}: {
  book: LibraryBook;
  activeLoan: LibraryLoan | null;
  loanHistory: LibraryLoan[];
  onClose: () => void;
  onEdit: () => void;
  onFindCover: () => void;
  onDeleteRequest: () => void;
  onLoanRequest: () => void;
  onToast: (message: string) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const headingId = useId();

  const isOwned = book.ownership_status === "owned";

  const handleMoveToOwned = async () => {
    if (pending) return;
    setPending(true);
    const result = await moveBookOwnership(book.id, "owned");
    setPending(false);
    if ("error" in result) {
      onToast(result.error);
      return;
    }
    router.refresh();
    onToast("Przeniesiono do „Moje książki”.");
    onClose();
  };

  const handleMoveToWishlist = async () => {
    if (pending) return;
    setPending(true);
    const result = await moveBookOwnership(book.id, "wishlist");
    setPending(false);
    if ("error" in result) {
      onToast(result.error);
      return;
    }
    router.refresh();
    onToast("Przeniesiono na listę zakupową.");
    onClose();
  };

  const handleReturn = async () => {
    if (pending || !activeLoan) return;
    setPending(true);
    const result = await returnLibraryLoan(activeLoan.id);
    setPending(false);
    if ("error" in result) {
      onToast(result.error);
      return;
    }
    router.refresh();
    onToast("Oznaczono jako zwróconą.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 min-[560px]:items-center" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <div className="flex max-h-[85dvh] w-full max-w-[480px] flex-col overflow-y-auto rounded-t-[20px] bg-white p-5 shadow-[0_20px_60px_rgba(30,15,45,0.25)] min-[560px]:rounded-[16px] min-[560px]:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <LibraryCoverImage url={book.cover_url} size="large" />
            <div className="min-w-0">
              <h2 id={headingId} className="truncate font-[family-name:var(--font-cormorant)] text-[19px] font-semibold text-[#201a2b]">
                {book.title}
              </h2>
              <p className="truncate text-sm text-[#706878]">{book.author}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[#9a919f] transition-colors hover:bg-[#f7f4ef] hover:text-[#5b2a86]"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        {isOwned && (
          <div className="mt-4 flex flex-col gap-3 rounded-[12px] border border-[#f0ebf5] bg-[#faf8fc] p-3.5">
            {activeLoan ? (
              <>
                <div className="flex items-start gap-2 text-sm text-[#4f4758]">
                  <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-[#a76616]" strokeWidth={1.75} aria-hidden="true" />
                  <div className="min-w-0">
                    <span className="font-medium text-[#a76616]">Wypożyczona</span> — {activeLoan.borrower_name}, od{" "}
                    {formatDateOnly(activeLoan.loaned_at)}
                    {activeLoan.note && <p className="mt-0.5 text-xs text-[#9a919f]">{activeLoan.note}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={handleReturn}
                  className="flex h-9 items-center justify-center gap-1.5 self-start rounded-[9px] border border-[#e6deec] px-3 text-xs font-medium text-[#5b2a86] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] disabled:opacity-60"
                >
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} /> : <Undo2 className="h-3.5 w-3.5" strokeWidth={1.75} />}
                  Oznacz jako zwróconą
                </button>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-medium text-[#3d6b2f]">Status czytania</span>
                <LibraryReadingStatusSelector bookId={book.id} status={book.reading_status} onToast={onToast} />
              </div>
            )}

            {loanHistory.length > 0 && (
              <ul className="flex flex-col gap-1 border-t border-[#eee9f2] pt-2.5 text-xs text-[#9a919f]">
                {loanHistory.map((loan) => (
                  <li key={loan.id}>
                    {loan.borrower_name} — {formatDateOnly(loan.loaned_at)}
                    {loan.returned_at ? ` → ${formatDateOnly(loan.returned_at)}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {!isOwned && (
            <button type="button" disabled={pending} onClick={handleMoveToOwned} className="flex h-10 items-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-60">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <BookCheck className="h-4 w-4" strokeWidth={1.75} />}
              Kupiona
            </button>
          )}
          {isOwned && !activeLoan && (
            <button type="button" onClick={onLoanRequest} className={actionButtonClass}>
              <UserRound className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Wypożycz
            </button>
          )}
          <button type="button" onClick={onEdit} className={actionButtonClass}>
            <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            Edytuj
          </button>
          <button type="button" onClick={onFindCover} className={actionButtonClass}>
            <ImagePlus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            Zmień okładkę
          </button>
          {isOwned && !activeLoan && (
            <button type="button" disabled={pending} onClick={handleMoveToWishlist} className={`${actionButtonClass} disabled:opacity-60`}>
              <ShoppingCart className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Na listę zakupową
            </button>
          )}
          <button
            type="button"
            onClick={onDeleteRequest}
            className="flex h-10 items-center gap-1.5 rounded-[10px] border border-transparent px-3.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            Usuń
          </button>
        </div>
      </div>
    </div>
  );
}
