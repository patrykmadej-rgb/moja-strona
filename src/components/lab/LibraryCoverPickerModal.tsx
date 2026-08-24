"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2, X } from "lucide-react";
import { updateLibraryBookCover, updateLibraryBookCoverStorage } from "@/app/lab/biblioteka/actions";
import LibraryCoverPicker, { type CoverCandidate } from "@/components/lab/LibraryCoverPicker";
import { prepareImageForUpload } from "@/lib/imagePrep";
import { uploadLibraryCover } from "@/lib/lab/libraryCoverStorage";
import type { LibraryBook } from "@/lib/lab/library-types";

/**
 * "Zmień okładkę" z menu/panelu szczegółów istniejącej książki (sekcje 4 i
 * 6 briefu). Trzy sposoby ustawienia okładki w jednym miejscu: (1) wyszukane
 * automatycznie/wybrane spośród wyników (LibraryCoverPicker, Google Books +
 * Open Library fallback), (2) własne zdjęcie z galerii albo aparatu
 * (uploadLibraryCover → prywatny Storage, ta sama kompresja co przy
 * rozpoznawaniu ze zdjęcia — prepareImageForUpload), (3) usunięcie okładki.
 */
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    onSaved(selected ? "Zaktualizowano okładkę." : "Usunięto okładkę.");
  };

  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);

    const prepared = await prepareImageForUpload(file);
    if ("error" in prepared) {
      setUploading(false);
      setError(prepared.error);
      return;
    }

    try {
      const storagePath = await uploadLibraryCover(book.id, prepared.blob);
      const result = await updateLibraryBookCoverStorage(book.id, storagePath);
      setUploading(false);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
      onSaved("Zapisano własną okładkę.");
    } catch (err) {
      setUploading(false);
      setError(err instanceof Error ? err.message : "Nie udało się przesłać zdjęcia.");
    }
  };

  const busy = saving || uploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <div className="w-full max-w-[460px] rounded-[16px] bg-white p-6 shadow-[0_20px_60px_rgba(30,15,45,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={headingId} className="font-[family-name:var(--font-cormorant)] text-[20px] font-semibold text-[#201a2b]">
              Zmień okładkę
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

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#f0ebf5] pt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              void handleFileSelected(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
            className="flex h-9 items-center gap-1.5 rounded-[9px] border border-[#e6deec] px-3 text-xs font-medium text-[#5b2a86] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} /> : <Camera className="h-3.5 w-3.5" strokeWidth={1.75} />}
            {uploading ? "Przesyłanie…" : "Prześlij własne zdjęcie"}
          </button>
          {selected && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setSelected(null)}
              className="flex h-9 items-center gap-1.5 rounded-[9px] px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              Usuń okładkę
            </button>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={handleSave}
            className="flex h-10 items-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-5 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />}
            Zapisz okładkę
          </button>
          <button
            type="button"
            disabled={busy}
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
