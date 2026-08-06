import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Jeden itinerary na zjazd (get-or-create). Wydzielone ze
 * `zjazdy/[id]/actions.ts` do wspólnego modułu (migracja 020) — teraz
 * potrzebne też przy powiązywaniu odcinka podróży dodanego z ogólnej
 * zakładki /lab/szkola/podroze, gdzie odcinek dostaje session_id
 * bezpośrednio, ale strona szczegółów zjazdu nadal czyta odcinki przez
 * itinerary_id (bez zmian w tamtej, już działającej ścieżce) — więc przy
 * każdym powiązaniu odcinka ze zjazdem trzeba też uzupełnić jego
 * itinerary_id, żeby pozostał widoczny w obu miejscach.
 */
export async function getOrCreateItinerary(supabase: SupabaseClient, sessionId: string): Promise<string> {
  const { data: existing } = await supabase
    .from("travel_itineraries")
    .select("id")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data: created, error } = await supabase
    .from("travel_itineraries")
    .insert({ session_id: sessionId })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return created.id as string;
}
