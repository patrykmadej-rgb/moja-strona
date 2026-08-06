"use client";

import { CheckCircle2, HelpCircle } from "lucide-react";
import { CONFIDENCE_LABEL_TEXT, type FindSuggestedSessionResult } from "@/lib/szkola/sessionSuggestion";
import { formatSessionDateRange } from "@/lib/szkola/format";
import type { SchoolSession } from "@/lib/szkola/types";

/**
 * Modal potwierdzenia dopasowania zjazdu (sekcja 4/7/15 briefu) — wspólny dla
 * odcinków podróży i zakwaterowania. Prosty, jednoznaczny język, bez
 * technicznego score'u (sekcja 6: pokazujemy tylko confidenceLabel).
 * Nigdy nie przypisuje niczego samodzielnie — czeka na jedną z akcji.
 */
export default function SessionSuggestionModal({
  result,
  onConfirm,
  onChooseOther,
  onSaveWithoutLink,
  onBackToEdit,
  isSubmitting,
}: {
  result: FindSuggestedSessionResult;
  onConfirm: (session: SchoolSession) => void;
  onChooseOther: () => void;
  onSaveWithoutLink: () => void;
  onBackToEdit: () => void;
  isSubmitting?: boolean;
}) {
  const { suggestedSession, confidenceLabel, reasons } = result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-[420px] rounded-[16px] bg-white p-6 shadow-[0_20px_60px_rgba(30,15,45,0.25)]">
        {suggestedSession ? (
          <>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[#5b2a86]" strokeWidth={1.75} />
              <p className="text-xs font-semibold uppercase tracking-wide text-[#5b2a86]">
                {confidenceLabel ? CONFIDENCE_LABEL_TEXT[confidenceLabel] : "Prawdopodobny zjazd"}
              </p>
            </div>

            <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-[22px] font-semibold text-[#201a2b]">
              {suggestedSession.session_number ? `Zjazd ${suggestedSession.session_number}` : suggestedSession.title}
            </h2>
            <p className="mt-1 text-sm text-[#4f4758]">
              {[suggestedSession.city, formatSessionDateRange(suggestedSession.start_date, suggestedSession.end_date)]
                .filter(Boolean)
                .join(" · ")}
            </p>

            {reasons.length > 0 && (
              <div className="mt-4 rounded-[10px] bg-[#f7f4ef] p-3">
                <p className="text-xs font-medium text-[#706878]">Dlaczego:</p>
                <ul className="mt-1.5 space-y-1 text-xs text-[#4f4758]">
                  {reasons.map((reason) => (
                    <li key={reason} className="flex gap-1.5">
                      <span aria-hidden="true">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onConfirm(suggestedSession)}
                className="rounded-[10px] bg-[#5b2a86] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
              >
                Tak, powiąż
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onChooseOther}
                className="rounded-[10px] border border-[#e8e2ec] px-4 py-2.5 text-sm text-[#201a2b] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] disabled:opacity-50"
              >
                Wybierz inny zjazd
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onSaveWithoutLink}
                className="rounded-[10px] border border-[#e8e2ec] px-4 py-2.5 text-sm text-[#706878] transition-colors hover:border-[#d9cde5] disabled:opacity-50"
              >
                Zapisz bez powiązania
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onBackToEdit}
                className="text-sm text-[#9a919f] hover:text-[#5b2a86] hover:underline disabled:opacity-50"
              >
                Wróć do edycji
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 shrink-0 text-[#9a919f]" strokeWidth={1.75} />
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9a919f]">Brak jednoznacznego dopasowania</p>
            </div>
            <p className="mt-3 text-sm text-[#4f4758]">
              Nie udało się jednoznacznie dopasować tego rekordu do zjazdu.
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onChooseOther}
                className="rounded-[10px] bg-[#5b2a86] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
              >
                Wybierz zjazd ręcznie
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onSaveWithoutLink}
                className="rounded-[10px] border border-[#e8e2ec] px-4 py-2.5 text-sm text-[#706878] transition-colors hover:border-[#d9cde5] disabled:opacity-50"
              >
                Zapisz bez powiązania
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onBackToEdit}
                className="text-sm text-[#9a919f] hover:text-[#5b2a86] hover:underline disabled:opacity-50"
              >
                Wróć do edycji
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
