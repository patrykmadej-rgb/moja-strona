import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Projekty — ${siteConfig.name}`,
  description: "Autorskie koncepcje, modele i projekty analityczne.",
};

export default function ProjektyPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <p className="mb-4 text-xs font-semibold tracking-[0.25em] uppercase text-[#5C2D91] dark:text-purple-400">
        Projekty i modele
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-[#1C1028] dark:text-white">
        Autorskie koncepcje
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#4A3360] dark:text-neutral-300">
        Modele analityczne i koncepcje dotyczące ofiar, sprawców i systemu —
        na pograniczu kryminologii, psychologii i prawa.
      </p>
      <div className="mt-16 rounded-2xl border border-[#5C2D91]/15 bg-white p-12 text-center dark:bg-neutral-900 dark:border-white/10">
        <p className="text-sm text-[#4A3360] dark:text-neutral-400">
          Ta sekcja zostanie uzupełniona wkrótce.
        </p>
      </div>
    </div>
  );
}
