import type { Metadata } from "next";
import { Plane } from "lucide-react";
import SzkolaComingSoon from "@/components/szkola/SzkolaComingSoon";

export const metadata: Metadata = { title: "Podróże" };

export default function PodrozeSzkolaPage() {
  return (
    <SzkolaComingSoon
      title="Podróże"
      description="Zbiorczy widok podróży ze wszystkich zjazdów."
      icon={Plane}
      subtitle="Widok podróży jest w przygotowaniu"
    />
  );
}
