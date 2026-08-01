import { Files } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import type { SessionDocument } from "@/lib/szkola/types";

export default function DocumentsSummaryCard({
  documents,
  onNavigateTab,
}: {
  documents: SessionDocument[];
  onNavigateTab: () => void;
}) {
  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-[#201a2b]">Dokumenty</h2>
        {documents.length > 0 && (
          <button type="button" onClick={onNavigateTab} className="text-sm font-medium text-[#5b2a86] hover:underline">
            Zobacz dokumenty →
          </button>
        )}
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon={Files}
          title="Brak dokumentów"
          subtitle="Bilety, rezerwacje i faktury przypisane do tego zjazdu."
          action={{ label: "Dodaj dokument", onClick: onNavigateTab }}
          compact
        />
      ) : (
        <div className="mt-3 text-sm">
          <p className="text-lg font-semibold text-[#201a2b]">{documents.length}</p>
          <p className="text-xs text-[#706878]">{documents.length === 1 ? "dokument" : "dokumentów"}</p>
        </div>
      )}
    </section>
  );
}
