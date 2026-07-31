"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconDots, IconPointFilled } from "@tabler/icons-react";
import StatusTag, { STATUS_COLORS } from "@/components/lab/StatusTag";
import { deleteArticle } from "@/app/lab/artykuly/actions";
import { formatDateMedium, formatTimeOnly } from "@/lib/lab/format";
import type { Article } from "@/lib/lab/types";

export const TABLE_GRID_COLS =
  "min-[768px]:grid-cols-[minmax(240px,1.8fr)_110px_130px_40px] min-[1100px]:grid-cols-[minmax(300px,1.8fr)_120px_150px_minmax(180px,1fr)_40px]";

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

export default function ArticleTableRow({ article, isLast }: { article: Article; isLast: boolean }) {
  const router = useRouter();
  const dotColor = STATUS_COLORS[article.status].text;

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
        `group flex cursor-pointer flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-[#fcfafc] min-[768px]:grid min-[768px]:min-h-[76px] min-[768px]:items-center min-[768px]:gap-4 min-[768px]:py-0 ${TABLE_GRID_COLS}`
      }
    >
      <div className="flex items-start justify-between gap-3 min-[768px]:block">
        <div className="min-w-0">
          <p className="line-clamp-2 text-[13px] font-semibold leading-[1.4] text-[#282130] transition-colors group-hover:text-[#5b2a86]">
            {article.title}
          </p>
          <p className="mt-1 truncate text-[11px] text-[#817887]">
            {article.target_journal || "Nie określono czasopisma"}
          </p>
        </div>
        <div className="shrink-0 min-[768px]:hidden">
          <RowMenu article={article} />
        </div>
      </div>

      <div>
        <StatusTag status={article.status} />
      </div>

      <div className="text-[11px] text-[#62596b]">
        {formatDateMedium(article.updated_at)}
        <span className="block text-[#9a919f]">{formatTimeOnly(article.updated_at)}</span>
      </div>

      <div className="min-[768px]:hidden min-[1100px]:block">
        {article.next_step ? (
          <span className="flex items-center gap-1.5 text-[11px] text-[#4f4758]">
            <IconPointFilled className="h-2.5 w-2.5 shrink-0" style={{ color: dotColor }} />
            <span className="truncate">{article.next_step}</span>
          </span>
        ) : (
          <span className="text-[11px] italic text-[#9a919f]">Nie określono</span>
        )}
      </div>

      <div className="hidden min-[768px]:block">
        <RowMenu article={article} />
      </div>
    </div>
  );
}
