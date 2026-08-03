"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconDots } from "@tabler/icons-react";
import { Download, MessageSquare } from "lucide-react";
import StatusTag from "@/components/lab/StatusTag";
import PriorityTag from "@/components/lab/PriorityTag";
import { deleteArticle } from "@/app/lab/artykuly/actions";
import { fileKindLabel, formatDateMedium, formatTimeOnly } from "@/lib/lab/format";
import type { Article, LatestArticleVersion } from "@/lib/lab/types";

export const TABLE_GRID_COLS =
  "min-[900px]:grid-cols-[minmax(300px,1.7fr)_185px_145px_minmax(150px,0.9fr)_minmax(120px,0.7fr)_40px] min-[1200px]:grid-cols-[minmax(320px,1.7fr)_185px_145px_150px_minmax(170px,0.9fr)_minmax(130px,0.7fr)_40px]";

const linkButtonClass =
  "inline-flex min-h-[32px] items-center gap-1.5 whitespace-nowrap rounded-lg border border-transparent bg-transparent px-[9px] py-1.5 text-[11px] font-medium text-[#5b2a86] transition-colors hover:border-[#e3d8ec] hover:bg-[#f1eafd] hover:text-[#431d66] disabled:cursor-not-allowed disabled:opacity-60";

function RowMenu({ article }: { article: Article }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu artykułu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[#706878] transition-colors hover:bg-[#f1eafd] hover:text-[#4c1f72]"
      >
        <IconDots className="h-4 w-4" stroke={1.75} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-48 rounded-[10px] border border-[#e8e2ec] bg-white py-1 shadow-[0_8px_24px_rgba(49,30,64,0.12)]"
        >
          <Link
            href={`/lab/artykuly/${article.id}`}
            className="block px-3 py-1.5 text-left text-sm text-[#201a2b] hover:bg-[#f1eafd] hover:text-[#4c1f72]"
          >
            Otwórz
          </Link>
          <Link
            href={`/lab/artykuly/${article.id}?edit=1`}
            className="block px-3 py-1.5 text-left text-sm text-[#201a2b] hover:bg-[#f1eafd] hover:text-[#4c1f72]"
          >
            Edytuj
          </Link>
          <Link
            href={`/lab/artykuly/${article.id}?tab=wersje`}
            className="block px-3 py-1.5 text-left text-sm text-[#201a2b] hover:bg-[#f1eafd] hover:text-[#4c1f72]"
          >
            Dodaj wersję
          </Link>
          <Link
            href={`/lab/artykuly/${article.id}?tab=zrodla`}
            className="block px-3 py-1.5 text-left text-sm text-[#201a2b] hover:bg-[#f1eafd] hover:text-[#4c1f72]"
          >
            Dodaj źródło
          </Link>
          <form
            action={deleteArticle}
            onSubmit={(e) => {
              if (!confirm(`Usunąć artykuł „${article.title}”? Tej operacji nie można cofnąć.`)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={article.id} />
            <button
              type="submit"
              className="block w-full border-t border-[#eee9f2] px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Usuń
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function DownloadVersionButton({ version }: { version: LatestArticleVersion | null }) {
  if (!version || !version.file_path) {
    return <span className="text-[11px] italic text-[#9a919f]">Nie dodano</span>;
  }

  // Brak file_path w bazie to "brak wersji" (obsłużone wyżej) — ale jeśli
  // wpis w bazie istnieje, a plik w Storage zniknął albo podpisanie się nie
  // udało, signed_url będzie puste mimo istniejącego rekordu. To osobny,
  // rzadszy przypadek "plik niedostępny", żeby nie mylić go z "nie dodano".
  if (!version.signed_url) {
    return <span className="text-[11px] italic text-[#9a919f]">Plik niedostępny</span>;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <a
        href={version.signed_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={linkButtonClass}
      >
        <Download className="h-[14px] w-[14px]" strokeWidth={1.75} />
        Pobierz wersję
      </a>
      <span className="max-w-[160px] truncate text-[10px] text-[#9a919f]">
        v{version.version_number} · {fileKindLabel(version.file_name)}
      </span>
    </div>
  );
}

function ChatGptLinkButton({ link, articleId }: { link: string | null; articleId: string }) {
  if (!link) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] italic text-[#9a919f]">
        Nie dodano
        <Link
          href={`/lab/artykuly/${articleId}?edit=1`}
          onClick={(e) => e.stopPropagation()}
          className="not-italic font-medium text-[#5b2a86] hover:underline"
        >
          Dodaj
        </Link>
      </span>
    );
  }

  return (
    <a href={link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className={linkButtonClass}>
      <MessageSquare className="h-[14px] w-[14px]" strokeWidth={1.75} />
      Otwórz chat
    </a>
  );
}

export default function ArticleTableRow({
  article,
  isLast,
  latestVersion,
}: {
  article: Article;
  isLast: boolean;
  latestVersion: LatestArticleVersion | null;
}) {
  const router = useRouter();

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/lab/artykuly/${article.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/lab/artykuly/${article.id}`);
      }}
      className={
        (isLast ? "" : "border-b border-[#eee9f2] ") +
        `group flex cursor-pointer flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-[#fcfafc] min-[900px]:grid min-[900px]:min-h-[76px] min-[900px]:items-center min-[900px]:gap-4 min-[900px]:py-0 ${TABLE_GRID_COLS}`
      }
    >
      {/* Karta mobilna — poniżej 900px. */}
      <div className="min-[900px]:hidden">
        <p className="line-clamp-2 text-[13px] font-semibold leading-[1.4] text-[#282130]">{article.title}</p>
        <p className="mt-1 truncate text-[11px] text-[#817887]">{article.target_journal || "Nie określono czasopisma"}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <StatusTag status={article.status} />
          <PriorityTag priority={article.priority} compact={article.priority === "medium" || article.priority === "low"} />
        </div>
        <p className="mt-2.5 text-[11px] text-[#62596b]">
          Aktualizacja: {formatDateMedium(article.updated_at)}, {formatTimeOnly(article.updated_at)}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <DownloadVersionButton version={latestVersion} />
          <ChatGptLinkButton link={article.chatgpt_link} articleId={article.id} />
          <div className="ml-auto shrink-0">
            <RowMenu article={article} />
          </div>
        </div>
      </div>

      {/* Kolumny tabeli — od 900px wzwyż. */}
      <div className="hidden min-w-0 min-[900px]:block">
        <p className="line-clamp-2 text-[13px] font-semibold leading-[1.4] text-[#282130] transition-colors group-hover:text-[#5b2a86]">
          {article.title}
        </p>
        <p className="mt-1 truncate text-[11px] text-[#817887]">{article.target_journal || "Nie określono czasopisma"}</p>
      </div>

      <div className="hidden min-w-0 min-[900px]:flex min-[900px]:items-center">
        <StatusTag status={article.status} />
      </div>

      <div className="hidden min-[900px]:flex min-[900px]:items-center">
        {article.priority ? (
          <PriorityTag priority={article.priority} />
        ) : (
          <span className="text-[11px] italic text-[#9a919f]">Nie ustawiono</span>
        )}
      </div>

      <div className="hidden min-[1200px]:block">
        <p className="text-[12px] text-[#62596b]">{formatDateMedium(article.updated_at)}</p>
        <p className="text-[10px] text-[#9a919f]">{formatTimeOnly(article.updated_at)}</p>
      </div>

      <div className="hidden min-[900px]:block">
        <DownloadVersionButton version={latestVersion} />
      </div>

      <div className="hidden min-[900px]:block">
        <ChatGptLinkButton link={article.chatgpt_link} articleId={article.id} />
      </div>

      <div className="hidden min-[900px]:block">
        <RowMenu article={article} />
      </div>
    </div>
  );
}
