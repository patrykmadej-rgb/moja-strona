"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createArticle } from "@/app/lab/artykuly/actions";
import DisciplinesField from "@/components/lab/DisciplinesField";
import { ARTICLE_STATUSES, ARTICLE_STATUS_LABELS, LANGUAGES, LANGUAGE_LABELS } from "@/lib/lab/types";

const inputClass =
  "border border-[#4A1D6E]/25 bg-white px-3 py-2 text-sm text-[#1C1028] outline-none focus:border-[#4A1D6E]";
const labelClass = "text-sm font-medium text-[#1C1028]";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 self-start bg-[#4A1D6E] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4A2073] disabled:opacity-50"
    >
      {pending ? "Zapisywanie…" : "Zapisz artykuł"}
    </button>
  );
}

export default function NewArticleForm() {
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={async (formData) => {
        setError(null);
        const result = await createArticle(formData);
        if (result?.error) setError(result.error);
      }}
      className="mt-8 flex max-w-2xl flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className={labelClass}>
          Tytuł *
        </label>
        <input id="title" name="title" required className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select id="status" name="status" defaultValue={ARTICLE_STATUSES[0]} className={inputClass}>
            {ARTICLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ARTICLE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="language_code" className={labelClass}>
            Język *
          </label>
          <select id="language_code" name="language_code" required defaultValue="pl" className={inputClass}>
            <option value="" disabled>
              Wybierz język
            </option>
            {LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {LANGUAGE_LABELS[code]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Dyscypliny *</label>
        <DisciplinesField defaultValues={[]} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="target_journal" className={labelClass}>
          Docelowe czasopismo
        </label>
        <input id="target_journal" name="target_journal" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="keywords" className={labelClass}>
          Słowa kluczowe (oddzielone przecinkami)
        </label>
        <input
          id="keywords"
          name="keywords"
          placeholder="np. lęk, terapia poznawcza, badania jakościowe"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="abstract" className={labelClass}>
          Abstrakt
        </label>
        <textarea id="abstract" name="abstract" rows={5} className={inputClass} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <SubmitButton />
    </form>
  );
}
