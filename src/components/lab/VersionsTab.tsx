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
      className="self-start bg-[#4A1D6E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4A2073] disabled:opacity-50"
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
      <section className="border border-[#4A1D6E]/15 bg-white p-6">
        <h2 className="text-sm font-semibold text-[#1C1028]">Dodaj nową wersję</h2>
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
            <label htmlFor="file" className="text-sm font-medium text-[#1C1028]">
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
            <label htmlFor="notes" className="text-sm font-medium text-[#1C1028]">
              Notatki (opcjonalnie)
            </label>
            <input
              id="notes"
              name="notes"
              className="border border-[#4A1D6E]/25 bg-white px-3 py-2 text-sm text-[#1C1028] outline-none focus:border-[#4A1D6E]"
            />
          </div>
          <SubmitButton />
        </form>
      </section>

      <section>
        {versions.length === 0 ? (
          <div className="border border-[#4A1D6E]/15 bg-white px-6 py-10 text-center">
            <p className="text-sm text-[#4A3360]">Brak wgranych wersji.</p>
          </div>
        ) : (
          <ul>
            {versions.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-4 border-b-[0.5px] border-[#4A1D6E]/20 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#1C1028]">
                    v{v.version_number} · {v.file_name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[#4A3360]">
                    {formatBytes(v.file_size_bytes)} · {formatDateTime(v.uploaded_at)}
                    {v.notes ? ` · ${v.notes}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {v.signedUrl && (
                    <a
                      href={v.signedUrl}
                      className="border border-[#4A1D6E]/25 px-3 py-1.5 text-sm text-[#4A1D6E] hover:border-[#4A1D6E]/50"
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
