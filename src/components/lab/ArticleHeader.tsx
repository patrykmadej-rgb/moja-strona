"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconDots, IconEdit, IconLock, IconTrash } from "@tabler/icons-react";
import ArticleStatusSelector from "@/components/lab/ArticleStatusSelector";
import ArticlePrioritySelector from "@/components/lab/ArticlePrioritySelector";
import QuickActionsToolbar from "@/components/lab/QuickActionsToolbar";
import { deleteArticle } from "@/app/lab/artykuly/actions";
import { formatDate } from "@/lib/lab/format";
import type { TabKey } from "@/components/lab/ArticleTabs";
import type { Article } from "@/lib/lab/types";

export default function ArticleHeader({
  article,
  onEdit,
  onNavigateTab,
}: {
  article: Article;
  onEdit: () => void;
  onNavigateTab: (tab: TabKey) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 items-start gap-6 min-[800px]:grid-cols-[minmax(0,1fr)_240px] min-[800px]:gap-7 min-[1100px]:grid-cols-[minmax(0,1fr)_270px]">
      <div className="min-w-0">
        <Link
          href="/lab/artykuly"
          className="flex items-center gap-1.5 text-sm text-[#706878] transition-colors hover:text-[#5b2a86]"
        >
          <IconArrowLeft className="h-4 w-4" stroke={1.75} />
          Powrót do listy
        </Link>

        <h1
          className="mt-4 max-w-[1000px] font-[family-name:var(--font-cormorant)] font-medium text-[#201a2b]"
          style={{
            fontSize: "clamp(38px, 3.2vw, 54px)",
            lineHeight: 1.04,
            letterSpacing: "-0.015em",
          }}
        >
          {article.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <ArticleStatusSelector articleId={article.id} status={article.status} />
          <ArticlePrioritySelector articleId={article.id} priority={article.priority} />
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

      <div className="flex w-full shrink-0 flex-col items-end gap-3 pt-0.5 min-[800px]:w-[240px] min-[1100px]:w-[270px]">
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-[10px] border border-[#e6deec] px-4 py-2 text-sm font-medium text-[#201a2b] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] hover:text-[#32134f]"
          >
            <IconEdit className="h-4 w-4" stroke={1.75} />
            Edytuj artykuł
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Więcej akcji"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-[#e6deec] text-[#706878] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] hover:text-[#32134f]"
            >
              <IconDots className="h-4 w-4" stroke={1.75} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-48 rounded-[10px] border border-[#e6deec] bg-white py-1 shadow-[0_8px_24px_rgba(49,30,64,0.12)]">
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

        <QuickActionsToolbar onNavigateTab={onNavigateTab} />
      </div>
    </div>
  );
}
