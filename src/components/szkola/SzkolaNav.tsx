"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  CalendarDays,
  Plane,
  WalletCards,
  FolderOpen,
  Files,
  Clock4,
  Inbox,
  Bell,
  type LucideIcon,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon; enabled: boolean };

const ITEMS: NavItem[] = [
  { href: "/lab/szkola", label: "Pulpit", icon: LayoutDashboard, enabled: true },
  { href: "/lab/szkola/zjazdy", label: "Zjazdy", icon: CalendarRange, enabled: true },
  { href: "/lab/szkola/kalendarz", label: "Kalendarz", icon: CalendarDays, enabled: true },
  { href: "/lab/szkola/podroze", label: "Podróże", icon: Plane, enabled: true },
  { href: "/lab/szkola/koszty", label: "Koszty", icon: WalletCards, enabled: true },
  { href: "/lab/szkola/materialy", label: "Materiały", icon: FolderOpen, enabled: true },
  { href: "/lab/szkola/dokumenty", label: "Dokumenty", icon: Files, enabled: true },
  { href: "/lab/szkola/godziny", label: "Godziny", icon: Clock4, enabled: true },
  { href: "/lab/szkola/import", label: "Import", icon: Inbox, enabled: true },
  { href: "/lab/szkola/alerty", label: "Alerty", icon: Bell, enabled: true },
];

export default function SzkolaNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-[30px] overflow-x-auto border-b border-[#e8e2ec]">
      {ITEMS.map((item) => {
        const isActive =
          item.href === "/lab/szkola" ? pathname === "/lab/szkola" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "flex h-[52px] shrink-0 items-center gap-1.5 border-b-2 border-[#5b2a86] px-1 text-sm font-medium text-[#5b2a86]"
                : "flex h-[52px] shrink-0 items-center gap-1.5 px-1 text-sm text-[#706878] transition-colors hover:text-[#5b2a86]"
            }
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
