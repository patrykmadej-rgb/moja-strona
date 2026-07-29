import { getTranslations } from "next-intl/server";

export default async function PublicationStatusBadge({ className }: { className?: string }) {
  const t = await getTranslations("PublicationStatus");

  return (
    <span
      className={`inline-block rounded-full border border-amber-300 bg-amber-100 px-3 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-300 ${className ?? ""}`}
    >
      {t("inProgress")}
    </span>
  );
}
