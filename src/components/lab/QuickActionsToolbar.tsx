"use client";

import { useEffect, useRef, useState } from "react";
import { IconBook2, IconChevronDown, IconNotes, IconSquareCheck, IconUpload } from "@tabler/icons-react";
import type { TabKey } from "@/components/lab/ArticleTabs";

type QuickAction = {
  key: string;
  label: string;
  menuLabel: string;
  icon: typeof IconUpload;
  tab: TabKey;
};

const ACTIONS: QuickAction[] = [
  { key: "version", label: "Wersja", menuLabel: "Nowa wersja", icon: IconUpload, tab: "wersje" },
  { key: "source", label: "Źródło", menuLabel: "Nowe źródło", icon: IconBook2, tab: "zrodla" },
  { key: "task", label: "Zadanie", menuLabel: "Nowe zadanie", icon: IconSquareCheck, tab: "zadania" },
  { key: "note", label: "Notatka", menuLabel: "Nowa notatka", icon: IconNotes, tab: "notatki" },
];

const quickActionButtonClass =
  "inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-[9px] border border-transparent bg-transparent px-2.5 text-[13px] font-medium text-[#62596b] transition-colors duration-150 hover:border-[#e3d8ec] hover:bg-[#f1eafd] hover:text-[#4c1f72] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(91,42,134,0.25)]";

export default function QuickActionsToolbar({
  onNavigateTab,
}: {
  onNavigateTab: (tab: TabKey) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="flex items-center justify-end gap-1.5 flex-wrap">
      <div className="hidden min-[1200px]:flex items-center justify-end gap-1.5 flex-wrap">
        {ACTIONS.map(({ key, label, icon: Icon, tab }) => (
          <button
            key={key}
            type="button"
            onClick={() => onNavigateTab(tab)}
            aria-label={`Dodaj: ${label}`}
            className={quickActionButtonClass}
          >
            <Icon className="h-4 w-4 shrink-0" stroke={1.75} />
            {label}
          </button>
        ))}
      </div>

      <div ref={menuRef} className="relative min-[1200px]:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className={quickActionButtonClass}
        >
          Dodaj
          <IconChevronDown className="h-3.5 w-3.5 shrink-0" stroke={1.75} />
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 z-10 mt-1 w-44 rounded-[10px] border border-[#e6deec] bg-white py-1 shadow-[0_8px_24px_rgba(49,30,64,0.12)]"
          >
            {ACTIONS.map(({ key, menuLabel, icon: Icon, tab }) => (
              <button
                key={key}
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onNavigateTab(tab);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-[#201a2b] hover:bg-[#f1eafd] hover:text-[#4c1f72]"
              >
                <Icon className="h-4 w-4 shrink-0" stroke={1.75} />
                {menuLabel}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
