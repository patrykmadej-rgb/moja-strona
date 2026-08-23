"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookCheck, ChevronDown, Loader2, MoreVertical, Undo2, UserRound } from "lucide-react";
import { moveBookOwnership, returnLibraryLoan } from "@/app/lab/biblioteka/actions";
import LibraryCoverImage from "@/components/lab/LibraryCoverImage";
import LibraryReadingStatusSelector from "@/components/lab/LibraryReadingStatusSelector";
import { formatDateOnly } from "@/lib/lab/format";
import { LOANED_STATUS_COLORS, LOANED_STATUS_LABEL, type LibraryBook, type LibraryLoan } from "@/lib/lab/library-types";

/**
 * Kompaktowy wiersz książki (uproszczenie Biblioteki — poprzednia wersja
 * pokazywała ISBN, rok, wydawnictwo, kategorię, notatki i duże przyciski
 * "Wypożycz"/"Edytuj" na każdej karcie; teraz TYLKO okładka, tytuł, autor,
 * jeden status i dyskretne menu). Reguły biznesowe (wypożyczenia, zmiana
 * statusu, przenoszenie między zakładkami) są niezmienione — reużywają te
 * same server actions/library-service co wcześniej, zmienia się wyłącznie
 * prezentacja.
 */

function CardMenu({
  isOwned,
  hasActiveLoan,
  pending,
  onEdit,
  onFindCoverRequest,
  onLoanRequest,
  onToggleLoanDetails,
  onReturn,
  onMoveToWishlist,
  onDeleteRequest,
}: {
  isOwned: boolean;
  hasActiveLoan: boolean;
  pending: boolean;
  onEdit: () => void;
  onFindCoverRequest: () => void;
  onLoanRequest: () => void;
  onToggleLoanDetails: () => void;
  onReturn: () => void;
  onMoveToWishlist: () => void;
  onDeleteRequest: () => void;
}) {
  const [open, setOpen] = useState(false);

  const item = (label: string, onClick: () => void, danger = false) => (
    <button
      type="button"
      role="menuitem"
      disabled={pending}
      onClick={() => {
        setOpen(false);
        onClick();
      }}
      className={
        danger
          ? "flex w-full items-center px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
          : "flex w-full items-center px-3 py-1.5 text-left text-sm text-[#201a2b] hover:bg-[#f1eafd] disabled:opacity-60"
      }
    >
      {label}
    </button>
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Więcej działań"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-[#9a919f] transition-colors hover:bg-[#f7f4ef] hover:text-[#5b2a86] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5b2a86]/40"
      >
        <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div role="menu" className="absolute right-0 z-20 mt-1 w-56 rounded-[10px] border border-[#e6deec] bg-white py-1 shadow-[0_8px_24px_rgba(49,30,64,0.12)]">
            {item("Edytuj", onEdit)}
            {item("Znajdź okładkę", onFindCoverRequest)}
            {isOwned && !hasActiveLoan && item("Wypożycz", onLoanRequest)}
            {isOwned && hasActiveLoan && item("Szczegóły wypożyczenia", onToggleLoanDetails)}
            {isOwned && hasActiveLoan && item("Oznacz jako zwróconą", onReturn)}
            {isOwned && !hasActiveLoan && item("Przenieś na listę zakupową", onMoveToWishlist)}
            {item("Usuń", onDeleteRequest, true)}
          </div>
        </>
      )}
    </div>
  );
}

export default function LibraryBookCard({
  book,
  activeLoan,
  loanHistory,
  onEdit,
  onDeleteRequest,
  onLoanRequest,
  onFindCoverRequest,
  onToast,
}: {
  book: LibraryBook;
  activeLoan: LibraryLoan | null;
  loanHistory: LibraryLoan[];
  onEdit: () => void;
  onDeleteRequest: () => void;
  onLoanRequest: () => void;
  onFindCoverRequest: () => void;
  onToast: (message: string) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const isOwned = book.ownership_status === "owned";

  const handleMoveToOwned = async () => {
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

  const handleMoveToWishlist = async () => {
    if (pending) return;
    setPending(true);
    const result = await moveBookOwnership(book.id, "wishlist");
    setPending(false);
    if ("error" in result) {
      onToast(result.error);
    } else {
      onToast("Przeniesiono na listę zakupową.");
      router.refresh();
    }
  };

  const handleReturn = async () => {
    if (pending || !activeLoan) return;
    setPending(true);
    const result = await returnLibraryLoan(activeLoan.id);
    setPending(false);
    if ("error" in result) {
      onToast(result.error);
    } else {
      onToast("Oznaczono jako zwróconą.");
      router.refresh();
    }
  };

  return (
    <div className="rounded-[12px] border border-[#e8e2ec] bg-white px-3 py-2.5">
      <div className="flex items-center gap-3">
        <LibraryCoverImage url={book.cover_url} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#201a2b]">{book.title}</p>
          <p className="truncate text-xs text-[#706878]">{book.author}</p>

          {isOwned && (
            <div className="mt-1">
              {activeLoan ? (
                <button
                  type="button"
                  onClick={() => setDetailsOpen((v) => !v)}
                  className="inline-flex min-h-[24px] items-center gap-1 rounded-[8px] px-[8px] py-[3px] text-[11px] font-medium"
                  style={{ background: LOANED_STATUS_COLORS.bg, color: LOANED_STATUS_COLORS.text }}
                >
                  {LOANED_STATUS_LABEL}
                  <ChevronDown className={`h-3 w-3 transition-transform ${detailsOpen ? "rotate-180" : ""}`} strokeWidth={2} />
                </button>
              ) : (
                <LibraryReadingStatusSelector bookId={book.id} status={book.reading_status} onToast={onToast} />
              )}
            </div>
          )}
        </div>

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

        <CardMenu
          isOwned={isOwned}
          hasActiveLoan={Boolean(activeLoan)}
          pending={pending}
          onEdit={onEdit}
          onFindCoverRequest={onFindCoverRequest}
          onLoanRequest={onLoanRequest}
          onToggleLoanDetails={() => setDetailsOpen((v) => !v)}
          onReturn={handleReturn}
          onMoveToWishlist={handleMoveToWishlist}
          onDeleteRequest={onDeleteRequest}
        />
      </div>

      {detailsOpen && isOwned && (
        <div className="mt-2.5 rounded-[10px] border border-[#f0ebf5] bg-[#faf8fc] px-3 py-2.5 text-xs">
          {activeLoan ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2 text-[#4f4758]">
                <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a76616]" strokeWidth={1.75} aria-hidden="true" />
                <div className="min-w-0">
                  Wypożyczona — {activeLoan.borrower_name}, od {formatDateOnly(activeLoan.loaned_at)}
                  {activeLoan.note && <p className="mt-0.5 text-[#9a919f]">{activeLoan.note}</p>}
                </div>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={handleReturn}
                className="flex h-8 items-center justify-center gap-1.5 self-start rounded-[9px] border border-[#e6deec] px-3 text-xs font-medium text-[#5b2a86] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] disabled:opacity-60"
              >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} /> : <Undo2 className="h-3.5 w-3.5" strokeWidth={1.75} />}
                Oznacz jako zwróconą
              </button>
            </div>
          ) : (
            <p className="text-[#706878]">Książka jest dostępna.</p>
          )}

          {loanHistory.length > 0 && (
            <ul className="mt-2.5 flex flex-col gap-1 border-t border-[#eee9f2] pt-2 text-[#9a919f]">
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
    </div>
  );
}
