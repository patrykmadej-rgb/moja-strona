"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { updateReadingStatus } from "@/app/lab/biblioteka/actions";
import { READING_STATUSES, READING_STATUS_COLORS, READING_STATUS_LABELS, type ReadingStatus } from "@/lib/lab/library-types";

/**
 * Dropdown zmiany statusu czytania jedną akcją — wzorowany na
 * ArticleStatusSelector.tsx, ale bez portalu do document.body: karty
 * biblioteki (w przeciwieństwie do .lab-sidebar) nie mają overflow:hidden,
 * więc zwykłe pozycjonowanie "relative" wystarcza i jest prostsze.
 * Renderowany tylko dla posiadanych książek — patrz LibraryBookCard.
 */
export default function LibraryReadingStatusSelector({
  bookId,
  status,
  onToast,
}: {
  bookId: string;
  status: ReadingStatus;
  onToast: (message: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [current, setCurrent] = useState(status);
  const [synced, setSynced] = useState(status);
  const ref = useRef<HTMLDivElement>(null);

  // Dopasowanie stanu do zmiany propsa w trakcie renderu, nie w efekcie —
  // ten sam wzorzec co w ArticleStatusSelector.tsx.
  if (status !== synced) {
    setSynced(status);
    setCurrent(status);
  }

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

  const handleSelect = async (next: ReadingStatus) => {
    setOpen(false);
    if (next === current || pending) return;
    const previous = current;
    setCurrent(next);
    setPending(true);
    const result = await updateReadingStatus(bookId, next);
    setPending(false);
    if ("error" in result) {
      setCurrent(previous);
      onToast(result.error);
    } else {
      onToast("Zmieniono status czytania.");
      router.refresh();
    }
  };

  const { bg, text } = READING_STATUS_COLORS[current];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Zmień status czytania"
        className="inline-flex min-h-[26px] items-center gap-1 rounded-[8px] border border-transparent px-[8px] py-[4px] text-[11px] font-medium transition-colors hover:border-black/10 disabled:cursor-not-allowed disabled:opacity-70"
        style={{ background: bg, color: text }}
      >
        {READING_STATUS_LABELS[current]}
        {pending ? <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} /> : <ChevronDown className="h-3 w-3" strokeWidth={2} />}
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Status czytania"
          className="absolute left-0 z-20 mt-1 w-52 rounded-[10px] border border-[#e8e2ec] bg-white py-1 shadow-[0_8px_24px_rgba(49,30,64,0.12)]"
        >
          {READING_STATUSES.map((s) => {
            const colors = READING_STATUS_COLORS[s];
            const isCurrent = s === current;
            return (
              <button
                key={s}
                type="button"
                role="option"
                aria-selected={isCurrent}
                onClick={() => handleSelect(s)}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm text-[#201a2b] hover:bg-[#f7f4fa]"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {isCurrent && <Check className="h-3.5 w-3.5 text-[#5b2a86]" strokeWidth={2.25} />}
                </span>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colors.text }} />
                {READING_STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
