import { ARTICLE_STATUS_LABELS, type ArticleStatus } from "@/lib/lab/types";

export default function StatusTag({ status }: { status: ArticleStatus }) {
  const isWriting = status === "pisanie";

  return (
    <span
      className={
        isWriting
          ? "inline-flex items-center border border-[#4A3360]/30 px-2 py-0.5 text-xs text-[#4A3360]"
          : "inline-flex items-center bg-[#EDE6F8] px-2 py-0.5 text-xs text-[#4A1D6E]"
      }
    >
      {ARTICLE_STATUS_LABELS[status]}
    </span>
  );
}
