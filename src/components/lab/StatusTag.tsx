import { ARTICLE_STATUS_LABELS, type ArticleStatus } from "@/lib/lab/types";

export const STATUS_COLORS: Record<ArticleStatus, { bg: string; text: string }> = {
  pomysl: { bg: "#f1eafd", text: "#5b2a86" },
  pisanie: { bg: "#eaf0ff", text: "#3564bd" },
  do_wyslania: { bg: "#fff2d9", text: "#a76616" },
  w_redakcji: { bg: "#fff2d9", text: "#a76616" },
  recenzja: { bg: "#fff2d9", text: "#a76616" },
  poprawki: { bg: "#fff2d9", text: "#a76616" },
  przyjety: { bg: "#fff2d9", text: "#a76616" },
  opublikowany: { bg: "#e5f6eb", text: "#2f7a4c" },
};

export default function StatusTag({ status }: { status: ArticleStatus }) {
  const { bg, text } = STATUS_COLORS[status];

  return (
    <span
      className="inline-flex h-6 items-center rounded-full px-[9px] text-[10px] font-semibold"
      style={{ background: bg, color: text }}
    >
      {ARTICLE_STATUS_LABELS[status]}
    </span>
  );
}
