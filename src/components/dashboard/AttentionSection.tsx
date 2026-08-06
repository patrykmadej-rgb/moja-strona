import Link from "next/link";
import { AlertTriangle, Clock, Eye, Info, CheckCircle2, GraduationCap, FileText } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import { ATTENTION_SEVERITY_LABELS, type AttentionSeverity, type DashboardAttentionItem, type DashboardSource } from "@/lib/dashboard/types";

const SEVERITY_STYLES: Record<AttentionSeverity, { icon: typeof AlertTriangle; badgeClass: string; iconClass: string }> = {
  critical: { icon: AlertTriangle, badgeClass: "bg-[#fbe9e9] text-[#9a2f2f]", iconClass: "text-[#9a2f2f]" },
  urgent: { icon: Clock, badgeClass: "bg-[#fdf1de] text-[#8a5a12]", iconClass: "text-[#8a5a12]" },
  review: { icon: Eye, badgeClass: "bg-[#f1eafd] text-[#5b2a86]", iconClass: "text-[#5b2a86]" },
  info: { icon: Info, badgeClass: "bg-[#efedf0] text-[#4f4758]", iconClass: "text-[#4f4758]" },
};

const SOURCE_ICONS: Record<DashboardSource, typeof GraduationCap> = {
  school: GraduationCap,
  article: FileText,
};

const SOURCE_LABELS: Record<DashboardSource, string> = {
  school: "Szkoła",
  article: "Artykuł",
};

function AttentionRow({ item }: { item: DashboardAttentionItem }) {
  const { icon: SeverityIcon, badgeClass, iconClass } = SEVERITY_STYLES[item.severity];
  const SourceIcon = SOURCE_ICONS[item.source];

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee9f2] py-3.5 last:border-b-0">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#f7f4ef] ${iconClass}`}>
          <SeverityIcon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-[#201a2b]">{item.title}</p>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}>
              {ATTENTION_SEVERITY_LABELS[item.severity]}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#efedf0] px-2 py-0.5 text-[10px] font-medium text-[#4f4758]">
              <SourceIcon className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
              {SOURCE_LABELS[item.source]}
            </span>
          </div>
          {item.context && <p className="mt-0.5 truncate text-xs text-[#706878]">{item.context}</p>}
        </div>
      </div>
      <Link
        href={item.actionHref}
        className="shrink-0 rounded-[10px] border border-[#e8e2ec] px-3 py-1.5 text-xs font-medium text-[#5b2a86] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]"
      >
        {item.actionLabel}
      </Link>
    </li>
  );
}

export default function AttentionSection({ items, error }: { items: DashboardAttentionItem[]; error: string | null }) {
  return (
    <section aria-labelledby="dashboard-attention-heading" className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <h2 id="dashboard-attention-heading" className="text-sm font-semibold text-[#201a2b]">
        Wymaga Twojej uwagi
      </h2>

      {error ? (
        <p className="mt-3 text-xs text-[#9a2f2f]">{error}</p>
      ) : items.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Wszystko jest pod kontrolą. Brak pilnych spraw." compact />
      ) : (
        <ul className="mt-3">
          {items.map((item) => (
            <AttentionRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}
