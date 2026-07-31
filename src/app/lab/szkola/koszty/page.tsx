import type { Metadata } from "next";
import { WalletCards } from "lucide-react";
import SzkolaComingSoon from "@/components/szkola/SzkolaComingSoon";

export const metadata: Metadata = { title: "Koszty" };

export default function KosztySzkolaPage() {
  return (
    <SzkolaComingSoon
      title="Koszty"
      description="Zbiorcze zestawienie płatności za szkołę i wydatków podróżnych."
      icon={WalletCards}
      subtitle="Widok kosztów jest w przygotowaniu"
    />
  );
}
