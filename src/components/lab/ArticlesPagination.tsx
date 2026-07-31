import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

export default function ArticlesPagination({
  rangeStart,
  rangeEnd,
  total,
  page,
  totalPages,
  onPageChange,
}: {
  rangeStart: number;
  rangeEnd: number;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex h-[52px] items-center justify-between border-t border-[#e8e2ec] px-4">
      <p className="text-[12px] text-[#706878]">
        {rangeStart}–{rangeEnd} z {total} {total === 1 ? "artykułu" : "artykułów"}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Poprzednia strona"
            className="flex h-7 w-7 items-center justify-center rounded-[9px] border border-[#e8e2ec] text-[#706878] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <IconChevronLeft className="h-3.5 w-3.5" stroke={1.75} />
          </button>
          <span className="px-1 text-[12px] text-[#706878]">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Następna strona"
            className="flex h-7 w-7 items-center justify-center rounded-[9px] border border-[#e8e2ec] text-[#706878] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <IconChevronRight className="h-3.5 w-3.5" stroke={1.75} />
          </button>
        </div>
      )}
    </div>
  );
}
