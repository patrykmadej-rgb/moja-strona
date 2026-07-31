"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconDots, IconEdit, IconLock, IconTrash } from "@tabler/icons-react";
import StatusTag from "@/components/lab/StatusTag";
import { deleteArticle } from "@/app/lab/artykuly/actions";
import { formatDate } from "@/lib/lab/format";
import type { Article } from "@/lib/lab/types";

export default function ArticleHeader({
  article,
  onEdit,
}: {
  article: Article;
  onEdit: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/lab/artykuly"
          className="flex items-center gap-1.5 text-sm text-[#706878] transition-colors hover:text-[#5b2a86]"
        >
          <IconArrowLeft className="h-4 w-4" stroke={1.75} />
          Powrót do listy
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-4 py-2 text-sm font-medium text-[#201a2b] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] hover:text-[#32134f]"
          >
            <IconEdit className="h-4 w-4" stroke={1.75} />
            Edytuj artykuł
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-[#e8e2ec] text-[#706878] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] hover:text-[#32134f]"
            >
              <IconDots className="h-4 w-4" stroke={1.75} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-48 rounded-[10px] border border-[#e8e2ec] bg-white py-1 shadow-[0_8px_24px_rgba(49,30,64,0.12)]">
                <form
                  action={async (formData) => {
                    if (!confirm(`Usunąć artykuł „${article.title}”? Tej operacji nie można cofnąć.`)) {
                      return;
                    }
                    await deleteArticle(formData);
                    router.push("/lab/artykuly");
                  }}
                >
                  <input type="hidden" name="id" value={article.id} />
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <IconTrash className="h-4 w-4" stroke={1.75} />
                    Usuń artykuł
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      <h1
        className="mt-4 max-w-[850px] font-[family-name:var(--font-cormorant)] font-medium text-[#201a2b]"
        style={{ fontSize: "clamp(32px, 3vw, 44px)", lineHeight: 1.08 }}
      >
        {article.title}
      </h1>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <StatusTag status={article.status} />
        {article.is_private && (
          <span className="flex items-center gap-1 text-xs text-[#706878]">
            <IconLock className="h-3.5 w-3.5" stroke={1.75} />
            Utajniony projekt
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-[#706878]">
        Utworzono {formatDate(article.created_at)} · Zaktualizowano {formatDate(article.updated_at)}
      </p>
    </div>
  );
}
