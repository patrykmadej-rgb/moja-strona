"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Clipboard, Plus, Search } from "lucide-react";
import ClipboardCard from "@/components/lab/ClipboardCard";
import ClipboardFormModal from "@/components/lab/ClipboardFormModal";
import ClipboardDeleteModal from "@/components/lab/ClipboardDeleteModal";
import EmptyState from "@/components/lab/EmptyState";
import { NO_CATEGORY_LABEL, NO_LANGUAGE_LABEL, type ClipboardItem } from "@/lib/lab/clipboard-types";

type ModalState = { type: "add" } | { type: "edit"; item: ClipboardItem } | { type: "delete"; item: ClipboardItem } | null;

const CATEGORY_ALL = "Wszystkie kategorie";
const LANGUAGE_ALL = "Wszystkie języki";
const CATEGORY_NONE = "__none__";
const LANGUAGE_NONE = "__none__";

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

export default function ClipboardExplorer({ items }: { items: ClipboardItem[] }) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(CATEGORY_ALL);
  const [languageFilter, setLanguageFilter] = useState<string>(LANGUAGE_ALL);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) if (item.category) set.add(item.category);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pl"));
  }, [items]);

  const languages = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) if (item.language) set.add(item.language);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pl"));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (q && !item.title.toLowerCase().includes(q) && !item.content.toLowerCase().includes(q)) return false;
      if (categoryFilter === CATEGORY_NONE && item.category) return false;
      if (categoryFilter !== CATEGORY_ALL && categoryFilter !== CATEGORY_NONE && item.category !== categoryFilter) return false;
      if (languageFilter === LANGUAGE_NONE && item.language) return false;
      if (languageFilter !== LANGUAGE_ALL && languageFilter !== LANGUAGE_NONE && item.language !== languageFilter) return false;
      return true;
    });
  }, [items, query, categoryFilter, languageFilter]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-start justify-between gap-4 min-[720px]:flex-row min-[720px]:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a8873f]">Narzędzia</p>
          <h1 className="mt-1 font-[family-name:var(--font-cormorant)] text-[32px] font-semibold leading-[1.1] text-[#201a2b]">
            Schowek
          </h1>
          <p className="mt-1.5 text-[13px] text-[#706878]">
            Gotowe teksty i informacje, które możesz skopiować jednym kliknięciem.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ type: "add" })}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#32134f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b2a86]"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Dodaj tekst
        </button>
      </div>

      {items.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-[380px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a79bb0]" strokeWidth={1.75} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj w schowku…"
              aria-label="Szukaj w schowku"
              className="h-[38px] w-full rounded-[9px] border border-[#e8e2ec] bg-white pl-9 pr-3 text-[13px] text-[#201a2b] outline-none transition-colors focus:border-[#5b2a86] sm:w-[360px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DropdownButton label={categoryFilter === CATEGORY_NONE ? NO_CATEGORY_LABEL : categoryFilter}>
              {(close) => (
                <>
                  <MenuItem active={categoryFilter === CATEGORY_ALL} onClick={() => { setCategoryFilter(CATEGORY_ALL); close(); }}>
                    {CATEGORY_ALL}
                  </MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c} active={categoryFilter === c} onClick={() => { setCategoryFilter(c); close(); }}>
                      {c}
                    </MenuItem>
                  ))}
                  <MenuItem active={categoryFilter === CATEGORY_NONE} onClick={() => { setCategoryFilter(CATEGORY_NONE); close(); }}>
                    {NO_CATEGORY_LABEL}
                  </MenuItem>
                </>
              )}
            </DropdownButton>

            <DropdownButton label={languageFilter === LANGUAGE_NONE ? NO_LANGUAGE_LABEL : languageFilter}>
              {(close) => (
                <>
                  <MenuItem active={languageFilter === LANGUAGE_ALL} onClick={() => { setLanguageFilter(LANGUAGE_ALL); close(); }}>
                    {LANGUAGE_ALL}
                  </MenuItem>
                  {languages.map((l) => (
                    <MenuItem key={l} active={languageFilter === l} onClick={() => { setLanguageFilter(l); close(); }}>
                      {l}
                    </MenuItem>
                  ))}
                  <MenuItem active={languageFilter === LANGUAGE_NONE} onClick={() => { setLanguageFilter(LANGUAGE_NONE); close(); }}>
                    {NO_LANGUAGE_LABEL}
                  </MenuItem>
                </>
              )}
            </DropdownButton>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-[16px] border border-[#e8e2ec] bg-white px-6 py-10 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <EmptyState
            icon={Clipboard}
            title="Twój schowek jest pusty"
            subtitle="Dodaj pierwszy tekst, aby mieć go zawsze pod ręką."
            action={{ label: "Dodaj pierwszy tekst", onClick: () => setModal({ type: "add" }) }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[16px] border border-[#e8e2ec] bg-white px-6 py-10 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <EmptyState icon={Search} title="Nie znaleziono pasujących tekstów." compact />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 min-[720px]:grid-cols-2">
          {filtered.map((item) => (
            <ClipboardCard
              key={item.id}
              item={item}
              onEdit={() => setModal({ type: "edit", item })}
              onDeleteRequest={() => setModal({ type: "delete", item })}
              onCopied={(message) => setToast(message)}
            />
          ))}
        </div>
      )}

      {modal?.type === "add" && (
        <ClipboardFormModal
          mode="add"
          onClose={() => setModal(null)}
          onSaved={(message) => {
            setModal(null);
            setToast(message);
          }}
        />
      )}
      {modal?.type === "edit" && (
        <ClipboardFormModal
          mode="edit"
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={(message) => {
            setModal(null);
            setToast(message);
          }}
        />
      )}
      {modal?.type === "delete" && (
        <ClipboardDeleteModal
          item={modal.item}
          onClose={() => setModal(null)}
          onDeleted={(message) => {
            setModal(null);
            setToast(message);
          }}
        />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
