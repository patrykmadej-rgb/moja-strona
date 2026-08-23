"use client";

import { useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, Loader2, Search, X } from "lucide-react";
import { createLibraryBook, updateLibraryBook, type LibraryActionError } from "@/app/lab/biblioteka/actions";
import {
  LIBRARY_CATEGORIES,
  LIBRARY_LANGUAGES,
  OWNERSHIP_STATUS_LABELS,
  OWNERSHIP_STATUSES,
  READING_STATUSES,
  READING_STATUS_LABELS,
  type LibraryBook,
  type OwnershipStatus,
  type ReadingStatus,
} from "@/lib/lab/library-types";

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
 * Jeden modal dla dodawania i edycji (mode="add" | "edit"), wzorowany na
 * ClipboardFormModal.tsx — te same tokeny stylu i wzorzec fixed inset-0.
 * Dodatkowo obsługuje ostrzeżenie o duplikacie (sekcja 5 briefu): pierwsze
 * przesłanie sprawdza ISBN/tytuł+autor po stronie serwera (createBook w
 * library-service.ts); jeśli znajdzie podobną pozycję, formularz NIE jest
 * zamykany — pokazuje listę dopasowań i przycisk "Dodaj mimo to", który
 * przesyła te same dane z confirmDuplicate=true, pomijając ponowne
 * sprawdzenie (nie blokuje bezrefleksyjnie różnych wydań tej samej książki).
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
  const [ownershipStatus, setOwnershipStatus] = useState<OwnershipStatus>(item?.ownership_status ?? initialOwnershipStatus);
  const [confirmPending, setConfirmPending] = useState(false);
  const [isbnLookupPending, setIsbnLookupPending] = useState(false);
  const [isbnLookupMessage, setIsbnLookupMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const authorInputRef = useRef<HTMLInputElement>(null);
  const publisherInputRef = useRef<HTMLInputElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);
  const isbnInputRef = useRef<HTMLInputElement>(null);

  const titleId = useId();
  const authorId = useId();
  const readingStatusId = useId();
  const categoryId = useId();
  const categoryListId = useId();
  const languageId = useId();
  const languageListId = useId();
  const yearId = useId();
  const isbnId = useId();
  const publisherId = useId();
  const notesId = useId();
  const headingId = useId();

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

  const handleConfirmDuplicate = async () => {
    if (!formRef.current || confirmPending) return;
    setConfirmPending(true);
    const formData = new FormData(formRef.current);
    // new FormData(form) czyta tylko realne pola <input>/<select> — segmentowany
    // przełącznik statusu własności to zwykłe przyciski bez name/value, więc
    // trzeba go tu dopisać ręcznie tak samo jak w handlerze `action` formularza.
    formData.set("ownershipStatus", ownershipStatus);
    formData.set("confirmDuplicate", "true");
    const result = await createLibraryBook(formData);
    setConfirmPending(false);
    applyResult(result, "Dodano książkę do biblioteki.");
  };

  /**
   * Zakres 6 briefu: "wpisz ISBN i pobierz dane bibliograficzne" — bez
   * biblioteki formularzy (pola są niekontrolowane, defaultValue), więc
   * uzupełnienie idzie przez refy i tylko do PUSTYCH pól — nie nadpisuje
   * tego, co użytkownik już wpisał/poprawił ręcznie.
   */
  const handleIsbnLookup = async () => {
    const isbn = isbnInputRef.current?.value.trim();
    if (!isbn || isbnLookupPending) return;

    setIsbnLookupPending(true);
    setIsbnLookupMessage(null);
    try {
      const res = await fetch(`/api/lab/biblioteka/isbn-lookup?isbn=${encodeURIComponent(isbn)}`);
      if (!res.ok) throw new Error("lookup-failed");
      const { result } = (await res.json()) as {
        result: { title: string | null; author: string | null; publisher: string | null; year: number | null } | null;
      };

      if (!result) {
        setIsbnLookupMessage("Nie znaleziono danych dla tego ISBN — uzupełnij ręcznie.");
        return;
      }

      let filled = 0;
      if (result.title && titleInputRef.current && !titleInputRef.current.value.trim()) {
        titleInputRef.current.value = result.title;
        filled += 1;
      }
      if (result.author && authorInputRef.current && !authorInputRef.current.value.trim()) {
        authorInputRef.current.value = result.author;
        filled += 1;
      }
      if (result.publisher && publisherInputRef.current && !publisherInputRef.current.value.trim()) {
        publisherInputRef.current.value = result.publisher;
        filled += 1;
      }
      if (result.year && yearInputRef.current && !yearInputRef.current.value.trim()) {
        yearInputRef.current.value = String(result.year);
        filled += 1;
      }

      setIsbnLookupMessage(filled > 0 ? "Uzupełniono dane z Google Books — sprawdź przed zapisem." : "Znaleziono, ale pola były już wypełnione.");
    } catch {
      setIsbnLookupMessage("Nie udało się połączyć z wyszukiwarką ISBN.");
    } finally {
      setIsbnLookupPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <div className="flex max-h-[90vh] w-full max-w-[620px] flex-col overflow-y-auto rounded-[16px] bg-white p-6 shadow-[0_20px_60px_rgba(30,15,45,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <h2 id={headingId} className="font-[family-name:var(--font-cormorant)] text-[22px] font-semibold text-[#201a2b]">
            {mode === "add" ? "Dodaj książkę" : "Edytuj książkę"}
          </h2>
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
            formData.set("ownershipStatus", ownershipStatus);
            const result = await action(formData);
            applyResult(result, mode === "add" ? "Dodano książkę do biblioteki." : "Zapisano zmiany.");
          }}
          className="mt-5 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Status własności</span>
            <div className="flex gap-2">
              {OWNERSHIP_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setOwnershipStatus(status)}
                  aria-pressed={ownershipStatus === status}
                  className={
                    ownershipStatus === status
                      ? "flex h-9 flex-1 items-center justify-center rounded-[10px] bg-[#5b2a86] text-sm font-medium text-white"
                      : "flex h-9 flex-1 items-center justify-center rounded-[10px] border border-[#e6deec] text-sm text-[#706878] transition-colors hover:border-[#d9cde5]"
                  }
                >
                  {OWNERSHIP_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={titleId} className={labelClass}>
              Tytuł *
            </label>
            <input
              ref={titleInputRef}
              id={titleId}
              name="title"
              required
              defaultValue={item?.title}
              placeholder="np. Psychoza"
              aria-invalid={Boolean(fieldErrors.title)}
              className={`${inputClass} ${fieldErrors.title ? inputErrorClass : ""}`}
            />
            {fieldErrors.title && <p className="text-xs text-red-600">{fieldErrors.title}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={authorId} className={labelClass}>
              Autor / autorzy *
            </label>
            <input
              ref={authorInputRef}
              id={authorId}
              name="author"
              required
              defaultValue={item?.author}
              placeholder="np. Stijn Vanheule"
              aria-invalid={Boolean(fieldErrors.author)}
              className={`${inputClass} ${fieldErrors.author ? inputErrorClass : ""}`}
            />
            {fieldErrors.author && <p className="text-xs text-red-600">{fieldErrors.author}</p>}
          </div>

          {ownershipStatus === "owned" && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={readingStatusId} className={labelClass}>
                Status czytania
              </label>
              <select id={readingStatusId} name="readingStatus" defaultValue={item?.reading_status ?? "unread"} className={inputClass}>
                {READING_STATUSES.map((s: ReadingStatus) => (
                  <option key={s} value={s}>
                    {READING_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={categoryId} className={labelClass}>
                Kategoria / obszar
              </label>
              <input
                id={categoryId}
                name="category"
                list={categoryListId}
                defaultValue={item?.category ?? ""}
                placeholder="np. Trauma"
                className={inputClass}
              />
              <datalist id={categoryListId}>
                {LIBRARY_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={languageId} className={labelClass}>
                Język
              </label>
              <input
                id={languageId}
                name="language"
                list={languageListId}
                defaultValue={item?.language ?? ""}
                placeholder="np. PL"
                className={inputClass}
              />
              <datalist id={languageListId}>
                {LIBRARY_LANGUAGES.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={yearId} className={labelClass}>
                Rok wydania
              </label>
              <input
                ref={yearInputRef}
                id={yearId}
                name="year"
                type="number"
                inputMode="numeric"
                min={1400}
                max={new Date().getFullYear() + 1}
                defaultValue={item?.year ?? ""}
                placeholder="np. 2015"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={isbnId} className={labelClass}>
                ISBN
              </label>
              <div className="flex gap-2">
                <input
                  ref={isbnInputRef}
                  id={isbnId}
                  name="isbn"
                  defaultValue={item?.isbn ?? ""}
                  placeholder="np. 978-83-235-3456-6"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  disabled={isbnLookupPending}
                  onClick={handleIsbnLookup}
                  title="Sprawdź ISBN i pobierz dane z Google Books"
                  className="flex h-[38px] shrink-0 items-center gap-1.5 rounded-[10px] border border-[#e6deec] px-3 text-xs font-medium text-[#5b2a86] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] disabled:opacity-60"
                >
                  {isbnLookupPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
                  ) : (
                    <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
                  )}
                  Sprawdź
                </button>
              </div>
              {isbnLookupMessage && <p className="text-xs text-[#706878]">{isbnLookupMessage}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={publisherId} className={labelClass}>
              Wydawnictwo
            </label>
            <input
              ref={publisherInputRef}
              id={publisherId}
              name="publisher"
              defaultValue={item?.publisher ?? ""}
              placeholder="np. Wydawnictwo UJ"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={notesId} className={labelClass}>
              Notatki
            </label>
            <textarea id={notesId} name="notes" rows={4} defaultValue={item?.notes ?? ""} className={`${inputClass} resize-y`} />
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
