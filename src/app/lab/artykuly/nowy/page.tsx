import type { Metadata } from "next";
import Link from "next/link";
import NewArticleForm from "@/components/lab/NewArticleForm";

export const metadata: Metadata = {
  title: "Nowy artykuł",
};

export default function NowyArtykulPage() {
  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <Link href="/lab/artykuly" className="text-sm text-[#4A3360] hover:text-[#4A1D6E]">
        ← Powrót do listy
      </Link>

      <h1
        className="mt-4 font-[family-name:var(--font-cormorant)] text-[22px] font-semibold text-[#1C1028]"
      >
        Dodaj artykuł
      </h1>

      <NewArticleForm />
    </div>
  );
}
