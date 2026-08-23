"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ellipsis, MapPin, Pencil, Plane, Bed, Receipt, FolderOpen, Trash2 } from "lucide-react";
import SessionStatusBadge from "@/components/szkola/SessionStatusBadge";
import { deleteSession } from "@/app/lab/szkola/zjazdy/actions";
import { formatSessionDateRange } from "@/lib/szkola/format";
import type { SessionTabKey } from "@/components/szkola/SessionTabs";
import type { SchoolSession } from "@/lib/szkola/types";

const quickActionButtonClass =
  "inline-flex min-h-[34px] items-center justify-start gap-[7px] whitespace-nowrap rounded-[9px] border border-[#e7dfeb] bg-white/[0.48] px-2.5 py-[7px] text-[13px] font-medium text-[#62596b] transition-colors duration-150 hover:border-[#ddd0e8] hover:bg-[#f1eafd] hover:text-[#4c1f72] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(91,42,134,0.25)]";

export default function SessionHeader({
  session,
  onEdit,
  onNavigateTab,
}: {
  session: SchoolSession;
  onEdit: () => void;
  onNavigateTab: (tab: SessionTabKey) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const title = session.session_number ? `Zjazd ${session.session_number}` : session.title;

  return (
    <div className="grid grid-cols-1 items-start gap-6 min-[800px]:grid-cols-[minmax(0,1fr)_270px] min-[800px]:gap-7">
      <div className="min-w-0">
        <Link
          href="/lab/szkola/zjazdy"
          className="flex items-center gap-1.5 text-sm text-[#706878] transition-colors hover:text-[#5b2a86]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          Powrót do zjazdów
        </Link>

        <h1
          className="mt-4 max-w-[900px] font-[family-name:var(--font-cormorant)] font-medium text-[#201a2b]"
          style={{ fontSize: "clamp(32px, 3vw, 44px)", lineHeight: 1.06 }}
        >
          {title}
          {session.topic && (
            <span className="block text-[0.55em] font-normal text-[#5b2a86]">{session.topic}</span>
          )}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <SessionStatusBadge status={session.status} />
          <span className="flex items-center gap-1 text-xs text-[#706878]">
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
            {session.city || "Miejsce nieokreślone"} · {formatSessionDateRange(session.start_date, session.end_date)}
          </span>
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col items-end gap-3 pt-0.5 min-[800px]:w-[270px]">
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-4 py-2 text-sm font-medium text-[#201a2b] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] hover:text-[#32134f]"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.75} />
            Edytuj zjazd
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Więcej akcji"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-[#e8e2ec] text-[#706878] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] hover:text-[#32134f]"
            >
              <Ellipsis className="h-4 w-4" strokeWidth={1.75} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-48 rounded-[10px] border border-[#e8e2ec] bg-white py-1 shadow-[0_8px_24px_rgba(49,30,64,0.12)]">
                <form
                  action={async (formData) => {
                    if (!confirm(`Usunąć zjazd „${session.title}”? Tej operacji nie można cofnąć.`)) {
                      return;
                    }
                    await deleteSession(formData);
                    router.push("/lab/szkola/zjazdy");
                  }}
                >
                  <input type="hidden" name="id" value={session.id} />
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    Usuń zjazd
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-x-2 gap-y-1.5">
          <button type="button" onClick={() => onNavigateTab("podroz")} className={quickActionButtonClass}>
            <Plane className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            Podróż
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab("zakwaterowanie")}
            className={quickActionButtonClass}
          >
            <Bed className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            Nocleg
          </button>
          <button type="button" onClick={() => onNavigateTab("koszty")} className={quickActionButtonClass}>
            <Receipt className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            Wydatek
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab("materialy")}
            className={quickActionButtonClass}
          >
            <FolderOpen className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            Materiał
          </button>
        </div>
      </div>
    </div>
  );
}
