import { ARTICLE_STATUS_LABELS, type ArticleStatus } from "@/lib/lab/types";

export const STATUS_COLORS: Record<ArticleStatus, { bg: string; text: string }> = {
  idea: { bg: "#f1eafd", text: "#5b2a86" },
  first_version: { bg: "#eef2fd", text: "#4551b5" },
  revisions: { bg: "#fff2d9", text: "#a76616" },
  final_version: { bg: "#f3ecfa", text: "#4c1f72" },
  ready_to_submit: { bg: "#e6f2fd", text: "#2f6fb0" },
  submitted: { bg: "#fdf3d9", text: "#8a5a10" },
  post_review_revisions: { bg: "#f7e9f2", text: "#7a2f5c" },
  in_publication: { bg: "#eef6e9", text: "#3d6b2f" },
  published: { bg: "#e5f6eb", text: "#2f7a4c" },
};

// Wartość może chwilowo nie pasować do obecnego słownika — np. między
// wdrożeniem tego kodu a ręcznym uruchomieniem migracji 014 w Supabase
// artykuły nadal mają stare wartości statusu w bazie. Fallback zamiast
// wyjątku, żeby strona nigdy się przez to nie wysypała.
const FALLBACK_COLORS = { bg: "#f1eef2", text: "#5c5460" };

export default function StatusTag({ status }: { status: ArticleStatus }) {
  const { bg, text } = STATUS_COLORS[status] ?? FALLBACK_COLORS;
  const label = ARTICLE_STATUS_LABELS[status] ?? status;

  return (
    <span
      className="inline-flex w-fit max-w-[175px] min-h-[28px] items-center gap-[7px] whitespace-normal rounded-[8px] px-[9px] py-[6px] text-left text-[11px] font-medium leading-[1.25]"
      style={{ background: bg, color: text }}
    >
      <span className="h-[6px] w-[6px] shrink-0 rounded-full" style={{ background: text }} />
      {label}
    </span>
  );
}
