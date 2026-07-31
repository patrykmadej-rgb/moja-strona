import { IconCalendar } from "@tabler/icons-react";
import EventTimeline from "@/components/lab/EventTimeline";
import EmptyState from "@/components/lab/EmptyState";
import { todayDateString } from "@/lib/lab/format";
import type { ArticleEvent } from "@/lib/lab/types";

function pickHighlightEvents(events: ArticleEvent[], max = 5): ArticleEvent[] {
  const today = todayDateString();

  const lastCompleted = events
    .filter((e) => e.is_completed && e.event_date <= today)
    .sort((a, b) => b.event_date.localeCompare(a.event_date))
    .slice(0, 1);

  const upcoming = events
    .filter((e) => e.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));

  const seen = new Set<string>();
  const combined: ArticleEvent[] = [];
  for (const event of [...lastCompleted, ...upcoming]) {
    if (!seen.has(event.id)) {
      seen.add(event.id);
      combined.push(event);
    }
  }

  return combined.slice(0, max).sort((a, b) => a.event_date.localeCompare(b.event_date));
}

export default function ArticleTimelineCard({
  events,
  onNavigateTab,
}: {
  events: ArticleEvent[];
  onNavigateTab: () => void;
}) {
  const highlightEvents = pickHighlightEvents(events);

  return (
    <section className="flex min-h-[260px] flex-col rounded-[16px] border border-[#e6deec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-[#201a2b]">Oś czasu</h2>
        {events.length > 0 && (
          <button
            type="button"
            onClick={onNavigateTab}
            className="text-sm font-medium text-[#5b2a86] hover:underline"
          >
            Zobacz cały harmonogram →
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={IconCalendar}
            title="Nie dodano jeszcze wydarzeń"
            subtitle="Utwórz pierwszy etap pracy nad artykułem"
            action={{ label: "Dodaj wydarzenie", onClick: onNavigateTab }}
            compact
          />
        </div>
      ) : (
        <div className="mt-4">
          <EventTimeline events={highlightEvents} />
        </div>
      )}
    </section>
  );
}
