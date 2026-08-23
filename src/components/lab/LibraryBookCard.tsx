"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookCheck, ChevronDown, History, Loader2, MoreVertical, Pencil, ShoppingCart, Undo2, UserRound } from "lucide-react";
import { moveBookOwnership, returnLibraryLoan } from "@/app/lab/biblioteka/actions";
import LibraryReadingStatusSelector from "@/components/lab/LibraryReadingStatusSelector";
import { formatDateOnly } from "@/lib/lab/format";
import { NO_CATEGORY_LABEL, OWNERSHIP_STATUS_COLORS, OWNERSHIP_STATUS_LABELS, type LibraryBook, type LibraryLoan } from "@/lib/lab/library-types";

function CardMenu({
  showMoveToWishlist,
  pending,
  onMoveToWishlist,
  onDeleteRequest,
}: {
  showMoveToWishlist: boolean;
  pending: boolean;
  onMoveToWishlist: () => void;
  onDeleteRequest: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Więcej działań"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-[9px] text-[#9a919f] transition-colors hover:bg-[#f7f4ef] hover:text-[#5b2a86] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5b2a86]/40"
      >
        <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
      </button>
      {open && (
        <>
          {/* Warstwa łapiąca klik poza menu — ten sam prosty wzorzec co reszta /lab (bez portalu), wystarczający bo karta nie ma overflow:hidden. */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div role="menu" className="absolute right-0 z-20 mt-1 w-56 rounded-[10px] border border-[#e6deec] bg-white py-1 shadow-[0_8px_24px_rgba(49,30,64,0.12)]">
            {showMoveToWishlist && (
              <button
                type="button"
                role="menuitem"
                disabled={pending}
                onClick={() => {
                  setOpen(false);
                  onMoveToWishlist();
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-[#201a2b] hover:bg-[#f1eafd] disabled:opacity-60"
              >
                <ShoppingCart className="h-3.5 w-3.5" strokeWidth={1.75} />
                Przenieś na listę zakupową
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onDeleteRequest();
              }}
              className="flex w-full items-center px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Usuń
            </button>
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
  onToast,
}: {
  book: LibraryBook;
  activeLoan: LibraryLoan | null;
  loanHistory: LibraryLoan[];
  onEdit: () => void;
  onDeleteRequest: () => void;
  onLoanRequest: () => void;
  onToast: (message: string) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const isOwned = book.ownership_status === "owned";
  const ownershipColors = OWNERSHIP_STATUS_COLORS[book.ownership_status];

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

  const metaParts = [book.category, book.language, book.year ? String(book.year) : null, book.publisher].filter(Boolean) as string[];

  return (
    <article className="flex flex-col rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-[family-name:var(--font-cormorant)] text-[19px] font-semibold text-[#201a2b]">{book.title}</h3>
          </div>
          <p className="mt-0.5 truncate text-sm text-[#4f4758]">{book.author}</p>
        </div>
        <CardMenu
          showMoveToWishlist={isOwned && !activeLoan}
          pending={pending}
          onMoveToWishlist={handleMoveToWishlist}
          onDeleteRequest={onDeleteRequest}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          className="inline-flex min-h-[26px] items-center gap-[6px] rounded-[8px] px-[9px] py-[4px] text-[11px] font-medium"
          style={{ background: ownershipColors.bg, color: ownershipColors.text }}
        >
          <span className="h-[6px] w-[6px] shrink-0 rounded-full" style={{ background: ownershipColors.text }} />
          {OWNERSHIP_STATUS_LABELS[book.ownership_status]}
        </span>
        {isOwned && <LibraryReadingStatusSelector bookId={book.id} status={book.reading_status} onToast={onToast} />}
      </div>

      {metaParts.length > 0 && (
        <p className="mt-2.5 text-xs text-[#9a919f]">
          {metaParts.map((part, i) => (i === 0 ? part : ` · ${part}`))}
        </p>
      )}
      {book.category === null && <p className="mt-2.5 text-xs text-[#c9c1cf]">{NO_CATEGORY_LABEL}</p>}

      {book.isbn && <p className="mt-1 font-mono text-[11px] text-[#9a919f]">ISBN {book.isbn}</p>}

      {book.notes && <p className="mt-2.5 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-[#3c3542]">{book.notes}</p>}

      {isOwned && (
        <div className="mt-3.5 rounded-[10px] border border-[#f0ebf5] bg-[#faf8fc] px-3 py-2.5">
          {activeLoan ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a76616]" strokeWidth={1.75} aria-hidden="true" />
                <div className="min-w-0 text-xs text-[#4f4758]">
                  <span className="font-medium text-[#a76616]">Wypożyczona</span> — {activeLoan.borrower_name}, od{" "}
                  {formatDateOnly(activeLoan.loaned_at)}
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
            <p className="flex items-center gap-1.5 text-xs font-medium text-[#3d6b2f]">
              <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-[#3d6b2f]" />
              Dostępna
            </p>
          )}
        </div>
      )}

      {loanHistory.length > 0 && (
        <div className="mt-2.5">
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-[#706878] hover:text-[#5b2a86]"
          >
            <History className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            Historia wypożyczeń ({loanHistory.length})
            <ChevronDown className={`h-3 w-3 transition-transform ${historyOpen ? "rotate-180" : ""}`} strokeWidth={1.75} />
          </button>
          {historyOpen && (
            <ul className="mt-1.5 flex flex-col gap-1 border-l border-[#e8e2ec] pl-2.5 text-xs text-[#9a919f]">
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

      <div className="mt-4 flex items-center gap-2 border-t border-[#f0ebf5] pt-4">
        {!isOwned ? (
          <button
            type="button"
            disabled={pending}
            onClick={handleMoveToOwned}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-3 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : <BookCheck className="h-4 w-4" strokeWidth={1.75} />}
            Mam już tę książkę
          </button>
        ) : !activeLoan ? (
          <button
            type="button"
            onClick={onLoanRequest}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-3 text-sm font-medium text-white transition-colors hover:bg-[#32134f]"
          >
            <UserRound className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            Wypożycz
          </button>
        ) : null}
        <button
          type="button"
          onClick={onEdit}
          className={
            isOwned && activeLoan
              ? "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-[#e6deec] px-3 text-sm text-[#706878] transition-colors hover:border-[#d9cde5] hover:bg-[#f7f4ef] hover:text-[#5b2a86]"
              : "flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e6deec] px-3 text-sm text-[#706878] transition-colors hover:border-[#d9cde5] hover:bg-[#f7f4ef] hover:text-[#5b2a86]"
          }
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          Edytuj
        </button>
      </div>
    </article>
  );
}
