import { FolderOpen } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";
import type { SessionMaterial } from "@/lib/szkola/types";

export default function MaterialsSummaryCard({
  materials,
  onNavigateTab,
}: {
  materials: SessionMaterial[];
  onNavigateTab: () => void;
}) {
  const mostRecent = [...materials].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-[#201a2b]">Materiały ze zjazdu</h2>
        {materials.length > 0 && (
          <button type="button" onClick={onNavigateTab} className="text-sm font-medium text-[#5b2a86] hover:underline">
            Zobacz materiały →
          </button>
        )}
      </div>

      {materials.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Brak materiałów"
          subtitle="Dodaj prezentacje, literaturę lub zdjęcia tablicy."
          action={{ label: "Dodaj materiał", onClick: onNavigateTab }}
          compact
        />
      ) : (
        <div className="mt-3 text-sm">
          <p className="text-lg font-semibold text-[#201a2b]">{materials.length}</p>
          <p className="text-xs text-[#706878]">{materials.length === 1 ? "plik/pozycja" : "plików/pozycji"}</p>
          {mostRecent && (
            <p className="mt-2 truncate text-xs text-[#706878]">
              Ostatnio dodano: {mostRecent.title || mostRecent.name}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
