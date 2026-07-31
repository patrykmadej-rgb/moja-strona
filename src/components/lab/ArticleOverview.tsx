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
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ArticleBasicInfoCard article={article} />
        <div className="flex flex-col gap-5">
          <ArticleProgressCard article={article} />
          <ArticleMetricsCard versionsCount={versionsCount} sourcesCount={sourcesCount} />
        </div>
      </div>

      <ArticleTimelineCard events={events} onNavigateTab={() => onNavigateTab("harmonogram")} />

      <LatestVersionCard
        articleId={article.id}
        latestVersion={latestVersion}
        onNavigateTab={() => onNavigateTab("wersje")}
      />
    </div>
  );
}
