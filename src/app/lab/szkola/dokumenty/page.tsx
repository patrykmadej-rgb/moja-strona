import type { Metadata } from "next";
import { Files } from "lucide-react";
import SzkolaComingSoon from "@/components/szkola/SzkolaComingSoon";

export const metadata: Metadata = { title: "Dokumenty" };

export default function DokumentySzkolaPage() {
  return (
    <SzkolaComingSoon
      title="Dokumenty"
      description="Bilety, rezerwacje, faktury i zaświadczenia ze wszystkich zjazdów."
      icon={Files}
      subtitle="Widok dokumentów jest w przygotowaniu"
    />
  );
}
