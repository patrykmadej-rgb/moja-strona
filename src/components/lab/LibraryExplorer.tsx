"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, Library, Plus, Search } from "lucide-react";
import LibraryTabs, { type LibraryTabKey } from "@/components/lab/LibraryTabs";
import LibraryBookCard from "@/components/lab/LibraryBookCard";
import LibraryBookFormModal from "@/components/lab/LibraryBookFormModal";
import LibraryDeleteModal from "@/components/lab/LibraryDeleteModal";
import LibraryLoanModal from "@/components/lab/LibraryLoanModal";
import LibraryPhotoAddModal from "@/components/lab/LibraryPhotoAddModal";
import LibraryCoverPickerModal from "@/components/lab/LibraryCoverPickerModal";
import EmptyState from "@/components/lab/EmptyState";
import type { LibraryBook, LibraryLoan, OwnershipStatus } from "@/lib/lab/library-types";

type ModalState =
  | { type: "add" }
  | { type: "edit"; book: LibraryBook }
  | { type: "delete"; book: LibraryBook }
  | { type: "loan"; book: LibraryBook }
  | { type: "findCover"; book: LibraryBook }
  | { type: "photo" }
  | null;

function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-[10px] border border-[#d9cde5] bg-[#24152f] px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_30px_rgba(24,12,32,0.28)]"
    >
      {message}
    </div>
  );
}

/**
 * Biblioteka — uproszczony widok (poprzednia wersja miała zakładkę
 * "Wszystkie", cztery dropdowny filtrów, selektor sortowania i liczniki;
 * teraz: dwie zakładki, jedna wyszukiwarka po tytule/autorze, domyślne
 * sortowanie "ostatnio dodane" bez selektora). Reguły biznesowe (RLS,
 * server actions, wykrywanie duplikatów, wypożyczenia) są niezmienione.
 */
