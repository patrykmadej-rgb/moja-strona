"use client";

import { useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { createLibraryBook, updateLibraryBook, type LibraryActionError } from "@/app/lab/biblioteka/actions";
import LibraryCoverPicker, { type CoverCandidate } from "@/components/lab/LibraryCoverPicker";
import { OWNERSHIP_STATUS_LABELS, type LibraryBook, type OwnershipStatus } from "@/lib/lab/library-types";

const inputClass =
  "rounded-[10px] border border-[#e6deec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5b2a86]/40";
const inputErrorClass = "border-red-300 focus:border-red-500 focus-visible:outline-red-300";
const labelClass = "text-sm font-medium text-[#201a2b]";

type FieldErrors = { title?: string; author?: string };

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-10 items-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-5 text-sm font-medium text-white transition-colors hover:bg-[#32134f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b2a86] disabled:opacity-50"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />}
      {pending ? pendingLabel : label}
    </button>
  );
}

/**
 * Uproszczony formularz dodawania/edycji (poprzednia wersja pokazywała
 * status własności, status czytania, kategorię, język, rok, ISBN,
 * wydawnictwo i notatki — teraz wyłącznie Tytuł, Autor i wybór okładki).
 * Status własności NIE jest tu już wybierany: dla nowej książki wynika z
 * aktywnej zakładki (initialOwnershipStatus), dla edycji zostaje taki, jaki
 * już był — zmienia się wyłącznie przez status/menu na liście (sekcja 3
 * briefu), nie przez ten formularz. ISBN/rok/wydawnictwo są nadal
 * zapisywane (wypełnione automatycznie z wybranej okładki, jeśli Google
 * Books je zna) — po prostu nieeksponowane w UI.
 *
 * Wykrywanie duplikatów (ISBN/tytuł+autor w library-service.ts) działa bez
 * zmian — createBook/updateBook nie zostały dotknięte.
 */
