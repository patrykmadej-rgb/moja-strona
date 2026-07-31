"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  PanelsTopLeft,
  SquareCheckBig,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { signOutLab } from "@/app/lab/actions";

type NavItem = {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
};

const PRIMARY_ITEMS: NavItem[] = [
  { key: "pulpit", href: "/lab", label: "Pulpit", icon: LayoutDashboard, enabled: false },
  { key: "artykuly", href: "/lab/artykuly", label: "Artykuły", icon: FileText, enabled: true },
  { key: "szkola", href: "/lab/szkola", label: "Szkoła psychoterapii", icon: GraduationCap, enabled: true },
];

const SECONDARY_ITEMS: NavItem[] = [
  { key: "projekty", href: "/lab/projekty", label: "Projekty", icon: PanelsTopLeft, enabled: false },
  { key: "zadania", href: "/lab/zadania", label: "Zadania", icon: SquareCheckBig, enabled: false },
  {
    key: "statystyki",
    href: "/lab/statystyki",
    label: "Statystyki",
    icon: ChartNoAxesCombined,
    enabled: false,
  },
  { key: "ustawienia", href: "/lab/ustawienia", label: "Ustawienia", icon: Settings, enabled: false },
];

function NavButton({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;

  const baseClass = "flex h-11 w-11 shrink-0 items-center justify-center transition-colors";
  const stateClass = isActive
    ? "text-white"
    : item.enabled
      ? "text-white/60 hover:text-white"
      : "cursor-not-allowed text-white/25";

  const style = isActive
    ? {
        background: "rgba(121, 68, 167, 0.34)",
        boxShadow: "inset 2px 0 0 #d8b77b, 0 4px 14px rgba(0,0,0,0.12)",
      }
    : undefined;

  const inner = (
    <span className={`${baseClass} ${stateClass} group relative`} style={style}>
      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      <span
        role="tooltip"
        aria-hidden="true"
        className="pointer-events-none absolute left-full ml-2 whitespace-nowrap bg-[#160b21] px-2 py-1 text-xs text-white opacity-0 shadow-[0_4px_14px_rgba(0,0,0,0.25)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {item.label}
        {!item.enabled && " — wkrótce"}
      </span>
    </span>
  );

  if (!item.enabled) {
    return (
      <span aria-label={`${item.label} — wkrótce`} aria-disabled="true">
        {inner}
      </span>
    );
  }

  return (
    <Link href={item.href} aria-label={item.label} aria-current={isActive ? "page" : undefined}>
      {inner}
    </Link>
  );
}

export default function Sidebar({ email }: { email?: string | null }) {
  const pathname = usePathname();

  const isItemActive = (href: string) =>
    href === "/lab" ? pathname === "/lab" : pathname.startsWith(href);

  const initial = email?.trim().charAt(0).toUpperCase() || "?";

  return (
    <aside
      className="relative flex h-full w-[72px] shrink-0 flex-col overflow-hidden border-r border-white/5"
      style={{ background: "linear-gradient(180deg, #21102f 0%, #160b21 100%)" }}
    >
      <div className="relative z-[2] flex h-full flex-col items-center gap-1 py-6">
        <div className="flex flex-col items-center gap-1">
          {PRIMARY_ITEMS.map((item) => (
            <NavButton key={item.key} item={item} isActive={isItemActive(item.href)} />
          ))}
        </div>

        <div className="my-2 h-px w-8 shrink-0 bg-white/10" />

        <div className="flex flex-col items-center gap-1">
          {SECONDARY_ITEMS.map((item) => (
            <NavButton key={item.key} item={item} isActive={isItemActive(item.href)} />
          ))}
        </div>

        <div className="mt-auto flex flex-col items-center gap-2 pt-2">
          <span
            title={email ?? undefined}
            aria-label={email ? `Zalogowano jako ${email}` : "Zalogowano"}
            className="flex h-8 w-8 items-center justify-center bg-white/10 text-xs font-semibold text-white/80"
          >
            {initial}
          </span>
          <form action={signOutLab}>
            <button
              type="submit"
              aria-label="Wyloguj"
              className="flex h-11 w-11 items-center justify-center text-white/50 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
            >
              <LogOut className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>

      <div className="lab-sidebar-decoration" aria-hidden="true" />
    </aside>
  );
}
