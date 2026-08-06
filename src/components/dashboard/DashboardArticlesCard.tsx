import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import StatusTag from "@/components/lab/StatusTag";
import PriorityTag from "@/components/lab/PriorityTag";
import { formatRelativeTime } from "@/lib/lab/format";
import type { DashboardArticleRow } from "@/lib/dashboard/types";

export default function DashboardArticlesCard({ articles, error }: { articles: DashboardArticleRow[]; error: string | null }) {
  return (
    <section aria-labelledby="dashboard-articles-heading" className="flex h-full flex-col rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <div className="flex items-center justify-between gap-4">
        <h2 id="dashboard-articles-heading" className="text-sm font-semibold text-[#201a2b]">
          Artykuły w toku
        </h2>
        <Link href="/lab/artykuly" className="text-xs font-medium text-[#5b2a86] hover:underline">
          Zobacz wszystkie →
        </Link>
      </div>

      {error ? (
        <p className="mt-3 text-xs text-[#9a2f2f]">{error}</p>
      ) : articles.length === 0 ? (
        <EmptyState icon={FileText} title="Brak artykułów w toku" subtitle="Dodaj pierwszy artykuł, żeby zacząć śledzić postęp." compact />
      ) : (
        <div className="mt-3 -mx-2 overflow-x-auto">
          {/*
            Sekcja 14 briefu: na mobile zachowaj TYTUŁ i STATUS, ukryj mniej
            ważne kolumny (Priorytet, Aktualizacja) — w tej kolejności
            "ważności", nie odwrotnie.
          */}
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[#9a919f]">
                <th className="px-2 pb-2 font-medium">Tytuł</th>
                <th className="px-2 pb-2 font-medium">Status</th>
                <th className="hidden px-2 pb-2 font-medium min-[560px]:table-cell">Priorytet</th>
                <th className="hidden px-2 pb-2 font-medium min-[700px]:table-cell">Aktualizacja</th>
                <th className="w-6 px-2 pb-2" />
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id} className="border-t border-[#eee9f2]">
                  <td className="px-2 py-2.5">
                    <Link href={`/lab/artykuly/${article.id}`} className="line-clamp-2 font-medium text-[#201a2b] hover:text-[#5b2a86]">
                      {article.title}
                    </Link>
                  </td>
                  <td className="px-2 py-2.5">
                    <StatusTag status={article.status} />
                  </td>
                  <td className="hidden px-2 py-2.5 min-[560px]:table-cell">
                    <PriorityTag priority={article.priority} compact />
                  </td>
                  <td className="hidden px-2 py-2.5 text-xs text-[#9a919f] min-[700px]:table-cell">{formatRelativeTime(article.updatedAt)}</td>
                  <td className="px-2 py-2.5 text-right">
                    <Link href={`/lab/artykuly/${article.id}`} aria-label={`Otwórz artykuł: ${article.title}`}>
                      <ChevronRight className="h-4 w-4 text-[#9a919f]" strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
