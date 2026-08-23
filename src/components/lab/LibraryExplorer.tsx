"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Library, Plus, Search } from "lucide-react";
import LibraryTabs, { type LibraryTabKey } from "@/components/lab/LibraryTabs";
import LibraryBookCard from "@/components/lab/LibraryBookCard";
import LibraryBookFormModal from "@/components/lab/LibraryBookFormModal";
import LibraryDeleteModal from "@/components/lab/LibraryDeleteModal";
import LibraryLoanModal from "@/components/lab/LibraryLoanModal";
import EmptyState from "@/components/lab/EmptyState";
import { NO_CATEGORY_LABEL, NO_LANGUAGE_LABEL, READING_STATUSES, READING_STATUS_LABELS, type LibraryBook, type LibraryLoan, type OwnershipStatus, type ReadingStatus } from "@/lib/lab/library-types";

type ModalState =
  | { type: "add" }
  | { type: "edit"; book: LibraryBook }
  | { type: "delete"; book: LibraryBook }
  | { type: "loan"; book: LibraryBook }
  | null;

type SortKey = "newest" | "title" | "author" | "loanedAt";
type AvailabilityFilter = "all" | "available" | "loaned";

const ALL = "__all__";
const NONE = "__none__";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Ostatnio dodane" },
  { key: "title", label: "Tytuł" },
  { key: "author", label: "Autor" },
  { key: "loanedAt", label: "Data wypożyczenia" },
];

const AVAILABILITY_OPTIONS: { key: AvailabilityFilter; label: string }[] = [
  { key: "all", label: "Wszystkie" },
  { key: "available", label: "Dostępne" },
  { key: "loaned", label: "Wypożyczone" },
];

