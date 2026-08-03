import { ARTICLE_STATUSES, ARTICLE_STATUS_LABELS, type ArticleStatus } from "@/lib/lab/types";

export type StatusFilterValue = ArticleStatus | "all";

function Chip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "inline-flex h-8 items-center gap-[7px] rounded-[7px] bg-[#f1eafd] px-3 text-[12px] font-medium text-[#5b2a86] transition-colors"
          : "inline-flex h-8 items-center gap-[7px] rounded-[7px] px-3 text-[12px] font-medium text-[#706878] transition-colors hover:bg-white hover:text-[#4c1f72]"
      }
    >
      {label}
      <span
        className={
          active
            ? "rounded-full bg-[#5b2a86]/[0.1] px-[6px] py-[2px] text-[10px] text-[#5b2a86]"
            : "rounded-full bg-[#5b2a86]/[0.08] px-[6px] py-[2px] text-[10px] text-[#706878]"
        }
      >
        {count}
      </span>
    </button>
  );
}

export default function ArticleStatusFilterBar({
  active,
  counts,
  total,
  onChange,
}: {
  active: StatusFilterValue;
  counts: Record<ArticleStatus, number>;
  total: number;
  onChange: (value: StatusFilterValue) => void;
}) {
  const visibleStatuses = ARTICLE_STATUSES.filter((status) => counts[status] > 0);

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-[10px] border border-[#e8e2ec] bg-[#fbfafc] p-1">
      <Chip active={active === "all"} label="Wszystkie" count={total} onClick={() => onChange("all")} />
      {visibleStatuses.map((status) => (
        <Chip
          key={status}
          active={active === status}
          label={ARTICLE_STATUS_LABELS[status]}
          count={counts[status]}
          onClick={() => onChange(status)}
        />
      ))}
    </div>
  );
}