export default function LibraryExplorer({ books, loans }: { books: LibraryBook[]; loans: LibraryLoan[] }) {
  const [tab, setTab] = useState<LibraryTabKey>("owned");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const loansByBook = useMemo(() => {
    const map = new Map<string, LibraryLoan[]>();
    for (const loan of loans) {
      const list = map.get(loan.book_id) ?? [];
      list.push(loan);
      map.set(loan.book_id, list);
    }
    for (const list of map.values()) list.sort((a, b) => b.loaned_at.localeCompare(a.loaned_at));
    return map;
  }, [loans]);

  const enriched = useMemo(
    () =>
      books.map((book) => {
        const bookLoans = loansByBook.get(book.id) ?? [];
        const activeLoan = bookLoans.find((l) => !l.returned_at) ?? null;
        const loanHistory = bookLoans.filter((l) => l.returned_at);
        return { book, activeLoan, loanHistory };
      }),
    [books, loansByBook],
  );

  const tabItems = useMemo(() => enriched.filter((e) => e.book.ownership_status === tab), [enriched, tab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? tabItems.filter(({ book }) => `${book.title} ${book.author}`.toLowerCase().includes(q)) : tabItems;
    // Ostatnio dodane — jedyne, stałe sortowanie (bez selektora w uproszczonym widoku).
    return [...list].sort((a, b) => b.book.created_at.localeCompare(a.book.created_at));
  }, [tabItems, query]);

  const hasAnyBooks = books.length > 0;
  const hasTabBooks = tabItems.length > 0;

  const emptyTabMessage =
    tab === "owned"
      ? { title: "Nie masz jeszcze żadnej książki", subtitle: "Dodaj pierwszą pozycję do swojej biblioteki." }
      : { title: "Lista zakupowa jest pusta", subtitle: "Dodaj książkę, którą planujesz kupić." };

  const defaultOwnershipForAdd: OwnershipStatus = tab;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-start justify-between gap-4 min-[720px]:flex-row min-[720px]:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8873f]">Kolekcja</p>
          <h1 className="mt-1 font-[family-name:var(--font-cormorant)] text-[32px] font-semibold leading-[1.1] text-[#201a2b]">Biblioteka</h1>
          <p className="mt-1.5 text-[13px] text-[#706878]">Książki psychologiczne i psychoterapeutyczne — posiadane i planowane do zakupu.</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 min-[720px]:w-auto min-[720px]:shrink-0">
          <button
            type="button"
            onClick={() => setModal({ type: "photo" })}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-[#e6deec] bg-white px-4 text-[13px] font-medium text-[#5b2a86] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b2a86]/40 min-[720px]:flex-none"
          >
            <Camera className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            Dodaj ze zdjęcia
          </button>
          <button
            type="button"
            onClick={() => setModal({ type: "add" })}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#32134f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b2a86] min-[720px]:flex-none"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Dodaj książkę
          </button>
        </div>
      </div>

      <LibraryTabs tab={tab} onChange={setTab} />

      {hasAnyBooks && (
        <div className="relative w-full sm:max-w-[380px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a79bb0]" strokeWidth={1.75} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj tytułu lub autora…"
            aria-label="Szukaj tytułu lub autora"
            className="h-[38px] w-full rounded-[9px] border border-[#e8e2ec] bg-white pl-9 pr-3 text-[13px] text-[#201a2b] outline-none transition-colors focus:border-[#5b2a86]"
          />
        </div>
      )}

      {!hasAnyBooks ? (
        <div className="rounded-[16px] border border-[#e8e2ec] bg-white px-6 py-10 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <EmptyState
            icon={Library}
            title="Twoja biblioteka jest pusta"
            subtitle="Dodaj pierwszą książkę, którą posiadasz, albo taką, którą planujesz kupić."
            action={{ label: "Dodaj pierwszą książkę", onClick: () => setModal({ type: "add" }) }}
          />
        </div>
      ) : !hasTabBooks ? (
        <div className="rounded-[16px] border border-[#e8e2ec] bg-white px-6 py-10 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <EmptyState icon={Library} title={emptyTabMessage.title} subtitle={emptyTabMessage.subtitle} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[16px] border border-[#e8e2ec] bg-white px-6 py-10 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <EmptyState icon={Search} title="Nie znaleziono pasujących książek." compact />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(({ book, activeLoan, loanHistory }) => (
            <LibraryBookCard
              key={book.id}
              book={book}
              activeLoan={activeLoan}
              loanHistory={loanHistory}
              onEdit={() => setModal({ type: "edit", book })}
              onDeleteRequest={() => setModal({ type: "delete", book })}
              onLoanRequest={() => setModal({ type: "loan", book })}
              onFindCoverRequest={() => setModal({ type: "findCover", book })}
              onToast={(message) => setToast(message)}
            />
          ))}
        </div>
      )}

      {modal?.type === "add" && (
        <LibraryBookFormModal
          mode="add"
          initialOwnershipStatus={defaultOwnershipForAdd}
          onClose={() => setModal(null)}
          onSaved={(message) => {
            setModal(null);
            setToast(message);
          }}
        />
      )}
      {modal?.type === "edit" && (
        <LibraryBookFormModal
          mode="edit"
          item={modal.book}
          onClose={() => setModal(null)}
          onSaved={(message) => {
            setModal(null);
            setToast(message);
          }}
        />
      )}
      {modal?.type === "delete" && (
        <LibraryDeleteModal
          book={modal.book}
          onClose={() => setModal(null)}
          onDeleted={(message) => {
            setModal(null);
            setToast(message);
          }}
        />
      )}
      {modal?.type === "loan" && (
        <LibraryLoanModal
          book={modal.book}
          onClose={() => setModal(null)}
          onSaved={(message) => {
            setModal(null);
            setToast(message);
          }}
        />
      )}
      {modal?.type === "findCover" && (
        <LibraryCoverPickerModal
          book={modal.book}
          onClose={() => setModal(null)}
          onSaved={(message) => {
            setModal(null);
            setToast(message);
          }}
        />
      )}
      {modal?.type === "photo" && (
        <LibraryPhotoAddModal
          initialOwnershipStatus={defaultOwnershipForAdd}
          onClose={() => setModal(null)}
          onDone={(message) => {
            setModal(null);
            setToast(message);
          }}
        />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
