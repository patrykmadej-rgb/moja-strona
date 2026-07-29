import { getTranslations } from "next-intl/server";

export default async function PublicationStatusBadge({ className }: { className?: string }) {
  const t = await getTranslations("PublicationStatus");

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-[#4A1D6E]/25 bg-[#EDE6F8] px-2.5 py-0.5 text-[11px] font-medium text-[#4A1D6E] dark:border-purple-400/30 dark:bg-purple-900/20 dark:text-purple-300 ${className ?? ""}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#4A1D6E] dark:bg-purple-400" />
      {t("inProgress")}
    </span>
  );
}
