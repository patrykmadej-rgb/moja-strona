"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { PRIMARY_ITEMS, SECONDARY_ITEMS, isLabNavItemActive } from "@/components/lab/Sidebar";

/** Sticky nagłówek widoczny tylko na mobile (.lab-mobile-header ukryty od 768px w globals.css) — tytuł sekcji wyznaczony z tych samych danych co Sidebar/LabBottomNav. */
export default function LabMobileHeader({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const activeItem = [...PRIMARY_ITEMS, ...SECONDARY_ITEMS].find((item) => isLabNavItemActive(pathname, item.href));
  const title = activeItem?.label ?? "Lab";
  const initial = email?.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="lab-mobile-header">
      <Link href="/lab" aria-label="Przejdź do pulpitu /lab" className="lab-mobile-header-logo">
        <FlaskConical className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      </Link>
      <h1 className="lab-mobile-header-title">{title}</h1>
      <span className="lab-mobile-header-avatar" title={email ?? undefined} aria-hidden="true">
        {initial}
      </span>
    </header>
  );
}
