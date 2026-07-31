"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Ellipsis } from "lucide-react";
import SessionStatusBadge from "@/components/szkola/SessionStatusBadge";
import { deleteSession } from "@/app/lab/szkola/zjazdy/actions";
import { formatSessionDateRange } from "@/lib/szkola/format";
import type { SessionListItem } from "@/components/szkola/SessionsExplorer";

export const SESSION_TABLE_GRID_COLS =
  "min-[1100px]:grid-cols-[minmax(200px,1.5fr)_130px_100px_80px_110px_minmax(150px,1fr)_80px_110px_40px]";

function RowMenu({ session }: { session: SessionListItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu zjazdu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[#706878] transition-colors hover:bg-[#f1eafd] hover:text-[#4c1f72]"
      >
        <Ellipsis className="h-4 w-4" strokeWidth={1.75} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-44 rounded-[10px] border border-[#e8e2ec] bg-white py-1 shadow-[0_8px_24px_rgba(49,30,64,0.12)]"
        >
          <Link
            href={`/lab/szkola/zjazdy/${session.id}`}
            className="block px-3 py-1.5 text-left text-sm text-[#201a2b] hover:bg-[#f1eafd] hover:text-[#4c1f72]"
          >
            Otwórz
          </Link>
          <Link
            href={`/lab/szkola/zjazdy/${session.id}?edit=1`}
            className="block px-3 py-1.5 text-left text-sm text-[#201a2b] hover:bg-[#f1eafd] hover:text-[#4c1f72]"
          >
            Edytuj
          </Link>
          <form
            action={deleteSession}
            onSubmit={(e) => {
              if (!confirm(`Usunąć zjazd „${session.title}”? Tej operacji nie można cofnąć.`)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={session.id} />
            <button
              type="submit"
              className="block w-full border-t border-[#eee9f2] px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Usuń
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function SessionTableRow({
  session,
  isLast,
}: {
  session: SessionListItem;
  isLast: boolean;
}) {
  const router = useRouter();
  const title = session.session_number ? `Zjazd ${session.session_number}` : session.title;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/lab/szkola/zjazdy/${session.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/lab/szkola/zjazdy/${session.id}`);
      }}
      className={
        (isLast ? "" : "border-b border-[#eee9f2] ") +
        `group flex cursor-pointer flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-[#fcfafc] min-[1100px]:grid min-[1100px]:min-h-[76px] min-[1100px]:items-center min-[1100px]:gap-4 min-[1100px]:py-0 ${SESSION_TABLE_GRID_COLS}`
      }
    >
      <div className="flex items-start justify-between gap-3 min-[1100px]:block">
        <div className="min-w-0">
          <p className="line-clamp-2 text-[13px] font-semibold leading-[1.4] text-[#282130] transition-colors group-hover:text-[#5b2a86]">
            {title}
          </p>
          <p className="mt-1 truncate text-[11px] text-[#817887]">{session.topic || "Bez tematu"}</p>
        </div>
        <div className="shrink-0 min-[1100px]:hidden">
          <RowMenu session={session} />
        </div>
      </div>

      <div className="text-[11px] text-[#62596b]">
        {formatSessionDateRange(session.start_date, session.end_date)}
      </div>

      <div className="truncate text-[11px] text-[#62596b]">{session.city || "Nie określono"}</div>

      <div className="text-[11px] text-[#62596b]">
        {session.scheduleItemCount > 0 ? `${session.scheduleItemCount} pkt.` : "—"}
      </div>

      <div className="flex items-center gap-2">
        <div className="h-1.5 w-12 shrink-0 rounded-full bg-[#eee9f2]">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-[#6c35a1] to-[#8b5bb7]"
            style={{ width: `${session.preparationPercent}%` }}
          />
        </div>
        <span className="text-[11px] font-medium text-[#4f4758]">{session.preparationPercent}%</span>
      </div>

      <div className="min-w-0">
        {session.missingTaskTitles.length > 0 ? (
          <span className="truncate text-[11px] text-[#4f4758]">
            {session.missingTaskTitles.join(", ")}
          </span>
        ) : (
          <span className="text-[11px] italic text-[#9a919f]">
            {session.taskTotalCount === 0 ? "Brak checklisty" : "Kompletne"}
          </span>
        )}
      </div>

      <div className="text-[11px] text-[#62596b]">
        {session.totalCostAmount > 0 ? `${session.totalCostAmount.toFixed(0)} zł` : "—"}
      </div>

      <div>
        <SessionStatusBadge status={session.status} />
      </div>

      <div className="hidden min-[1100px]:block">
        <RowMenu session={session} />
      </div>
    </div>
  );
}
