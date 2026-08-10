"use client";

import { useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, X } from "lucide-react";
import { createClipboardItem, updateClipboardItem } from "@/app/lab/schowek/actions";
import { CLIPBOARD_CATEGORIES, CLIPBOARD_LANGUAGES, NO_CATEGORY_LABEL, NO_LANGUAGE_LABEL, type ClipboardItem } from "@/lib/lab/clipboard-types";

const inputClass =
  "rounded-[10px] border border-[#e6deec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5b2a86]/40";
const inputErrorClass = "border-red-300 focus:border-red-500 focus-visible:outline-red-300";
const labelClass = "text-sm font-medium text-[#201a2b]";

type FieldErrors = { title?: string; content?: string };

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
 * Jeden modal dla dodawania i edycji (mode="add" | "edit") — te same pola,
 * ta sama walidacja, żeby nie utrzymywać dwóch prawie identycznych formularzy.
 * Wzorowany na .../[id] EditArticleForm.tsx (te same tokeny kolorów/spacing),
 * ale osadzony w modalu (wzorzec fixed inset-0 + bg-black/40 z
 * ChooseSessionModal.tsx), bo dodawanie/edycja mają się otwierać dopiero po
 * kliknięciu przycisku, nie być od razu widoczne na stronie.
 */
export default function ClipboardFormModal({
  mode,
  item,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  item?: ClipboardItem;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const titleId = useId();
  const categoryId = useId();
  const languageId = useId();
  const contentId = useId();
  const headingId = useId();

  const action = mode === "add" ? createClipboardItem : updateClipboardItem;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <div className="flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-y-auto rounded-[16px] bg-white p-6 shadow-[0_20px_60px_rgba(30,15,45,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <h2 id={headingId} className="font-[family-name:var(--font-cormorant)] text-[22px] font-semibold text-[#201a2b]">
            {mode === "add" ? "Dodaj tekst do schowka" : "Edytuj tekst"}
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
          action={async (formData) => {
            setFieldErrors({});
            setGeneralError(null);
            if (mode === "edit" && item) formData.set("id", item.id);
            const result = await action(formData);
            if (result?.error) {
              setGeneralError(result.error);
              if (result.field) setFieldErrors({ [result.field]: result.error });
            } else {
              onSaved(mode === "add" ? "Dodano tekst do schowka." : "Zapisano zmiany.");
            }
          }}
          className="mt-5 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor={titleId} className={labelClass}>
              Nazwa *
            </label>
            <input
              id={titleId}
              name="title"
              required
              defaultValue={item?.title}
              placeholder="np. Biogram autora — PL"
              aria-invalid={Boolean(fieldErrors.title)}
              className={`${inputClass} ${fieldErrors.title ? inputErrorClass : ""}`}
            />
            {fieldErrors.title && <p className="text-xs text-red-600">{fieldErrors.title}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={categoryId} className={labelClass}>
                Kategoria
              </label>
              <select id={categoryId} name="category" defaultValue={item?.category ?? ""} className={inputClass}>
                <option value="">{NO_CATEGORY_LABEL}</option>
                {CLIPBOARD_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={languageId} className={labelClass}>
                Język
              </label>
              <select id={languageId} name="language" defaultValue={item?.language ?? ""} className={inputClass}>
                <option value="">{NO_LANGUAGE_LABEL}</option>
                {CLIPBOARD_LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={contentId} className={labelClass}>
              Treść *
            </label>
            <textarea
              id={contentId}
              name="content"
              required
              rows={8}
              defaultValue={item?.content}
              placeholder="np. Author biography — EN"
              aria-invalid={Boolean(fieldErrors.content)}
              className={`${inputClass} resize-y ${fieldErrors.content ? inputErrorClass : ""}`}
            />
            {fieldErrors.content && <p className="text-xs text-red-600">{fieldErrors.content}</p>}
          </div>

          {generalError && !fieldErrors.title && !fieldErrors.content && (
            <p className="text-sm text-red-600">{generalError}</p>
          )}

          <div className="mt-1 flex gap-3">
            <SubmitButton
              label={mode === "add" ? "Dodaj do schowka" : "Zapisz zmiany"}
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
