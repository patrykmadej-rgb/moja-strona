import type { Article, ArticleEvent, ArticleVersion } from "@/lib/lab/types";
import { formatBytes, formatDateTime, todayDateString } from "@/lib/lab/format";
import StatusTag from "@/components/lab/StatusTag";
import EventTimeline from "@/components/lab/EventTimeline";

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

export default function OverviewTab({
  article,
  latestVersion,
  versionsCount,
  sourcesCount,
  events,
  onNavigateTab,
}: {
  article: Article;
  latestVersion: (ArticleVersion & { signedUrl: string | null }) | null;
  versionsCount: number;
  sourcesCount: number;
  events: ArticleEvent[];
  onNavigateTab: (tab: "wersje" | "zrodla" | "harmonogram") => void;
}) {
  const highlightEvents = pickHighlightEvents(events);

  return (
    <div className="flex flex-col gap-6">
      <section className="border border-[#4A1D6E]/15 bg-white p-6">
        <h2 className="text-sm font-semibold text-[#1C1028]">Oś czasu</h2>
        {events.length === 0 ? (
          <div className="mt-4">
            <p className="text-sm text-[#4A3360]">Brak zaplanowanych wydarzeń.</p>
            <button
              type="button"
              onClick={() => onNavigateTab("harmonogram")}
              className="mt-3 bg-[#4A1D6E] px-4 py-2 text-sm font-medium text-white hover:bg-[#4A2073]"
            >
              Dodaj pierwsze wydarzenie
            </button>
          </div>
        ) : (
          <>
            <div className="mt-4">
              <EventTimeline events={highlightEvents} />
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("harmonogram")}
              className="mt-3 text-sm text-[#4A1D6E] hover:underline"
            >
              Zobacz cały harmonogram →
            </button>
          </>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-6">
          <section className="border border-[#4A1D6E]/15 bg-white p-6">
            <h2 className="text-sm font-semibold text-[#1C1028]">Informacje podstawowe</h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-[#4A3360]">Język</dt>
                <dd className="text-sm text-[#1C1028]">{article.language || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#4A3360]">Czasopismo</dt>
                <dd className="text-sm text-[#1C1028]">{article.target_journal || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#4A3360]">Dyscyplina</dt>
                <dd className="text-sm text-[#1C1028]">{article.discipline || "—"}</dd>
              </div>
            </dl>

            {article.keywords.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {article.keywords.map((kw) => (
                  <span key={kw} className="bg-[#EDE6F8] px-2 py-0.5 text-xs text-[#4A1D6E]">
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {article.abstract && (
              <div className="mt-4">
                <dt className="text-xs text-[#4A3360]">Abstrakt</dt>
                <p className="mt-1 text-sm leading-relaxed text-[#1C1028]">{article.abstract}</p>
              </div>
            )}
          </section>

          <section className="border border-[#4A1D6E]/15 bg-white p-6">
            <h2 className="text-sm font-semibold text-[#1C1028]">Najnowsza wersja</h2>
            {latestVersion ? (
              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm text-[#1C1028]">{latestVersion.file_name}</p>
                  <p className="mt-0.5 text-xs text-[#4A3360]">
                    {formatBytes(latestVersion.file_size_bytes)} · {formatDateTime(latestVersion.uploaded_at)}
                  </p>
                </div>
                {latestVersion.signedUrl && (
                  <a
                    href={latestVersion.signedUrl}
                    className="shrink-0 bg-[#4A1D6E] px-4 py-2 text-sm font-medium text-white hover:bg-[#4A2073]"
                  >
                    Pobierz
                  </a>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-[#4A3360]">Nie wgrano jeszcze żadnej wersji pliku.</p>
                <button
                  type="button"
                  onClick={() => onNavigateTab("wersje")}
                  className="mt-3 bg-[#4A1D6E] px-4 py-2 text-sm font-medium text-white hover:bg-[#4A2073]"
                >
                  Wgraj pierwszą wersję
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="bg-[#EDE6F8] p-6">
            <h2 className="text-sm font-semibold text-[#1C1028]">Aktualny etap</h2>
            <div className="mt-3">
              <StatusTag status={article.status} />
            </div>
            <div className="mt-4">
              <div className="h-1.5 w-full bg-white/60">
                <div
                  className="h-1.5 bg-[#4A1D6E]"
                  style={{ width: `${article.progress_percent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-[#4A3360]">{article.progress_percent}%</p>
            </div>
            {article.next_step && (
              <div className="mt-4">
                <p className="text-xs text-[#4A3360]">Następny krok</p>
                <p className="mt-0.5 text-sm text-[#1C1028]">{article.next_step}</p>
              </div>
            )}
          </section>

          <section className="border border-[#4A1D6E]/15 bg-white p-6">
            <h2 className="text-sm font-semibold text-[#1C1028]">Metryki</h2>
            <dl className="mt-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-[#4A3360]">Wersje pliku</dt>
                <dd className="text-sm font-medium text-[#1C1028]">{versionsCount}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-[#4A3360]">Źródła</dt>
                <dd className="text-sm font-medium text-[#1C1028]">{sourcesCount}</dd>
              </div>
            </dl>
          </section>

          <section className="border border-[#4A1D6E]/15 bg-white p-6">
            <h2 className="text-sm font-semibold text-[#1C1028]">Szybkie akcje</h2>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab("wersje")}
                className="border border-[#4A1D6E]/25 px-4 py-2 text-left text-sm text-[#4A1D6E] hover:border-[#4A1D6E]/50"
              >
                Dodaj wersję
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab("zrodla")}
                className="border border-[#4A1D6E]/25 px-4 py-2 text-left text-sm text-[#4A1D6E] hover:border-[#4A1D6E]/50"
              >
                Dodaj źródło
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
