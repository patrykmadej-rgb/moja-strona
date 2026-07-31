import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";

export default function ArticlesPageHeader() {
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-cormorant)] text-[32px] font-semibold leading-[1.1] text-[#201a2b]">
          Artykuły naukowe
        </h1>
        <p className="mt-1.5 text-[13px] text-[#706878]">
          Zarządzaj swoimi artykułami i śledź postępy prac.
        </p>
      </div>
      <Link
        href="/lab/artykuly/nowy"
        className="flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#32134f]"
      >
        <IconPlus className="h-4 w-4" stroke={2} />
        Dodaj artykuł
      </Link>
    </div>
  );
}
