"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GraduationCap, Library, Clipboard, MoreHorizontal, type LucideIcon } from "lucide-react";
import { isLabNavItemActive } from "@/components/lab/Sidebar";
import LabMoreSheet from "@/components/lab/LabMoreSheet";

type MobileNavItem = { key: string; href: string; label: string; icon: LucideIcon };

/**
 * Cztery najważniejsze moduły bezpośrednio w pasku (sekcja 2 briefu), reszta
 * (Artykuły, Strona główna, pozycje "wkrótce", Wyloguj) pod "Więcej" —
 * LabMoreSheet.tsx. Etykieta "Start" (nie "Pulpit" jak w desktopowym
 * Sidebar.tsx) — krótsza, bardziej naturalna na małym przycisku dotykowym;
 * href ten sam co pozycja "pulpit" w PRIMARY_ITEMS.
 */
const MOBILE_MAIN_ITEMS: MobileNavItem[] = [
  { key: "pulpit", href: "/lab", label: "Start", icon: LayoutDashboard },
  { key: "szkola", href: "/lab/szkola", label: "Szkoła", icon: GraduationCap },
  { key: "biblioteka", href: "/lab/biblioteka", label: "Biblioteka", icon: Library },
  { key: "schowek", href: "/lab/schowek", label: "Schowek", icon: Clipboard },
];

/** Widoczny tylko na mobile (.lab-bottom-nav ukryty od 768px w globals.css) — desktop zachowuje wyłącznie Sidebar.tsx. */
export default function LabBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const activeMainKey = MOBILE_MAIN_ITEMS.find((item) => isLabNavItemActive(pathname, item.href))?.key ?? null;
  const isMoreActive = activeMainKey === null;

  return (
    <>
      <nav className="lab-bottom-nav" aria-label="Nawigacja panelu">
        {MOBILE_MAIN_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.key === activeMainKey;
          return (
            <Link key={item.key} href={item.href} className="lab-bottom-nav-item" data-active={active} aria-current={active ? "page" : undefined}>
              <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.75} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="lab-bottom-nav-item"
          data-active={isMoreActive}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
        >
          <MoreHorizontal className="h-5 w-5" strokeWidth={isMoreActive ? 2 : 1.75} aria-hidden="true" />
          <span>Więcej</span>
        </button>
      </nav>
      {moreOpen && <LabMoreSheet onClose={() => setMoreOpen(false)} />}
    </>
  );
}
