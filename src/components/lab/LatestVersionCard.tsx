"use client";

import { useState } from "react";
import {
  IconDots,
  IconDownload,
  IconFileText,
  IconFileTypeDocx,
  IconFileTypePdf,
} from "@tabler/icons-react";
import { deleteVersion } from "@/app/lab/artykuly/[id]/actions";
import EmptyState from "@/components/lab/EmptyState";
import { formatBytes, formatDateTime } from "@/lib/lab/format";
import type { ArticleVersion } from "@/lib/lab/types";

function fileKindLabel(fileName: string | null): string {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (ext === "docx" || ext === "doc") return "DOCX";
  if (ext === "pdf") return "PDF";
  return ext ? ext.toUpperCase() : "Plik";
}

function FileTypeIcon({ fileName }: { fileName: string | null }) {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  const className = "h-5 w-5 text-[#5b2a86]";
  if (ext === "pdf") return <IconFileTypePdf className={className} stroke={1.75} />;
  if (ext === "docx" || ext === "doc") return <IconFileTypeDocx className={className} stroke={1.75} />;
  return <IconFileText className={className} stroke={1.75} />;
}

export default function LatestVersionCard({
  articleId,
  latestVersion,
  onNavigateTab,
}: {
  articleId: string;
  latestVersion: (ArticleVersion & { signedUrl: string | null }) | null;
  onNavigateTab: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className="rounded-[14px] border border-[#e8e2ec] bg-white/95 p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <h2 className="text-sm font-semibold text-[#201a2b]">Najnowsza wersja</h2>

      {latestVersion ? (
        <>
          <div className="mt-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f1eafd]">
              <FileTypeIcon fileName={latestVersion.file_name} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#201a2b]">
                {latestVersion.file_name || "Bez nazwy"}
              </p>
              <p className="mt-0.5 truncate text-xs text-[#706878]">
                {fileKindLabel(latestVersion.file_name)} · {formatBytes(latestVersion.file_size_bytes)} ·{" "}
                {formatDateTime(latestVersion.uploaded_at)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            {latestVersion.signedUrl && (
              <a
                href={latestVersion.signedUrl}
                className="flex items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-3 py-1.5 text-sm text-[#201a2b] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] hover:text-[#32134f]"
              >
                <IconDownload className="h-4 w-4" stroke={1.75} />
                Pobierz
              </a>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#e8e2ec] text-[#706878] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] hover:text-[#32134f]"
              >
                <IconDots className="h-4 w-4" stroke={1.75} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-10 mt-1 w-40 rounded-[10px] border border-[#e8e2ec] bg-white py-1 shadow-[0_8px_24px_rgba(49,30,64,0.12)]">
                  <form
                    action={deleteVersion}
                    onSubmit={(e) => {
                      if (
                        !confirm(
                          `Usunąć wersję ${latestVersion.version_number}? Tej operacji nie można cofnąć.`,
                        )
                      ) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="article_id" value={articleId} />
                    <input type="hidden" name="id" value={latestVersion.id} />
                    <input type="hidden" name="file_path" value={latestVersion.file_path ?? ""} />
                    <button
                      type="submit"
                      className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      Usuń wersję
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateTab}
            className="mt-3 text-sm font-medium text-[#5b2a86] hover:underline"
          >
            Zobacz wszystkie wersje →
          </button>
        </>
      ) : (
        <EmptyState
          icon={IconFileText}
          title="Nie dodano jeszcze żadnej wersji"
          action={{ label: "Dodaj pierwszą wersję", onClick: onNavigateTab }}
          compact
        />
      )}
    </section>
  );
}
