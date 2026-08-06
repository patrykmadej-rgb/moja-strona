"use client";

import { useState } from "react";
import { formatSessionDateRange } from "@/lib/szkola/format";
import type { SchoolSession } from "@/lib/szkola/types";

/**
 * Lista "Wybierz inny zjazd" (sekcja 8 briefu) — `sessions` przychodzi już
 * posortowana (najbardziej prawdopodobne, potem chronologicznie), patrz
 * FindSuggestedSessionResult.alternativeSessions w sessionSuggestion.ts.
 * Użytkownik wybiera jeden zjazd i osobno potwierdza (dwa kroki, żeby
 * kliknięcie na liście nie powiązało niczego przez pomyłkę).
 */
export default function ChooseSessionModal({
  sessions,
  onConfirm,
  onCancel,
  isSubmitting,
}: {
  sessions: SchoolSession[];
  onConfirm: (session: SchoolSession) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = sessions.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[80vh] w-full max-w-[440px] flex-col rounded-[16px] bg-white p-6 shadow-[0_20px_60px_rgba(30,15,45,0.25)]">
        <h2 className="font-[family-name:var(--font-cormorant)] text-[20px] font-semibold text-[#201a2b]">
          Wybierz zjazd
        </h2>

        {sessions.length === 0 ? (
          <p className="mt-3 text-sm italic text-[#9a919f]">Brak zjazdów do wyboru.</p>
        ) : (
          <ul className="mt-3 flex-1 overflow-y-auto">
            {sessions.map((session) => {
              const isSelected = selectedId === session.id;
              return (
                <li key={session.id} className="border-b border-[#eee9f2] last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setSelectedId(session.id)}
                    className={
                      isSelected
                        ? "flex w-full flex-col items-start gap-0.5 rounded-[10px] bg-[#f1eafd] px-3 py-2.5 text-left"
                        : "flex w-full flex-col items-start gap-0.5 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-[#f7f4ef]"
                    }
                  >
                    <span className="text-sm font-medium text-[#201a2b]">
                      {session.session_number ? `Zjazd ${session.session_number}` : session.title}
                    </span>
                    <span className="text-xs text-[#706878]">
                      {[session.city, formatSessionDateRange(session.start_date, session.end_date)].filter(Boolean).join(" · ")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            disabled={!selected || isSubmitting}
            onClick={() => selected && onConfirm(selected)}
            className="rounded-[10px] bg-[#5b2a86] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
          >
            Potwierdź wybór
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="rounded-[10px] border border-[#e8e2ec] px-4 py-2.5 text-sm text-[#706878] hover:border-[#d9cde5] disabled:opacity-50"
          >
            Anuluj
          </button>
        </div>
      </div>
    </div>
  );
}
