import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/lib/site-config";
import { publications } from "@/lib/publications";
import PublicationsExplorer from "@/components/PublicationsExplorer";

export const metadata: Metadata = {
  title: `Publikacje — ${siteConfig.name}`,
  description: "Artykuły naukowe, rozdziały w monografiach i teksty popularnonaukowe.",
};

export default async function PublikacjePage() {
  const tStatus = await getTranslations("PublicationStatus");

  return (
    <PublicationsExplorer
      publications={publications}
      inPreparationLabel={tStatus("inPreparation")}
      inProgressLabel={tStatus("inProgress")}
    />
  );
}
