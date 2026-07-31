import ArticleBasicInfoCard from "@/components/lab/ArticleBasicInfoCard";
import ArticleProgressCard from "@/components/lab/ArticleProgressCard";
import ArticleMetricsCard from "@/components/lab/ArticleMetricsCard";
import ArticleTimelineCard from "@/components/lab/ArticleTimelineCard";
import LatestVersionCard from "@/components/lab/LatestVersionCard";
import type { Article, ArticleEvent, ArticleVersion } from "@/lib/lab/types";
import type { TabKey } from "@/components/lab/ArticleTabs";

export default function ArticleOverview({
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
  onNavigateTab: (tab: TabKey) => void;
}) {
  return (
    <div>
      {/* Poniżej 1000px: jedna kolumna, kolejność Informacje -> Status -> Metryki -> Wersja -> Oś czasu. */}
      <div className="flex flex-col gap-5 min-[1000px]:hidden">
        <ArticleBasicInfoCard article={article} />
        <ArticleProgressCard article={article} />
        <ArticleMetricsCard versionsCount={versionsCount} sourcesCount={sourcesCount} />
        <LatestVersionCard
          articleId={article.id}
          latestVersion={latestVersion}
          onNavigateTab={() => onNavigateTab("wersje")}
        />
        <ArticleTimelineCard events={events} onNavigateTab={() => onNavigateTab("harmonogram")} />
      </div>

      {/* Od 1000px: dwie niezależne pionowe kolumny — prawa nie wpływa na wysokość lewej. */}
      <div className="hidden min-[1000px]:grid min-[1000px]:grid-cols-[minmax(0,1fr)_320px] min-[1000px]:items-start min-[1000px]:gap-5">
        <div className="flex min-w-0 flex-col gap-5">
          <ArticleBasicInfoCard article={article} />
          <LatestVersionCard
            articleId={article.id}
            latestVersion={latestVersion}
            onNavigateTab={() => onNavigateTab("wersje")}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <ArticleProgressCard article={article} />
          <ArticleMetricsCard versionsCount={versionsCount} sourcesCount={sourcesCount} />
          <ArticleTimelineCard events={events} onNavigateTab={() => onNavigateTab("harmonogram")} />
        </div>
      </div>
    </div>
  );
}
