"use client";

import { useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, X } from "lucide-react";
import { createLibraryLoan } from "@/app/lab/biblioteka/actions";
import { todayDateString } from "@/lib/lab/format";
import type { LibraryBook } from "@/lib/lab/library-types";

const inputClass =
  "rounded-[10px] border border-[#e6deec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5b2a86]/40";
const labelClass = "text-sm font-medium text-[#201a2b]";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-10 items-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-5 text-sm font-medium text-white transition-colors hover:bg-[#32134f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b2a86] disabled:opacity-50"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />}
      {pending ? "Zapisywanie…" : "Zapisz wypożyczenie"}
    </button>
  );
}

export default function LibraryLoanModal({
  book,
  onClose,
  onSaved,
}: {
  book: LibraryBook;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const borrowerId = useId();
  const dateId = useId();
  const noteId = useId();
  const headingId = useId();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <div className="w-full max-w-[480px] rounded-[16px] bg-white p-6 shadow-[0_20px_60px_rgba(30,15,45,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={headingId} className="font-[family-name:var(--font-cormorant)] text-[20px] font-semibold text-[#201a2b]">
              Oznacz jako wypożyczoną
            </h2>
            <p className="mt-1 truncate text-sm text-[#706878]">„{book.title}”</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[#9a919f] transition-colors hover:bg-[#f7f4ef] hover:text-[#5b2a86] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5b2a86]/40"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <form
          action={async (formData) => {
            setError(null);
            formData.set("bookId", book.id);
            const result = await createLibraryLoan(formData);
            if (result?.error) {
              setError(result.error);
            } else {
              onSaved("Oznaczono jako wypożyczoną.");
            }
          }}
          className="mt-5 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor={borrowerId} className={labelClass}>
              Komu wypożyczono *
            </label>
            <input id={borrowerId} name="borrowerName" required placeholder="np. Kasia" className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={dateId} className={labelClass}>
              Kiedy *
            </label>
            <input id={dateId} name="loanedAt" type="date" required defaultValue={todayDateString()} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={noteId} className={labelClass}>
              Notatka
            </label>
            <textarea id={noteId} name="note" rows={3} className={`${inputClass} resize-y`} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="mt-1 flex gap-3">
            <SubmitButton />
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 items-center rounded-[10px] border border-[#e6deec] px-5 text-sm font-medium text-[#706878] transition-colors hover:border-[#d9cde5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b2a86]/40"
            >
              Anuluj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
