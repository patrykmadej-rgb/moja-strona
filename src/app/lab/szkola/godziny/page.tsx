import type { Metadata } from "next";
import { Clock4 } from "lucide-react";
import SzkolaComingSoon from "@/components/szkola/SzkolaComingSoon";

export const metadata: Metadata = { title: "Godziny szkoleniowe" };

export default function GodzinySzkolaPage() {
  return (
    <SzkolaComingSoon
      title="Godziny szkoleniowe"
      description="Rejestr godzin: teoria, doświadczenie własne, superwizja, praktyka."
      icon={Clock4}
      subtitle="Rejestr godzin jest w przygotowaniu"
    />
  );
}
