"use client";

import { useEffect, useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { signOutLab } from "@/app/lab/actions";
import { HOME_ITEM, PRIMARY_ITEMS, SECONDARY_ITEMS, isLabNavItemActive } from "@/components/lab/Sidebar";

/** Klucze już obecne bezpośrednio w LabBottomNav — reszta PRIMARY_ITEMS (dziś tylko "artykuly") trafia tutaj. */
const MOBILE_MAIN_KEYS = new Set(["pulpit", "szkola", "biblioteka", "schowek"]);

/**
 * Dolny arkusz "Więcej" — reużywa te same dane nawigacji co desktopowy
 * Sidebar.tsx (HOME_ITEM/PRIMARY_ITEMS/SECONDARY_ITEMS), żeby dodanie nowej
 * pozycji w jednym miejscu automatycznie pojawiło się też na mobile.
 */
export default function LabMoreSheet({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const headingId = useId();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const restOfPrimary = PRIMARY_ITEMS.filter((item) => !MOBILE_MAIN_KEYS.has(item.key));
  const HomeIcon = HOME_ITEM.icon;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      onClick={onClose}
    >
      <div className="lab-more-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="lab-more-sheet-handle" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <h2 id={headingId} className="font-[family-name:var(--font-cormorant)] text-[19px] font-semibold text-[#201a2b]">
            Więcej
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="flex h-8 w-8 items-center justify-center rounded-[9px] text-[#9a919f] transition-colors hover:bg-[#f7f4ef] hover:text-[#5b2a86]"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-1">
          {restOfPrimary.map((item) => {
            const Icon = item.icon;
            const active = isLabNavItemActive(pathname, item.href);
            return (
              <Link key={item.key} href={item.href} onClick={onClose} className="lab-more-sheet-item" data-active={active}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          <Link href={HOME_ITEM.href} onClick={onClose} className="lab-more-sheet-item">
            <HomeIcon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
            {HOME_ITEM.label}
          </Link>
        </div>

        <div className="my-3 h-px bg-[#eee9f2]" />

        <div className="flex flex-col gap-1">
          {SECONDARY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <span key={item.key} className="lab-more-sheet-item" data-disabled="true">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
                {item.label} — wkrótce
              </span>
            );
          })}
        </div>

        <div className="my-3 h-px bg-[#eee9f2]" />

        <form action={signOutLab}>
          <button type="submit" className="lab-more-sheet-item w-full text-left text-red-600">
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
            Wyloguj
          </button>
        </form>
      </div>
    </div>
  );
}
