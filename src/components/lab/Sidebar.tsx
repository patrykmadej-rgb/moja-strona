"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  { key: "pulpit", href: "/lab", label: "Pulpit", icon: LayoutDashboard, enabled: true },
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

/**
 * Tooltip renderowany przez portal do document.body — .lab-sidebar ma
 * overflow: hidden (wymagane dla maski grafiki konstelacji), więc tooltip
 * jako zwykłe dziecko nav-itemu byłby przez to ucinany. Pozycja liczona
 * z getBoundingClientRect() aktywnego triggera, position: fixed w CSS.
 */
function useSidebarTooltip<T extends HTMLElement>(label: string) {
  const ref = useRef<T>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const computePosition = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return null;
    return { top: rect.top + rect.height / 2, left: rect.right + 10 };
  };

  const showOnHover = () => {
    // Na dotyku nie pokazujemy tooltipa na "tap" — tylko realny hover myszą.
    if (typeof window !== "undefined" && window.matchMedia && !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    setPos(computePosition());
  };
  const showOnFocus = () => setPos(computePosition());
  const hide = () => setPos(null);

  const portal =
    pos && typeof document !== "undefined"
      ? createPortal(
          <div className="lab-sidebar-tooltip" role="tooltip" style={{ top: pos.top, left: pos.left }}>
            {label}
          </div>,
          document.body,
        )
      : null;

  return { ref, onMouseEnter: showOnHover, onMouseLeave: hide, onFocus: showOnFocus, onBlur: hide, portal };
}

function NavButton({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;
  const label = `${item.label}${!item.enabled ? " — wkrótce" : ""}`;
  const { ref, onMouseEnter, onMouseLeave, onFocus, onBlur, portal } = useSidebarTooltip<HTMLAnchorElement | HTMLSpanElement>(label);

  const icon = (
    <span className={`lab-nav-item${isActive ? " active" : ""}`} data-enabled={item.enabled}>
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
    </span>
  );

  if (!item.enabled) {
    return (
      <>
        <span
          ref={ref as React.RefObject<HTMLSpanElement>}
          aria-label={label}
          aria-disabled="true"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {icon}
        </span>
        {portal}
      </>
    );
  }

  return (
    <>
      <Link
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={item.href}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        {icon}
      </Link>
      {portal}
    </>
  );
}

function LogoutButton() {
  const { ref, onMouseEnter, onMouseLeave, onFocus, onBlur, portal } = useSidebarTooltip<HTMLButtonElement>("Wyloguj");

  return (
    <form action={signOutLab}>
      <button
        ref={ref}
        type="submit"
        aria-label="Wyloguj"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
        onBlur={onBlur}
        className="flex h-9 w-9 items-center justify-center rounded-[10px] text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
      >
        <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
      </button>
      {portal}
    </form>
  );
}

export default function Sidebar({ email }: { email?: string | null }) {
  const pathname = usePathname();

  const isItemActive = (href: string) =>
    href === "/lab" ? pathname === "/lab" : pathname.startsWith(href);

  const initial = email?.trim().charAt(0).toUpperCase() || "?";

  return (
    <aside className="lab-sidebar">
      {/* eslint-disable-next-line @next/next/no-img-element -- dekoracja poza flow layoutu obrazów Next, potrzebuje pełnej kontroli nad maską/przycięciem */}
      <img
        src="/lab/lab-bg-constellation.png"
        alt=""
        aria-hidden="true"
        className="lab-sidebar-constellation"
      />

      <div className="lab-sidebar-content items-center">
        <Link
          href="/lab"
          aria-label="Przejdź do pulpitu /lab"
          className="relative z-[4] flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.04] text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:border-white/20 hover:text-white"
        >
          <FlaskConical className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </Link>

        <div className="relative z-[4] mt-6 flex flex-col items-center gap-2">
          {PRIMARY_ITEMS.map((item) => (
            <NavButton key={item.key} item={item} isActive={isItemActive(item.href)} />
          ))}
        </div>

        <div className="relative z-[4] my-3 h-px w-8 shrink-0 bg-white/[0.08]" />

        <div className="relative z-[4] flex flex-col items-center gap-2">
          {SECONDARY_ITEMS.map((item) => (
            <NavButton key={item.key} item={item} isActive={isItemActive(item.href)} />
          ))}
        </div>

        <div className="lab-sidebar-footer">
          <div className="h-px w-8 bg-white/[0.08]" />
          <span
            title={email ?? undefined}
            aria-label={email ? `Zalogowano jako ${email}` : "Zalogowano"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xs font-semibold text-white/80"
          >
            {initial}
          </span>
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
