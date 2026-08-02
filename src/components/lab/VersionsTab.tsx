"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { deleteVersion } from "@/app/lab/artykuly/[id]/actions";
import { getArticleVersionDownloadUrl, uploadArticleVersion } from "@/lib/lab/articleVersionsStorage";
import { formatBytes, formatDateTime } from "@/lib/lab/format";
import type { ArticleVersion } from "@/lib/lab/types";

export default function VersionsTab({
  articleId,
  versions: initialVersions,
}: {
  articleId: string;
  versions: (ArticleVersion & { signedUrl: string | null })[];
}) {
  const [versions, setVersions] = useState<ArticleVersion[]>(initialVersions);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notesInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadError("Wybierz plik do wgrania.");
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    try {
      const notes = notesInputRef.current?.value.trim() || null;
      const version = await uploadArticleVersion(articleId, file, notes);
      setVersions((prev) => [version, ...prev]);
      formRef.current?.reset();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Nie udało się wgrać wersji.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (version: ArticleVersion) => {
    if (!version.file_path) return;
    setDownloadError(null);
    setDownloadingId(version.id);
    try {
      const url = await getArticleVersionDownloadUrl(version.file_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Nie udało się otworzyć pliku.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[16px] border border-[#e6deec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
        <h2 className="text-sm font-semibold text-[#201a2b]">Dodaj nową wersję</h2>
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            handleUpload();
          }}
          className="mt-4 flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="file" className="text-sm font-medium text-[#201a2b]">
              Plik (docx/pdf)
            </label>
            <input
              ref={fileInputRef}
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
              ref={notesInputRef}
              id="notes"
              name="notes"
              className="rounded-[10px] border border-[#e6deec] bg-white px-3 py-2 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86]"
            />
          </div>
          {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
          <button
            type="submit"
            disabled={isUploading}
            className="flex items-center gap-1.5 self-start rounded-[10px] bg-[#5b2a86] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
          >
            {isUploading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />}
            {isUploading ? "Wgrywanie…" : "Dodaj nową wersję"}
          </button>
          <p className="text-xs text-[#9a919f]">DOCX, PDF — maks. 30 MB.</p>
        </form>
      </section>

      <section>
        {downloadError && <p className="mb-2 text-sm text-red-600">{downloadError}</p>}
        {versions.length === 0 ? (
          <div className="rounded-[16px] border border-[#e6deec] bg-white px-6 py-10 text-center shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
            <p className="text-sm text-[#706878]">Brak wgranych wersji.</p>
          </div>
        ) : (
          <ul className="rounded-[16px] border border-[#e6deec] bg-white shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
            {versions.map((v, i) => (
              <li
                key={v.id}
                className={
                  i === versions.length - 1
                    ? "flex items-center justify-between gap-4 px-6 py-4"
                    : "flex items-center justify-between gap-4 border-b border-[#e6deec] px-6 py-4"
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
                  {v.file_path && (
                    <button
                      type="button"
                      onClick={() => handleDownload(v)}
                      disabled={downloadingId === v.id}
                      className="rounded-[10px] border border-[#e6deec] px-3 py-1.5 text-sm text-[#201a2b] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] hover:text-[#32134f] disabled:opacity-50"
                    >
                      {downloadingId === v.id ? "Otwieranie…" : "Pobierz"}
                    </button>
                  )}
                  <form
                    action={deleteVersion}
                    onSubmit={(e) => {
                      if (!confirm(`Usunąć wersję ${v.version_number}? Tej operacji nie można cofnąć.`)) {
                        e.preventDefault();
                        return;
                      }
                      setVersions((prev) => prev.filter((x) => x.id !== v.id));
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
