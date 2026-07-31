"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange } from "lucide-react";
import SessionTableRow, { SESSION_TABLE_GRID_COLS } from "@/components/szkola/SessionTableRow";
import ArticlesPagination from "@/components/lab/ArticlesPagination";
import EmptyState from "@/components/lab/EmptyState";
import type { SessionListItem } from "@/components/szkola/SessionsExplorer";

const PAGE_SIZE = 10;

export default function SessionsTable({
  sessions,
  hasAnySessions,
}: {
  sessions: SessionListItem[];
  hasAnySessions: boolean;
}) {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(sessions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSessions = useMemo(
    () => sessions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sessions, safePage],
  );

  const rangeStart = sessions.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, sessions.length);

  return (
    <div className="rounded-[14px] border border-[#e8e2ec] bg-white/95 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      {sessions.length > 0 && (
        <div
          className={`hidden min-[1100px]:grid min-[1100px]:h-11 min-[1100px]:items-center min-[1100px]:gap-4 min-[1100px]:border-b min-[1100px]:border-[#e8e2ec] min-[1100px]:bg-[#fbfafc] min-[1100px]:px-4 min-[1100px]:text-[11px] min-[1100px]:font-semibold min-[1100px]:text-[#62596b] ${SESSION_TABLE_GRID_COLS}`}
        >
          <span>Zjazd</span>
          <span>Data</span>
          <span>Miejsce</span>
          <span>Plan zajęć</span>
          <span>Przygotowanie</span>
          <span>Brakujące elementy</span>
          <span>Koszt</span>
          <span>Status</span>
          <span />
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="px-6 py-4">
          {hasAnySessions ? (
            <EmptyState
              icon={CalendarRange}
              title="Nie znaleziono zjazdów"
              subtitle="Spróbuj zmienić filtry lub dodaj nowy zjazd."
              action={{ label: "Dodaj zjazd", onClick: () => router.push("/lab/szkola/zjazdy/nowy") }}
            />
          ) : (
            <EmptyState
              icon={CalendarRange}
              title="Nie dodano jeszcze żadnego zjazdu"
              subtitle="Utwórz pierwszy zjazd i zacznij śledzić przygotowania."
              action={{
                label: "Dodaj pierwszy zjazd",
                onClick: () => router.push("/lab/szkola/zjazdy/nowy"),
              }}
            />
          )}
        </div>
      ) : (
        <>
          {pageSessions.map((session, i) => (
            <SessionTableRow key={session.id} session={session} isLast={i === pageSessions.length - 1} />
          ))}
          <ArticlesPagination
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            total={sessions.length}
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
