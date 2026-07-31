"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { createIdea } from "@/app/(site)/panel/pomysly/actions";

const inputClass =
  "rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 self-start rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
    >
      {pending ? "Dodawanie…" : "Dodaj pomysł"}
    </button>
  );
}

export default function IdeaForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createIdea(formData);
        formRef.current?.reset();
      }}
      className="mt-6 flex flex-col gap-3 rounded-xl border border-black/10 p-5 dark:border-white/10"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Tytuł
        </label>
        <input id="title" name="title" required className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Opis
        </label>
        <textarea id="description" name="description" rows={3} className={inputClass} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="tags" className="text-sm font-medium">
          Tagi (oddzielone przecinkami)
        </label>
        <input
          id="tags"
          name="tags"
          placeholder="np. lęk, terapia poznawcza, badania jakościowe"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="file" className="text-sm font-medium">
          Plik PDF (opcjonalnie)
        </label>
        <input id="file" name="file" type="file" accept="application/pdf" className="text-sm" />
      </div>

      <SubmitButton />
    </form>
  );
}