function DropdownButton({ label, children }: { label: string; children: (close: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-[38px] w-full items-center justify-between gap-2 rounded-[9px] border border-[#e8e2ec] bg-white px-3 text-[12px] text-[#4f4758] transition-colors hover:border-[#d9cde5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5b2a86]/40 sm:w-auto"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#706878]" strokeWidth={1.75} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 z-20 mt-1 max-h-72 w-56 overflow-y-auto rounded-[10px] border border-[#e8e2ec] bg-white py-1 shadow-[0_8px_24px_rgba(49,30,64,0.12)]"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function MenuItem({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={
        active
          ? "flex w-full items-center px-3 py-1.5 text-left text-sm text-[#5b2a86]"
          : "flex w-full items-center px-3 py-1.5 text-left text-sm text-[#201a2b] hover:bg-[#f1eafd] hover:text-[#4c1f72]"
      }
    >
      {children}
    </button>
  );
}

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

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-1 flex-col rounded-[14px] border border-[#e8e2ec] bg-white px-4 py-3 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <span className="font-[family-name:var(--font-cormorant)] text-[26px] font-semibold leading-none text-[#5b2a86]">{value}</span>
      <span className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[#a8873f]">{label}</span>
    </div>
  );
}

export default function LibraryExplorer({ books, loans }: { books: LibraryBook[]; loans: LibraryLoan[] }) {
  const [tab, setTab] = useState<LibraryTabKey>("owned");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [readingFilter, setReadingFilter] = useState<string>(ALL);
  const [languageFilter, setLanguageFilter] = useState<string>(ALL);
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
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

  const counters = useMemo(() => {
    let owned = 0;
    let read = 0;
    let wishlist = 0;
    let loanedActive = 0;
    for (const { book, activeLoan } of enriched) {
      if (book.ownership_status === "owned") {
        owned += 1;
        if (book.reading_status === "read") read += 1;
        if (activeLoan) loanedActive += 1;
      } else {
        wishlist += 1;
      }
    }
    return { owned, read, wishlist, loanedActive };
  }, [enriched]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const book of books) if (book.category) set.add(book.category);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pl"));
  }, [books]);

  const languages = useMemo(() => {
    const set = new Set<string>();
    for (const book of books) if (book.language) set.add(book.language);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pl"));
  }, [books]);

  const tabItems = useMemo(() => {
    if (tab === "owned") return enriched.filter((e) => e.book.ownership_status === "owned");
    if (tab === "wishlist") return enriched.filter((e) => e.book.ownership_status === "wishlist");
    return enriched;
  }, [enriched, tab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = tabItems.filter(({ book }) => {
      if (q) {
        const haystack = `${book.title} ${book.author} ${book.category ?? ""} ${book.isbn ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (categoryFilter === NONE && book.category) return false;
      if (categoryFilter !== ALL && categoryFilter !== NONE && book.category !== categoryFilter) return false;
      if (languageFilter === NONE && book.language) return false;
      if (languageFilter !== ALL && languageFilter !== NONE && book.language !== languageFilter) return false;
      if (readingFilter !== ALL && book.reading_status !== readingFilter) return false;
      return true;
    });

    if (availabilityFilter !== "all") {
      list = list.filter(({ book, activeLoan }) => {
        if (book.ownership_status !== "owned") return false;
        return availabilityFilter === "loaned" ? Boolean(activeLoan) : !activeLoan;
      });
    }

    const sorted = [...list];
    if (sort === "title") sorted.sort((a, b) => a.book.title.localeCompare(b.book.title, "pl"));
    else if (sort === "author") sorted.sort((a, b) => a.book.author.localeCompare(b.book.author, "pl"));
    else if (sort === "loanedAt") {
      sorted.sort((a, b) => {
        if (!a.activeLoan && !b.activeLoan) return 0;
        if (!a.activeLoan) return 1;
        if (!b.activeLoan) return -1;
        return b.activeLoan.loaned_at.localeCompare(a.activeLoan.loaned_at);
      });
    } else {
      sorted.sort((a, b) => b.book.created_at.localeCompare(a.book.created_at));
    }
    return sorted;
  }, [tabItems, query, categoryFilter, languageFilter, readingFilter, availabilityFilter, sort]);

  const hasAnyBooks = books.length > 0;
  const hasTabBooks = tabItems.length > 0;

  const emptyTabMessage =
    tab === "owned"
      ? { title: "Nie masz jeszcze żadnej książki", subtitle: "Dodaj pierwszą pozycję do swojej biblioteki." }
      : tab === "wishlist"
        ? { title: "Lista zakupowa jest pusta", subtitle: "Dodaj książkę, którą planujesz kupić." }
        : { title: "Biblioteka jest pusta", subtitle: "Dodaj pierwszą książkę." };

  const defaultOwnershipForAdd: OwnershipStatus = tab === "wishlist" ? "wishlist" : "owned";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-start justify-between gap-4 min-[720px]:flex-row min-[720px]:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8873f]">Kolekcja</p>
          <h1 className="mt-1 font-[family-name:var(--font-cormorant)] text-[32px] font-semibold leading-[1.1] text-[#201a2b]">Biblioteka</h1>
          <p className="mt-1.5 text-[13px] text-[#706878]">Książki psychologiczne i psychoterapeutyczne — posiadane i planowane do zakupu.</p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ type: "add" })}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#32134f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b2a86]"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Dodaj książkę
        </button>
      </div>

      {hasAnyBooks && (
        <div className="grid grid-cols-2 gap-3 min-[560px]:grid-cols-4">
          <StatTile label="Posiadane" value={counters.owned} />
          <StatTile label="Przeczytane" value={counters.read} />
          <StatTile label="Wypożyczone" value={counters.loanedActive} />
          <StatTile label="Do kupienia" value={counters.wishlist} />
        </div>
      )}

      <LibraryTabs tab={tab} onChange={setTab} />

      {hasAnyBooks && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-[380px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a79bb0]" strokeWidth={1.75} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj po tytule, autorze, kategorii, ISBN…"
              aria-label="Szukaj w bibliotece"
              className="h-[38px] w-full rounded-[9px] border border-[#e8e2ec] bg-white pl-9 pr-3 text-[13px] text-[#201a2b] outline-none transition-colors focus:border-[#5b2a86] sm:w-[380px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DropdownButton label={categoryFilter === ALL ? "Wszystkie kategorie" : categoryFilter === NONE ? NO_CATEGORY_LABEL : categoryFilter}>
              {(close) => (
                <>
                  <MenuItem active={categoryFilter === ALL} onClick={() => { setCategoryFilter(ALL); close(); }}>
                    Wszystkie kategorie
                  </MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c} active={categoryFilter === c} onClick={() => { setCategoryFilter(c); close(); }}>
                      {c}
                    </MenuItem>
                  ))}
                  <MenuItem active={categoryFilter === NONE} onClick={() => { setCategoryFilter(NONE); close(); }}>
                    {NO_CATEGORY_LABEL}
                  </MenuItem>
                </>
              )}
            </DropdownButton>

            <DropdownButton label={readingFilter === ALL ? "Wszystkie statusy" : READING_STATUS_LABELS[readingFilter as ReadingStatus]}>
              {(close) => (
                <>
                  <MenuItem active={readingFilter === ALL} onClick={() => { setReadingFilter(ALL); close(); }}>
                    Wszystkie statusy
                  </MenuItem>
                  {READING_STATUSES.map((s) => (
                    <MenuItem key={s} active={readingFilter === s} onClick={() => { setReadingFilter(s); close(); }}>
                      {READING_STATUS_LABELS[s]}
                    </MenuItem>
                  ))}
                </>
              )}
            </DropdownButton>

            <DropdownButton label={AVAILABILITY_OPTIONS.find((o) => o.key === availabilityFilter)?.label ?? "Wszystkie"}>
              {(close) => (
                <>
                  {AVAILABILITY_OPTIONS.map((o) => (
                    <MenuItem key={o.key} active={availabilityFilter === o.key} onClick={() => { setAvailabilityFilter(o.key); close(); }}>
                      {o.label}
                    </MenuItem>
                  ))}
                </>
              )}
            </DropdownButton>

            {languages.length > 0 && (
              <DropdownButton label={languageFilter === ALL ? "Wszystkie języki" : languageFilter === NONE ? NO_LANGUAGE_LABEL : languageFilter}>
                {(close) => (
                  <>
                    <MenuItem active={languageFilter === ALL} onClick={() => { setLanguageFilter(ALL); close(); }}>
                      Wszystkie języki
                    </MenuItem>
                    {languages.map((l) => (
                      <MenuItem key={l} active={languageFilter === l} onClick={() => { setLanguageFilter(l); close(); }}>
                        {l}
                      </MenuItem>
                    ))}
                    <MenuItem active={languageFilter === NONE} onClick={() => { setLanguageFilter(NONE); close(); }}>
                      {NO_LANGUAGE_LABEL}
                    </MenuItem>
                  </>
                )}
              </DropdownButton>
            )}

            <DropdownButton label={`Sortuj: ${SORT_OPTIONS.find((o) => o.key === sort)?.label ?? ""}`}>
              {(close) => (
                <>
                  {SORT_OPTIONS.map((o) => (
                    <MenuItem key={o.key} active={sort === o.key} onClick={() => { setSort(o.key); close(); }}>
                      {o.label}
                    </MenuItem>
                  ))}
                </>
              )}
            </DropdownButton>
          </div>
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
        <div className="grid grid-cols-1 gap-6 min-[720px]:grid-cols-2">
          {filtered.map(({ book, activeLoan, loanHistory }) => (
            <LibraryBookCard
              key={book.id}
              book={book}
              activeLoan={activeLoan}
              loanHistory={loanHistory}
              onEdit={() => setModal({ type: "edit", book })}
              onDeleteRequest={() => setModal({ type: "delete", book })}
              onLoanRequest={() => setModal({ type: "loan", book })}
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

      {toast && <Toast message={toast} />}
    </div>
  );
}
