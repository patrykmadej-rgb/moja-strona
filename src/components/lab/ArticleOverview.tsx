import ArticleBasicInfoCard from "@/components/lab/ArticleBasicInfoCard";
import ArticleVersionsCard from "@/components/lab/ArticleVersionsCard";
import type { Article, ArticleVersion } from "@/lib/lab/types";
import type { TabKey } from "@/components/lab/ArticleTabs";

export default function ArticleOverview({
  article,
  versions,
  onNavigateTab,
}: {
  article: Article;
  versions: (ArticleVersion & { signedUrl: string | null })[];
  onNavigateTab: (tab: TabKey) => void;
}) {
  return (
    <div className="grid grid-cols-1 items-start gap-5 min-[1000px]:grid-cols-[minmax(0,1fr)_320px]">
      <ArticleBasicInfoCard article={article} />
      <ArticleVersionsCard
        articleId={article.id}
        versions={versions}
        onNavigateTab={() => onNavigateTab("wersje")}
      />
    </div>
  );
}
