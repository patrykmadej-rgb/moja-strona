import type { LucideIcon } from "lucide-react";
import SzkolaNav from "@/components/szkola/SzkolaNav";

export default function SzkolaComingSoon({
  title,
  description,
  icon: Icon,
  subtitle,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  subtitle: string;
}) {
  return (
    <div className="lab-szkola-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-[32px] font-semibold leading-[1.1] text-[#201a2b]">
            {title}
          </h1>
          <p className="mt-1.5 text-[13px] text-[#706878]">{description}</p>
        </div>

        <div className="mt-6">
          <SzkolaNav />
        </div>

        <div className="mt-6 flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-[16px] border border-[#e8e2ec] bg-white p-6 text-center shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#f1eafd] text-[#5b2a86]">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <p className="mt-1 text-sm font-medium text-[#201a2b]">{subtitle}</p>
          <p className="max-w-sm text-xs text-[#9a919f]">
            Ta sekcja modułu Szkoły psychoterapii jest w przygotowaniu i pojawi się w kolejnym etapie.
          </p>
        </div>
      </div>
    </div>
  );
}
