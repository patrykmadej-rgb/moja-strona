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
  const className = "h-5 w-5 text-[#4A1D6E]";
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
      <section className="border border-[#4A1D6E]/15 bg-[#F5F1EC] p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-[family-name:var(--font-cormorant)] text-lg font-semibold text-[#4A1D6E]">
            Pliki
          </h2>
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex shrink-0 items-center gap-2 bg-[#4A1D6E] px-4 py-2 text-sm font-normal text-[#F5F1EC] transition-colors hover:bg-[#4A2073] disabled:opacity-50"
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
              ? "mt-4 flex cursor-pointer flex-col items-center gap-2 border-2 border-dashed border-[#4A1D6E] bg-[#EDE6F8] px-6 py-10 text-center"
              : "mt-4 flex cursor-pointer flex-col items-center gap-2 border-2 border-dashed border-[#B4A8C4] bg-[#EDE6F8] px-6 py-10 text-center"
          }
        >
          <IconCloudUpload className="h-8 w-8 text-[#4A3360]" stroke={1.5} />
          <p className="text-sm text-[#4A3360]">
            Przeciągnij plik tutaj lub kliknij, aby wybrać
          </p>
          <p className="text-xs text-[#4A3360]/70">PDF, Word, Excel, PowerPoint, obraz lub CSV — maks. 20 MB</p>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>

      <section>
        {files.length === 0 ? (
          <div className="border border-[#4A1D6E]/15 bg-white px-6 py-10 text-center">
            <p className="text-sm text-[#4A3360]">Brak plików.</p>
          </div>
        ) : (
          <ul>
            {files.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between gap-4 border-b-[0.5px] border-[#4A1D6E]/20 py-4"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#EDE6F8]">
                    <FileIcon fileType={file.file_type} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#1C1028]">{file.file_name}</p>
                    <p className="mt-0.5 truncate text-xs text-[#4A3360]">
                      {formatDateTime(file.created_at)} · {formatBytes(file.file_size)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleDownload(file)}
                    title="Pobierz"
                    className="text-[#4A1D6E] hover:opacity-70"
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
