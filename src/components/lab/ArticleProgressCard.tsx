import { ARTICLE_STATUS_LABELS, type Article } from "@/lib/lab/types";
import { formatDateOnly } from "@/lib/lab/format";

export default function ArticleProgressCard({ article }: { article: Article }) {
  return (
    <section className="rounded-[16px] border border-[#e6deec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <h2 className="text-sm font-semibold text-[#201a2b]">Status i postęp</h2>

      <p className="mt-4 text-xs text-[#706878]">Aktualny etap</p>
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium text-[#201a2b]">
          <span className="h-2 w-2 rounded-full bg-[#5b2a86]" />
          {ARTICLE_STATUS_LABELS[article.status]}
        </span>
        <span className="text-sm font-medium text-[#5b2a86]">{article.progress_percent}%</span>
      </div>

      <div className="mt-2.5 h-1.5 w-full rounded-full bg-[#eee9f2]">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-[#6c35a1] to-[#8b5bb7]"
          style={{ width: `${article.progress_percent}%` }}
        />
      </div>

      <div className="mt-5 border-t border-[#e6deec] pt-4">
        <p className="text-xs text-[#706878]">Następny krok</p>
        <p className={article.next_step ? "mt-1 text-sm text-[#201a2b]" : "mt-1 text-sm italic text-[#706878]"}>
          {article.next_step || "Nie określono"}
        </p>
      </div>

      <div className="mt-3">
        <p className="text-xs text-[#706878]">Deadline</p>
        <p className={article.deadline ? "mt-1 text-sm text-[#201a2b]" : "mt-1 text-sm italic text-[#706878]"}>
          {article.deadline ? formatDateOnly(article.deadline) : "Nie ustawiono"}
        </p>
      </div>
    </section>
  );
}
