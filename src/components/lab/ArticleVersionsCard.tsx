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
import { fileKindLabel, formatBytes, formatDateTime } from "@/lib/lab/format";
import type { ArticleVersion } from "@/lib/lab/types";

const VISIBLE_VERSIONS = 5;

function FileTypeIcon({ fileName }: { fileName: string | null }) {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  const className = "h-4 w-4 text-[#5b2a86]";
  if (ext === "pdf") return <IconFileTypePdf className={className} stroke={1.75} />;
  if (ext === "docx" || ext === "doc") return <IconFileTypeDocx className={className} stroke={1.75} />;
  return <IconFileText className={className} stroke={1.75} />;
}

export default function ArticleVersionsCard({
  articleId,
  versions,
  onNavigateTab,
}: {
  articleId: string;
  versions: (ArticleVersion & { signedUrl: string | null })[];
  onNavigateTab: () => void;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const visible = versions.slice(0, VISIBLE_VERSIONS);
  const hasMore = versions.length > VISIBLE_VERSIONS;

  return (
    <section className="rounded-[16px] border border-[#e6deec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <h2 className="text-sm font-semibold text-[#201a2b]">Wersje</h2>

      {versions.length === 0 ? (
        <EmptyState
          icon={IconFileText}
          title="Nie dodano jeszcze żadnej wersji"
          action={{ label: "Dodaj pierwszą wersję", onClick: onNavigateTab }}
          compact
        />
      ) : (
        <>
          <ul className="mt-4 flex flex-col gap-3.5">
            {visible.map((version, index) => (
              <li
                key={version.id}
                className={
                  index === visible.length - 1
                    ? "flex flex-col gap-1.5"
                    : "flex flex-col gap-1.5 border-b border-[#f0ecf3] pb-3.5"
                }
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f1eafd]">
                    <FileTypeIcon fileName={version.file_name} />
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-[#201a2b]">
                    {version.file_name || "Bez nazwy"}
                  </p>
                  {index === 0 && (
                    <span className="shrink-0 rounded-full bg-[#f1eafd] px-2 py-0.5 text-[10px] font-medium text-[#5b2a86]">
                      Najnowsza
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pl-[42px]">
                  <p className="min-w-0 truncate text-xs text-[#706878]">
                    v{version.version_number} · {fileKindLabel(version.file_name)} ·{" "}
                    {formatBytes(version.file_size_bytes)} · {formatDateTime(version.uploaded_at)}
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    {version.signedUrl && (
                      <a
                        href={version.signedUrl}
                        aria-label="Pobierz"
                        title="Pobierz"
                        className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-[#e6deec] text-[#706878] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] hover:text-[#32134f]"
                      >
                        <IconDownload className="h-3.5 w-3.5" stroke={1.75} />
                      </a>
                    )}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId((v) => (v === version.id ? null : version.id))}
                        aria-label="Więcej akcji"
                        aria-haspopup="menu"
                        aria-expanded={openMenuId === version.id}
                        className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-[#e6deec] text-[#706878] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] hover:text-[#32134f]"
                      >
                        <IconDots className="h-3.5 w-3.5" stroke={1.75} />
                      </button>
                      {openMenuId === version.id && (
                        <div className="absolute right-0 z-10 mt-1 w-40 rounded-[10px] border border-[#e6deec] bg-white py-1 shadow-[0_8px_24px_rgba(49,30,64,0.12)]">
                          <form
                            action={deleteVersion}
                            onSubmit={(e) => {
                              if (
                                !confirm(
                                  `Usunąć wersję ${version.version_number}? Tej operacji nie można cofnąć.`,
                                )
                              ) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <input type="hidden" name="article_id" value={articleId} />
                            <input type="hidden" name="id" value={version.id} />
                            <input type="hidden" name="file_path" value={version.file_path ?? ""} />
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
                </div>
              </li>
            ))}
          </ul>

          {hasMore && (
            <button
              type="button"
              onClick={onNavigateTab}
              className="mt-4 text-sm font-medium text-[#5b2a86] hover:underline"
            >
              Zobacz wszystkie wersje →
            </button>
          )}
        </>
      )}
    </section>
  );
}
