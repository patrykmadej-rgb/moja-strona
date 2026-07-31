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
  FlaskConical,
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

  const baseClass =
    "group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] transition-[background-color,color,box-shadow] duration-150";
  const stateClass = isActive
    ? "text-white"
    : item.enabled
      ? "text-white/[0.72] hover:bg-white/[0.06] hover:text-white/[0.95]"
      : "cursor-not-allowed text-white/25";

  const style = isActive
    ? {
        background: "linear-gradient(180deg, rgba(111,68,156,0.52) 0%, rgba(84,46,122,0.44) 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 10px 20px rgba(0,0,0,0.16)",
      }
    : undefined;

  const inner = (
    <span className={`${baseClass} ${stateClass}`} style={style}>
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute -left-2 top-[10px] bottom-[10px] w-[2px] rounded-full opacity-90"
          style={{ background: "linear-gradient(180deg, #e1c58a 0%, #cfa45d 100%)" }}
        />
      )}
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
      <span
        role="tooltip"
        aria-hidden="true"
        className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-[6px] bg-[#160b21] px-2 py-1 text-xs text-white opacity-0 shadow-[0_4px_14px_rgba(0,0,0,0.25)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
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
      className="lab-sidebar relative flex h-full w-[72px] shrink-0 flex-col overflow-hidden border-r border-white/5"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(86,53,118,0.18) 0%, rgba(86,53,118,0) 24%), linear-gradient(180deg, #23112f 0%, #180d24 52%, #12091b 100%)",
      }}
    >
      <div className="relative z-[2] flex h-full flex-col items-center pt-5">
        <Link
          href="/lab"
          aria-label="Przejdź do pulpitu /lab"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.04] text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:border-white/20 hover:text-white"
        >
          <FlaskConical className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </Link>

        <div className="mt-6 flex flex-col items-center gap-1.5">
          {PRIMARY_ITEMS.map((item) => (
            <NavButton key={item.key} item={item} isActive={isItemActive(item.href)} />
          ))}
        </div>

        <div className="my-3 h-px w-8 shrink-0 bg-white/[0.08]" />

        <div className="flex flex-col items-center gap-1.5">
          {SECONDARY_ITEMS.map((item) => (
            <NavButton key={item.key} item={item} isActive={isItemActive(item.href)} />
          ))}
        </div>

        <div className="mt-auto flex flex-col items-center gap-2.5 pt-3.5 pb-4">
          <div className="mb-1.5 h-px w-8 bg-white/[0.08]" />
          <span
            title={email ?? undefined}
            aria-label={email ? `Zalogowano jako ${email}` : "Zalogowano"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xs font-semibold text-white/80"
          >
            {initial}
          </span>
          <form action={signOutLab}>
            <button
              type="submit"
              aria-label="Wyloguj"
              className="flex h-9 w-9 items-center justify-center rounded-[10px] text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>

      <div className="lab-sidebar-decoration" aria-hidden="true" />
    </aside>
  );
}
