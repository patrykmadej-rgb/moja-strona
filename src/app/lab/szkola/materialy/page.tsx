import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import SzkolaComingSoon from "@/components/szkola/SzkolaComingSoon";

export const metadata: Metadata = { title: "Materiały" };

export default function MaterialySzkolaPage() {
  return (
    <SzkolaComingSoon
      title="Materiały"
      description="Prezentacje, zdjęcia tablicy i literatura ze wszystkich zjazdów."
      icon={FolderOpen}
      subtitle="Widok materiałów jest w przygotowaniu"
    />
  );
}
