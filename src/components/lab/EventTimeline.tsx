import { IconCheck } from "@tabler/icons-react";
import { formatShortDate } from "@/lib/lab/format";
import type { ArticleEvent } from "@/lib/lab/types";

function truncateTitle(title: string, max = 16): string {
  return title.length > max ? `${title.slice(0, max - 1)}…` : title;
}

export default function EventTimeline({ events }: { events: ArticleEvent[] }) {
  const sorted = [...events].sort((a, b) => a.event_date.localeCompare(b.event_date));

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex items-start">
        {sorted.map((event, i) => (
          <div key={event.id} className="flex items-start">
            {i > 0 && <div className="mt-[7px] h-px w-8 shrink-0 bg-[#4A1D6E]/25" />}
            <div className="flex w-24 shrink-0 flex-col items-center gap-1.5 text-center">
              {event.is_completed ? (
                <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center bg-[#4A1D6E]">
                  <IconCheck className="h-2.5 w-2.5 text-white" stroke={3} />
                </div>
              ) : (
                <div className="h-3.5 w-3.5 shrink-0 border border-[#4A1D6E]/50 bg-white" />
              )}
              <span className="text-[11px] text-[#4A3360]">{formatShortDate(event.event_date)}</span>
              <span className="text-xs text-[#1C1028]" title={event.title}>
                {truncateTitle(event.title)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
