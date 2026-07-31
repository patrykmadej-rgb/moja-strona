"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { addVersion, deleteVersion } from "@/app/lab/artykuly/[id]/actions";
import { formatBytes, formatDateTime } from "@/lib/lab/format";
import type { ArticleVersion } from "@/lib/lab/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-[10px] bg-[#5b2a86] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
    >
      {pending ? "Wgrywanie…" : "Dodaj nową wersję"}
    </button>
  );
}

export default function VersionsTab({
  articleId,
  versions,
}: {
  articleId: string;
  versions: (ArticleVersion & { signedUrl: string | null })[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[14px] border border-[#e8e2ec] bg-white/95 p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
        <h2 className="text-sm font-semibold text-[#201a2b]">Dodaj nową wersję</h2>
        <form
          ref={formRef}
          action={async (formData) => {
            await addVersion(formData);
            formRef.current?.reset();
          }}
          className="mt-4 flex flex-col gap-3"
        >
          <input type="hidden" name="article_id" value={articleId} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="file" className="text-sm font-medium text-[#201a2b]">
              Plik (docx/pdf)
            </label>
            <input
              id="file"
              name="file"
              type="file"
              accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              required
              className="text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-sm font-medium text-[#201a2b]">
              Notatki (opcjonalnie)
            </label>
            <input
              id="notes"
              name="notes"
              className="rounded-[10px] border border-[#e8e2ec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86]"
            />
          </div>
          <SubmitButton />
        </form>
      </section>

      <section>
        {versions.length === 0 ? (
          <div className="rounded-[14px] border border-[#e8e2ec] bg-white/95 px-6 py-10 text-center shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
            <p className="text-sm text-[#706878]">Brak wgranych wersji.</p>
          </div>
        ) : (
          <ul className="rounded-[14px] border border-[#e8e2ec] bg-white/95 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
            {versions.map((v, i) => (
              <li
                key={v.id}
                className={
                  i === versions.length - 1
                    ? "flex items-center justify-between gap-4 px-6 py-4"
                    : "flex items-center justify-between gap-4 border-b border-[#e8e2ec] px-6 py-4"
                }
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#201a2b]">
                    v{v.version_number} · {v.file_name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[#706878]">
                    {formatBytes(v.file_size_bytes)} · {formatDateTime(v.uploaded_at)}
                    {v.notes ? ` · ${v.notes}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {v.signedUrl && (
                    <a
                      href={v.signedUrl}
                      className="rounded-[10px] border border-[#e8e2ec] px-3 py-1.5 text-sm text-[#201a2b] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] hover:text-[#32134f]"
                    >
                      Pobierz
                    </a>
                  )}
                  <form
                    action={deleteVersion}
                    onSubmit={(e) => {
                      if (!confirm(`Usunąć wersję ${v.version_number}? Tej operacji nie można cofnąć.`)) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="article_id" value={articleId} />
                    <input type="hidden" name="id" value={v.id} />
                    <input type="hidden" name="file_path" value={v.file_path ?? ""} />
                    <button type="submit" className="text-sm text-red-600 hover:underline">
                      Usuń
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
