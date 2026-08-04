import type { ImportInboxItem } from "@/lib/szkola/types";

/**
 * Wykrywanie zakleszczonych importów: rekord w stanie "processing" (na
 * poziomie status ALBO ocr_status), którego updated_at nie ruszył się od
 * dłuższego czasu. To NIE zależy od tego, czy oryginalny request kiedyś
 * "grzecznie" się zakończy — działa nawet jeśli proces serverless został
 * zabity z zewnątrz (Vercel maxDuration) i żaden kod aplikacji (łącznie
 * z try/finally) nie zdążył zaktualizować rekordu. Bezpieczne (czysta
 * funkcja, bez "server-only") do użycia zarówno w Server, jak i Client
 * Component.
 */
const STUCK_THRESHOLD_MS = 5 * 60 * 1000; // 5 minut, jak w briefie

export function isStuckProcessing(
  item: Pick<ImportInboxItem, "status" | "ocr_status" | "updated_at">,
  now: number = Date.now(),
): boolean {
  const isProcessing = item.status === "processing" || item.ocr_status === "processing";
  if (!isProcessing) return false;
  const updatedAgoMs = now - new Date(item.updated_at).getTime();
  return updatedAgoMs > STUCK_THRESHOLD_MS;
}
