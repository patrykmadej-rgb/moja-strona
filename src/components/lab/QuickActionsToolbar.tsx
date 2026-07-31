"use client";

import { IconBook2, IconNotes, IconSquareCheck, IconUpload } from "@tabler/icons-react";
import type { TabKey } from "@/components/lab/ArticleTabs";

type QuickAction = {
  key: string;
  label: string;
  icon: typeof IconUpload;
  tab: TabKey;
};

const ACTIONS: QuickAction[] = [
  { key: "version", label: "Wersja", icon: IconUpload, tab: "wersje" },
  { key: "source", label: "Źródło", icon: IconBook2, tab: "zrodla" },
  { key: "task", label: "Zadanie", icon: IconSquareCheck, tab: "zadania" },
  { key: "note", label: "Notatka", icon: IconNotes, tab: "notatki" },
];

export default function QuickActionsToolbar({
  onNavigateTab,
}: {
  onNavigateTab: (tab: TabKey) => void;
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-x-2 gap-y-1.5 min-[800px]:w-[240px] min-[1100px]:w-[270px]">
      {ACTIONS.map(({ key, label, icon: Icon, tab }) => (
        <button
          key={key}
          type="button"
          onClick={() => onNavigateTab(tab)}
          aria-label={`Dodaj: ${label}`}
          className="inline-flex min-h-[34px] items-center justify-start gap-[7px] whitespace-nowrap rounded-[9px] border border-[#e7dfeb] bg-white/[0.48] px-2.5 py-[7px] text-[13px] font-medium text-[#62596b] transition-colors duration-150 hover:border-[#ddd0e8] hover:bg-[#f1eafd] hover:text-[#4c1f72] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(91,42,134,0.25)]"
        >
          <Icon className="h-4 w-4 shrink-0" stroke={1.75} />
          {label}
        </button>
      ))}
    </div>
  );
}
