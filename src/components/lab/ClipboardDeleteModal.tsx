"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { deleteClipboardItem } from "@/app/lab/schowek/actions";
import type { ClipboardItem } from "@/lib/lab/clipboard-types";

export default function ClipboardDeleteModal({
  item,
  onClose,
  onDeleted,
}: {
  item: ClipboardItem;
  onClose: () => void;
  onDeleted: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingId = useId();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <div className="w-full max-w-[400px] rounded-[16px] bg-white p-6 shadow-[0_20px_60px_rgba(30,15,45,0.25)]">
        <h2 id={headingId} className="font-[family-name:var(--font-cormorant)] text-[20px] font-semibold text-[#201a2b]">
          Usunąć tekst ze schowka?
        </h2>
        <p className="mt-2 text-sm text-[#706878]">Ta operacja usunie zapisany tekst. Nie będzie można jej cofnąć.</p>
        <p className="mt-3 truncate text-sm font-medium text-[#201a2b]">„{item.title}”</p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              setError(null);
              setPending(true);
              const formData = new FormData();
              formData.set("id", item.id);
              const result = await deleteClipboardItem(formData);
              if (result?.error) {
                setError(result.error);
                setPending(false);
              } else {
                onDeleted("Usunięto tekst ze schowka.");
              }
            }}
            className="flex h-10 items-center gap-1.5 rounded-[10px] bg-red-600 px-5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />}
            {pending ? "Usuwanie…" : "Usuń"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="flex h-10 items-center rounded-[10px] border border-[#e6deec] px-5 text-sm font-medium text-[#706878] transition-colors hover:border-[#d9cde5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b2a86]/40 disabled:opacity-50"
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  );
}
