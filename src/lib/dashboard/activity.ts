import type { ActivityItem } from "@/lib/dashboard/types";

const MAX_ACTIVITY_ITEMS = 5;

/**
 * Sekcja 11 briefu: brak audit logu w projekcie (potwierdzone researchem) —
 * zamiast budować od razu ciężki system zdarzeń, składamy uproszczony feed z
 * created_at/updated_at kilku już istniejących tabel. Tam, gdzie nie ma
 * jednoznacznego "zdarzenia" (np. opłacenie semestru, przypisanie importu),
 * używamy updated_at jako przybliżenia — to świadomy kompromis, opisany w
 * podsumowaniu na końcu zadania, nie błąd.
 */
export function buildRecentActivity(input: {
  newSegments: { id: string; departure_place: string | null; arrival_place: string | null; segment_type: string; created_at: string }[];
  newAccommodations: { id: string; name: string; created_at: string }[];
  newExpenses: { id: string; name: string; created_at: string }[];
  newVersions: { id: string; article_id: string; article_title: string; version_number: number; uploaded_at: string }[];
  statusChanges: { id: string; article_title: string; title: string; created_at: string }[];
  paidSemesters: { id: string; name: string; updated_at: string }[];
  assignedImports: { id: string; label: string; updated_at: string }[];
}): ActivityItem[] {
  const items: ActivityItem[] = [
    ...input.newSegments.map((s) => ({
      id: `segment-${s.id}`,
      source: "school" as const,
      description:
        s.segment_type === "samolot"
          ? `Dodano bilet lotniczy: ${s.departure_place || "?"} → ${s.arrival_place || "?"}`
          : `Dodano odcinek podróży: ${s.departure_place || "?"} → ${s.arrival_place || "?"}`,
      at: s.created_at,
    })),
    ...input.newAccommodations.map((a) => ({
      id: `accommodation-${a.id}`,
      source: "school" as const,
      description: `Dodano zakwaterowanie: ${a.name}`,
      at: a.created_at,
    })),
    ...input.newExpenses.map((e) => ({
      id: `expense-${e.id}`,
      source: "school" as const,
      description: `Dodano koszt: ${e.name}`,
      at: e.created_at,
    })),
    ...input.newVersions.map((v) => ({
      id: `version-${v.id}`,
      source: "article" as const,
      description: `Dodano wersję artykułu: ${v.article_title} (v${v.version_number})`,
      at: v.uploaded_at,
    })),
    ...input.statusChanges.map((c) => ({
      id: `status-${c.id}`,
      source: "article" as const,
      description: `${c.title} — ${c.article_title}`,
      at: c.created_at,
    })),
    ...input.paidSemesters.map((s) => ({
      id: `semester-${s.id}`,
      source: "school" as const,
      description: `Opłacono semestr: ${s.name}`,
      at: s.updated_at,
    })),
    ...input.assignedImports.map((i) => ({
      id: `import-${i.id}`,
      source: "school" as const,
      description: `Przypisano import do zjazdu: ${i.label}`,
      at: i.updated_at,
    })),
  ];

  items.sort((a, b) => b.at.localeCompare(a.at));
  return items.slice(0, MAX_ACTIVITY_ITEMS);
}
