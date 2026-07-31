"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { addSource, updateSource, deleteSource } from "@/app/lab/artykuly/[id]/actions";
import {
  READING_STATUSES,
  READING_STATUS_LABELS,
  type ArticleSource,
  type ReadingStatus,
} from "@/lib/lab/types";

const inputClass =
  "border border-[#4A1D6E]/25 bg-white px-3 py-2 text-sm text-[#1C1028] outline-none focus:border-[#4A1D6E]";

function ReadingStatusTag({ status }: { status: ReadingStatus }) {
  if (status === "przeczytane") {
    return (
      <span className="inline-flex items-center bg-[#4A1D6E] px-2 py-0.5 text-xs text-white">
        {READING_STATUS_LABELS[status]}
      </span>
    );
  }
  if (status === "w_trakcie") {
    return (
      <span className="inline-flex items-center bg-[#EDE6F8] px-2 py-0.5 text-xs text-[#4A1D6E]">
        {READING_STATUS_LABELS[status]}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center border border-[#4A3360]/30 px-2 py-0.5 text-xs text-[#4A3360]">
      {READING_STATUS_LABELS[status]}
    </span>
  );
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start bg-[#4A1D6E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4A2073] disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function SourceFields({ source }: { source?: ArticleSource }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1C1028]">Autor</label>
          <input name="author" defaultValue={source?.author ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1C1028]">Rok</label>
          <input
            name="year"
            type="number"
            defaultValue={source?.year ?? ""}
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1C1028]">Tytuł</label>
        <input name="title" defaultValue={source?.title ?? ""} className={inputClass} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1C1028]">Czasopismo / wydawnictwo</label>
          <input
            name="publisher_or_journal"
            defaultValue={source?.publisher_or_journal ?? ""}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1C1028]">Typ źródła</label>
          <input name="source_type" defaultValue={source?.source_type ?? ""} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1C1028]">DOI</label>
          <input name="doi" defaultValue={source?.doi ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1C1028]">URL</label>
          <input name="url" defaultValue={source?.url ?? ""} className={inputClass} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1C1028]">Status przeczytania</label>
        <select
          name="reading_status"
          defaultValue={source?.reading_status ?? "do_przeczytania"}
          className={inputClass}
        >
          {READING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {READING_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#1C1028]">Notatki</label>
        <textarea name="notes" rows={2} defaultValue={source?.notes ?? ""} className={inputClass} />
      </div>
    </>
  );
}

export default function SourcesTab({
  articleId,
  sources,
}: {
  articleId: string;
  sources: ArticleSource[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-6">
      <section className="border border-[#4A1D6E]/15 bg-white p-6">
        <h2 className="text-sm font-semibold text-[#1C1028]">Dodaj źródło</h2>
        <form
          ref={formRef}
          action={async (formData) => {
            await addSource(formData);
            formRef.current?.reset();
          }}
          className="mt-4 flex flex-col gap-3"
        >
          <input type="hidden" name="article_id" value={articleId} />
          <SourceFields />
          <SubmitButton label="Dodaj źródło" pendingLabel="Dodawanie…" />
        </form>
      </section>

      <section>
        {sources.length === 0 ? (
          <div className="border border-[#4A1D6E]/15 bg-white px-6 py-10 text-center">
            <p className="text-sm text-[#4A3360]">Brak dodanych źródeł.</p>
          </div>
        ) : (
          <ul>
            {sources.map((s) =>
              editingId === s.id ? (
                <li key={s.id} className="border-b-[0.5px] border-[#4A1D6E]/20 py-4">
                  <form
                    action={async (formData) => {
                      await updateSource(formData);
                      setEditingId(null);
                    }}
                    className="flex flex-col gap-3"
                  >
                    <input type="hidden" name="article_id" value={articleId} />
                    <input type="hidden" name="id" value={s.id} />
                    <SourceFields source={s} />
                    <div className="flex gap-3">
                      <SubmitButton label="Zapisz" pendingLabel="Zapisywanie…" />
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="border border-[#4A1D6E]/25 px-4 py-2 text-sm text-[#4A3360] hover:border-[#4A1D6E]/50"
                      >
                        Anuluj
                      </button>
                    </div>
                  </form>
                </li>
              ) : (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-4 border-b-[0.5px] border-[#4A1D6E]/20 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#1C1028]">
                      {s.title || "Bez tytułu"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[#4A3360]">
                      {[s.author, s.year, s.publisher_or_journal].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {s.notes && <p className="mt-1 text-xs text-[#4A3360]">{s.notes}</p>}
                  </div>
                  <ReadingStatusTag status={s.reading_status} />
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingId(s.id)}
                      className="text-sm text-[#4A1D6E] hover:underline"
                    >
                      Edytuj
                    </button>
                    <form
                      action={deleteSource}
                      onSubmit={(e) => {
                        if (!confirm("Usunąć to źródło?")) e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="article_id" value={articleId} />
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="text-sm text-red-600 hover:underline">
                        Usuń
                      </button>
                    </form>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
