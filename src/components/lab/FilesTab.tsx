"use client";

import { useCallback, useRef, useState } from "react";
import {
  IconCloudUpload,
  IconDownload,
  IconFile,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconFileTypePpt,
  IconFileTypeXls,
  IconLoader2,
  IconPhoto,
  IconTrash,
} from "@tabler/icons-react";
import { deleteFile, getDownloadUrl, uploadFile, type ArticleFile } from "@/lib/article-files";
import { formatBytes, formatDateTime } from "@/lib/lab/format";

function FileIcon({ fileType }: { fileType: string | null }) {
  const className = "h-5 w-5 text-[#5b2a86]";
  if (fileType?.startsWith("image/")) return <IconPhoto className={className} stroke={1.75} />;
  if (fileType === "application/pdf") return <IconFileTypePdf className={className} stroke={1.75} />;
  if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return <IconFileTypeDocx className={className} stroke={1.75} />;
  }
  if (fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || fileType === "text/csv") {
    return <IconFileTypeXls className={className} stroke={1.75} />;
  }
  if (fileType === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
    return <IconFileTypePpt className={className} stroke={1.75} />;
  }
  return <IconFile className={className} stroke={1.75} />;
}

export default function FilesTab({
  articleId,
  files: initialFiles,
}: {
  articleId: string;
  files: ArticleFile[];
}) {
  const [files, setFiles] = useState<ArticleFile[]>(initialFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);
      setIsUploading(true);
      try {
        const newFile = await uploadFile(articleId, file);
        setFiles((prev) => [newFile, ...prev]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się wgrać pliku.");
      } finally {
        setIsUploading(false);
      }
    },
    [articleId],
  );

  const handleDelete = useCallback(async (file: ArticleFile) => {
    if (!confirm(`Usunąć plik „${file.file_name}”?`)) return;
    setError(null);
    setDeletingId(file.id);
    try {
      await deleteFile(file.id, file.storage_path);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się usunąć pliku.");
    } finally {
      setDeletingId(null);
    }
  }, []);

  const handleDownload = useCallback(async (file: ArticleFile) => {
    setError(null);
    try {
      const url = await getDownloadUrl(file.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać pliku.");
    }
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingOver(false);
      const file = event.dataTransfer.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload],
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[16px] border border-[#e6deec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-[family-name:var(--font-cormorant)] text-lg font-semibold text-[#5b2a86]">
            Pliki
          </h2>
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex shrink-0 items-center gap-2 rounded-[10px] bg-[#5b2a86] px-4 py-2 text-sm font-normal text-[#f7f4ef] transition-colors hover:bg-[#32134f] disabled:opacity-50"
          >
            {isUploading && <IconLoader2 className="h-4 w-4 animate-spin" stroke={1.75} />}
            {isUploading ? "Wgrywanie…" : "Dodaj plik"}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) handleUpload(file);
          }}
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          className={
            isDraggingOver
              ? "mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-[16px] border-2 border-dashed border-[#5b2a86] bg-[#f1eafd] px-6 py-10 text-center"
              : "mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-[16px] border-2 border-dashed border-[#B4A8C4] bg-[#f1eafd] px-6 py-10 text-center"
          }
        >
          <IconCloudUpload className="h-8 w-8 text-[#706878]" stroke={1.5} />
          <p className="text-sm text-[#706878]">
            Przeciągnij plik tutaj lub kliknij, aby wybrać
          </p>
          <p className="text-xs text-[#706878]/70">PDF, Word, Excel, PowerPoint, obraz lub CSV — maks. 20 MB</p>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>

      <section>
        {files.length === 0 ? (
          <div className="rounded-[16px] border border-[#e6deec] bg-white px-6 py-10 text-center shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
            <p className="text-sm text-[#706878]">Brak plików.</p>
          </div>
        ) : (
          <ul className="rounded-[16px] border border-[#e6deec] bg-white px-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
            {files.map((file, i) => (
              <li
                key={file.id}
                className={
                  i === files.length - 1
                    ? "flex items-center justify-between gap-4 py-4"
                    : "flex items-center justify-between gap-4 border-b border-[#e6deec] py-4"
                }
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f1eafd]">
                    <FileIcon fileType={file.file_type} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#201a2b]">{file.file_name}</p>
                    <p className="mt-0.5 truncate text-xs text-[#706878]">
                      {formatDateTime(file.created_at)} · {formatBytes(file.file_size)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleDownload(file)}
                    title="Pobierz"
                    className="text-[#5b2a86] hover:opacity-70"
                  >
                    <IconDownload className="h-4.5 w-4.5" stroke={1.75} />
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === file.id}
                    onClick={() => handleDelete(file)}
                    title="Usuń"
                    className="text-red-600 hover:opacity-70 disabled:opacity-50"
                  >
                    {deletingId === file.id ? (
                      <IconLoader2 className="h-4.5 w-4.5 animate-spin" stroke={1.75} />
                    ) : (
                      <IconTrash className="h-4.5 w-4.5" stroke={1.75} />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
