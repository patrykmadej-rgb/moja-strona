"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { updateLibraryBookCover } from "@/app/lab/biblioteka/actions";
import LibraryCoverPicker, { type CoverCandidate } from "@/components/lab/LibraryCoverPicker";
import type { LibraryBook } from "@/lib/lab/library-types";

/** "Znajdź okładkę" z menu istniejącej książki (sekcja 4 briefu) — zmienia wyłącznie cover_url, reużywa ten sam picker co formularz dodawania/edycji. */
export default function LibraryCoverPickerModal({
  book,
  onClose,
  onSaved,
}: {
  book: LibraryBook;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<CoverCandidate | null>(
    book.cover_url ? { id: "current", title: book.title, author: book.author, publisher: null, year: null, isbn: null, thumbnailUrl: book.cover_url } : null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingId = useId();

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const result = await updateLibraryBookCover(book.id, selected?.thumbnailUrl ?? null);
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.refresh();
    onSaved("Zaktualizowano okładkę.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <div className="w-full max-w-[460px] rounded-[16px] bg-white p-6 shadow-[0_20px_60px_rgba(30,15,45,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={headingId} className="font-[family-name:var(--font-cormorant)] text-[20px] font-semibold text-[#201a2b]">
              Znajdź okładkę
            </h2>
            <p className="mt-1 truncate text-sm text-[#706878]">
              „{book.title}” — {book.author}
            </p>
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

        <div className="mt-5">
          <LibraryCoverPicker title={book.title} author={book.author} selected={selected} onSelect={setSelected} />
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex h-10 items-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-5 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />}
            Zapisz okładkę
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="flex h-10 items-center rounded-[10px] border border-[#e6deec] px-5 text-sm font-medium text-[#706878] transition-colors hover:border-[#d9cde5] disabled:opacity-50"
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  );
}
