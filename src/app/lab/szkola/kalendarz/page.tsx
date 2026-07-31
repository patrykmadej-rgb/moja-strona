import type { Metadata } from "next";
import { CalendarOff, RefreshCw } from "lucide-react";
import SzkolaNav from "@/components/szkola/SzkolaNav";

export const metadata: Metadata = { title: "Kalendarz" };

export default function KalendarzSzkolaPage() {
  return (
    <div className="lab-szkola-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-[32px] font-semibold leading-[1.1] text-[#201a2b]">
            Kalendarz
          </h1>
          <p className="mt-1.5 text-[13px] text-[#706878]">
            Synchronizacja z dedykowanym Google Calendar szkoły psychoterapii.
          </p>
        </div>

        <div className="mt-6">
          <SzkolaNav />
        </div>

        <div className="mt-6 rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#efedf0] text-[#6f6874]">
              <CalendarOff className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <p className="mt-1 text-sm font-medium text-[#201a2b]">Kalendarz niepołączony</p>
            <p className="max-w-sm text-xs text-[#9a919f]">
              Połączenie z Google Calendar wymaga konfiguracji po stronie serwera (zmienne środowiskowe
              i autoryzacja). Do tego czasu synchronizacja jest wyłączona.
            </p>
            <button
              type="button"
              disabled
              title="Wymaga skonfigurowania integracji Google Calendar"
              className="mt-2 flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-4 text-sm font-medium text-[#9a919f] opacity-60"
            >
              <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
              Sprawdź teraz
            </button>
            <p className="mt-3 text-[11px] text-[#9a919f]">Ostatnia synchronizacja: nigdy</p>
          </div>
        </div>

        <div className="mt-5 rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <h2 className="text-sm font-semibold text-[#201a2b]">Wykryte zmiany</h2>
          <p className="mt-2 text-xs italic text-[#9a919f]">
            Brak danych — pojawią się po pierwszej synchronizacji.
          </p>
        </div>
      </div>
    </div>
  );
}