export default function LibraryBookFormModal({
  mode,
  item,
  initialOwnershipStatus = "owned",
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  item?: LibraryBook;
  initialOwnershipStatus?: OwnershipStatus;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<LibraryActionError["duplicates"]>(undefined);
  const [title, setTitle] = useState(item?.title ?? "");
  const [author, setAuthor] = useState(item?.author ?? "");
  const [selectedCover, setSelectedCover] = useState<CoverCandidate | null>(
    item?.cover_url
      ? { id: "current", title: item.title, author: item.author, publisher: item.publisher, year: item.year, isbn: item.isbn, thumbnailUrl: item.cover_url }
      : null,
  );
  const [confirmPending, setConfirmPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const titleId = useId();
  const authorId = useId();
  const headingId = useId();

  const ownershipStatus: OwnershipStatus = item?.ownership_status ?? initialOwnershipStatus;
  const action = mode === "add" ? createLibraryBook : updateLibraryBook;

  const applyResult = (result: LibraryActionError | undefined, successMessage: string) => {
    if (result?.error) {
      setGeneralError(result.error);
      setDuplicates(result.duplicates);
      if (result.field) setFieldErrors({ [result.field]: result.error });
    } else {
      onSaved(successMessage);
    }
  };

  /** Pola bez widocznych <input> (status własności, status czytania, okładka/ISBN/rok/wydawnictwo z pickera) trzeba dopisać ręcznie — tak samo dotyczy to new FormData(form) w handleConfirmDuplicate. */
  const applyHiddenFields = (formData: FormData) => {
    formData.set("ownershipStatus", ownershipStatus);
    formData.set("readingStatus", item?.reading_status ?? "unread");
    formData.set("coverUrl", selectedCover?.thumbnailUrl ?? "");
    formData.set("isbn", selectedCover?.isbn ?? item?.isbn ?? "");
    formData.set("publisher", selectedCover?.publisher ?? item?.publisher ?? "");
    const year = selectedCover?.year ?? item?.year ?? null;
    formData.set("year", year ? String(year) : "");
  };

  const handleConfirmDuplicate = async () => {
    if (!formRef.current || confirmPending) return;
    setConfirmPending(true);
    const formData = new FormData(formRef.current);
    applyHiddenFields(formData);
    formData.set("confirmDuplicate", "true");
    const result = await createLibraryBook(formData);
    setConfirmPending(false);
    applyResult(result, "Dodano książkę do biblioteki.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <div className="flex max-h-[90dvh] w-full max-w-[440px] flex-col overflow-y-auto rounded-[16px] bg-white p-6 shadow-[0_20px_60px_rgba(30,15,45,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={headingId} className="font-[family-name:var(--font-cormorant)] text-[22px] font-semibold text-[#201a2b]">
              {mode === "add" ? "Dodaj książkę" : "Edytuj książkę"}
            </h2>
            {mode === "add" && (
              <p className="mt-1 text-xs text-[#9a919f]">Trafi do: {OWNERSHIP_STATUS_LABELS[ownershipStatus]}</p>
            )}
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
          ref={formRef}
          action={async (formData) => {
            setFieldErrors({});
            setGeneralError(null);
            setDuplicates(undefined);
            if (mode === "edit" && item) formData.set("id", item.id);
            applyHiddenFields(formData);
            const result = await action(formData);
            applyResult(result, mode === "add" ? "Dodano książkę do biblioteki." : "Zapisano zmiany.");
          }}
          className="mt-5 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor={titleId} className={labelClass}>
              Tytuł *
            </label>
            <input
              id={titleId}
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Leżąc na kozetce"
              aria-invalid={Boolean(fieldErrors.title)}
              className={`${inputClass} ${fieldErrors.title ? inputErrorClass : ""}`}
            />
            {fieldErrors.title && <p className="text-xs text-red-600">{fieldErrors.title}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={authorId} className={labelClass}>
              Autor *
            </label>
            <input
              id={authorId}
              name="author"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="np. Irvin D. Yalom"
              aria-invalid={Boolean(fieldErrors.author)}
              className={`${inputClass} ${fieldErrors.author ? inputErrorClass : ""}`}
            />
            {fieldErrors.author && <p className="text-xs text-red-600">{fieldErrors.author}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Okładka</span>
            <LibraryCoverPicker title={title} author={author} selected={selectedCover} onSelect={setSelectedCover} />
          </div>

          {duplicates && duplicates.length > 0 && (
            <div className="flex flex-col gap-2 rounded-[10px] border border-[#f0d9a8] bg-[#fff8e8] px-3.5 py-3">
              <p className="flex items-center gap-2 text-sm font-medium text-[#8a5a10]">
                <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                Podobna pozycja jest już w Twojej bibliotece
              </p>
              <ul className="flex flex-col gap-0.5 pl-6 text-xs text-[#8a5a10]">
                {duplicates.map((d) => (
                  <li key={d.id}>
                    „{d.title}” — {d.author} ({OWNERSHIP_STATUS_LABELS[d.ownership_status]})
                  </li>
                ))}
              </ul>
              {mode === "add" && (
                <button
                  type="button"
                  disabled={confirmPending}
                  onClick={handleConfirmDuplicate}
                  className="flex h-9 items-center justify-center gap-1.5 self-start rounded-[9px] border border-[#e6c98a] bg-white px-3.5 text-xs font-medium text-[#8a5a10] transition-colors hover:bg-[#fff2d9] disabled:opacity-60"
                >
                  {confirmPending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />}
                  Dodaj mimo to (inne wydanie)
                </button>
              )}
            </div>
          )}

          {generalError && !fieldErrors.title && !fieldErrors.author && (!duplicates || duplicates.length === 0) && (
            <p className="text-sm text-red-600">{generalError}</p>
          )}

          <div className="mt-1 flex gap-3">
            <SubmitButton
              label={mode === "add" ? "Dodaj książkę" : "Zapisz zmiany"}
              pendingLabel={mode === "add" ? "Dodawanie…" : "Zapisywanie…"}
            />
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
