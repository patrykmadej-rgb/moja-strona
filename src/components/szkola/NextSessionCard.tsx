"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarRange, MapPin, User } from "lucide-react";
import SessionStatusBadge from "@/components/szkola/SessionStatusBadge";
import EmptyState from "@/components/lab/EmptyState";
import { getAutomaticPreparationItems, getAutomaticPreparationMissingLabels, getAutomaticPreparationPercent, getDaysUntil } from "@/lib/szkola/preparation";
import { formatSessionDateRange } from "@/lib/szkola/format";
import type { Accommodation, SchoolSemester, SchoolSession, TravelSegment } from "@/lib/szkola/types";

export default function NextSessionCard({
  session,
}: {
  session:
    | (SchoolSession & { segments: TravelSegment[]; accommodations: Accommodation[]; semester: SchoolSemester | null })
    | null;
}) {
  const router = useRouter();

  if (!session) {
    return (
      <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#9a919f]">Najbliższy zjazd</p>
        <EmptyState
          icon={CalendarRange}
          title="Brak zaplanowanych zjazdów"
          subtitle="Dodaj pierwszy zjazd, żeby zacząć śledzić przygotowania."
          action={{
            label: "Dodaj zjazd",
            onClick: () => router.push("/lab/szkola/zjazdy/nowy"),
          }}
        />
      </section>
    );
  }

  const prepItems = getAutomaticPreparationItems({
    segments: session.segments,
    accommodations: session.accommodations,
    lodgingNotNeeded: session.lodging_not_needed,
    semester: session.semester,
  });
  const percent = getAutomaticPreparationPercent(prepItems);
  const missing = getAutomaticPreparationMissingLabels(prepItems);
  const daysUntil = getDaysUntil(session.start_date);
  const title = session.session_number ? `Zjazd ${session.session_number}` : session.title;

  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#9a919f]">Najbliższy zjazd</p>
        <SessionStatusBadge status={session.status} />
      </div>

      <h2 className="mt-2 font-[family-name:var(--font-cormorant)] text-[26px] font-semibold leading-tight text-[#201a2b]">
        {title}
      </h2>
      {session.topic && <p className="mt-0.5 text-sm text-[#5b2a86]">{session.topic}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#706878]">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
          {session.city || "Miejsce nieokreślone"} · {formatSessionDateRange(session.start_date, session.end_date)}
        </span>
        {session.lead_trainer && (
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" strokeWidth={1.75} />
            {session.lead_trainer}
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#eee9f2] pt-4">
        <div>
          <p className="text-[11px] text-[#9a919f]">Do rozpoczęcia</p>
          <p className="mt-0.5 text-lg font-semibold text-[#201a2b]">
            {daysUntil >= 0 ? `${daysUntil} dni` : "trwa"}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[#9a919f]">Przygotowanie</p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 w-16 shrink-0 rounded-full bg-[#eee9f2]">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-[#6c35a1] to-[#8b5bb7]"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-[#201a2b]">{percent}%</span>
          </div>
        </div>
      </div>

      {missing.length > 0 && (
        <div className="mt-4 rounded-[10px] bg-[#fff2d9] px-3 py-2.5">
          <p className="text-xs font-medium text-[#a76616]">Brakuje:</p>
          <ul className="mt-1 list-inside list-disc text-xs text-[#a76616]">
            {missing.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/lab/szkola/zjazdy/${session.id}`}
          className="flex h-9 items-center rounded-[10px] bg-[#5b2a86] px-4 text-sm font-medium text-white transition-colors hover:bg-[#32134f]"
        >
          Otwórz zjazd
        </Link>
        <Link
          href={`/lab/szkola/zjazdy/${session.id}`}
          className="flex h-9 items-center rounded-[10px] border border-[#e8e2ec] px-4 text-sm font-medium text-[#201a2b] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]"
        >
          Dodaj rezerwację
        </Link>
      </div>
    </section>
  );
}
