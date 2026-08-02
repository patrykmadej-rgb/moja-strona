"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { updateArticle } from "@/app/lab/artykuly/[id]/actions";
import { ARTICLE_STATUSES, ARTICLE_STATUS_LABELS, type Article } from "@/lib/lab/types";

const inputClass =
  "rounded-[10px] border border-[#e6deec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86]";
const labelClass = "text-sm font-medium text-[#201a2b]";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[10px] bg-[#5b2a86] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
    >
      {pending ? "Zapisywanie…" : "Zapisz zmiany"}
    </button>
  );
}

export default function EditArticleForm({
  article,
  onCancel,
}: {
  article: Article;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={async (formData) => {
        setError(null);
        try {
          await updateArticle(formData);
          onCancel();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Nie udało się zapisać zmian.");
        }
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="article_id" value={article.id} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className={labelClass}>
          Tytuł *
        </label>
        <input id="title" name="title" required defaultValue={article.title} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="language" className={labelClass}>
            Język
          </label>
          <input
            id="language"
            name="language"
            defaultValue={article.language ?? ""}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="discipline" className={labelClass}>
            Dyscyplina
          </label>
          <input
            id="discipline"
            name="discipline"
            defaultValue={article.discipline ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="target_journal" className={labelClass}>
          Docelowe czasopismo
        </label>
        <input
          id="target_journal"
          name="target_journal"
          defaultValue={article.target_journal ?? ""}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="keywords" className={labelClass}>
          Słowa kluczowe (oddzielone przecinkami)
        </label>
        <input
          id="keywords"
          name="keywords"
          defaultValue={article.keywords.join(", ")}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="abstract" className={labelClass}>
          Abstrakt
        </label>
        <textarea
          id="abstract"
          name="abstract"
          rows={5}
          defaultValue={article.abstract ?? ""}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select id="status" name="status" defaultValue={article.status} className={inputClass}>
            {ARTICLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ARTICLE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="progress_percent" className={labelClass}>
            Postęp (%)
          </label>
          <input
            id="progress_percent"
            name="progress_percent"
            type="number"
            min={0}
            max={100}
            defaultValue={article.progress_percent}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="next_step" className={labelClass}>
            Następny krok
          </label>
          <input
            id="next_step"
            name="next_step"
            defaultValue={article.next_step ?? ""}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="deadline" className={labelClass}>
            Deadline
          </label>
          <input
            id="deadline"
            name="deadline"
            type="date"
            defaultValue={article.deadline ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="chatgpt_link" className={labelClass}>
          Link do powiązanego czatu ChatGPT
        </label>
        <input
          id="chatgpt_link"
          name="chatgpt_link"
          type="url"
          placeholder="https://chatgpt.com/c/..."
          defaultValue={article.chatgpt_link ?? ""}
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-[#201a2b]">
        <input
          type="checkbox"
          name="is_private"
          defaultChecked={article.is_private}
          className="h-4 w-4"
        />
        Utajniony projekt
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <SubmitButton />
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[10px] border border-[#e6deec] px-5 py-2.5 text-sm font-medium text-[#706878] hover:border-[#d9cde5]"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}
