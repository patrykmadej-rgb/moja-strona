import type { Metadata } from "next";
import { Inbox, Upload } from "lucide-react";
import SzkolaNav from "@/components/szkola/SzkolaNav";

export const metadata: Metadata = { title: "Skrzynka importu" };

export default function ImportSzkolaPage() {
  return (
    <div className="lab-szkola-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <div>
          <h1 className="font-[family-name:var(--font-cormorant)] text-[32px] font-semibold leading-[1.1] text-[#201a2b]">
            Skrzynka importu
          </h1>
          <p className="mt-1.5 text-[13px] text-[#706878]">
            Potwierdzenia lotów, hoteli, biletów i faktur — do ręcznego przypisania do zjazdu.
          </p>
        </div>

        <div className="mt-6">
          <SzkolaNav />
        </div>

        <div className="mt-6 rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-[#201a2b]">Elementy w skrzynce</h2>
            <button
              type="button"
              disabled
              title="Ręczny upload pojawi się w kolejnym etapie modułu"
              className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-4 text-sm font-medium text-[#9a919f] opacity-60"
            >
              <Upload className="h-4 w-4" strokeWidth={1.75} />
              Prześlij plik
            </button>
          </div>

          <div className="mt-4 flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#e8e2ec] text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#f1eafd] text-[#5b2a86]">
              <Inbox className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <p className="mt-1 text-sm font-medium text-[#201a2b]">Skrzynka jest pusta</p>
            <p className="max-w-sm text-xs text-[#9a919f]">
              Docelowo: adres do przesyłania rezerwacji e-mailem oraz ręczny upload PDF. Ta funkcja jest w
              przygotowaniu — nic nie jest jeszcze zapisywane automatycznie.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
