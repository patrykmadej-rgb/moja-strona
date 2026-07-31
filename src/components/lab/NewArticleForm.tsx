"use client";

import { useFormStatus } from "react-dom";
import { createArticle } from "@/app/lab/artykuly/actions";

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
  return (
    <form action={createArticle} className="mt-8 flex max-w-2xl flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className={labelClass}>
          Tytuł *
        </label>
        <input id="title" name="title" required className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="language" className={labelClass}>
            Język
          </label>
          <input id="language" name="language" placeholder="np. polski" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="discipline" className={labelClass}>
            Dyscyplina
          </label>
          <input id="discipline" name="discipline" className={inputClass} />
        </div>
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

      <SubmitButton />
    </form>
  );
}
