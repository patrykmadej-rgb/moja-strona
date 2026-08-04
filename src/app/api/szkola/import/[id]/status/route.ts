import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Lekki endpoint do odpytywania (polling) przez UI podczas OCR uruchomionego
 * w tle przez /api/szkola/import/[id]/ocr — patrz komentarz tam. Zwraca
 * WYŁĄCZNIE pola potrzebne do zdecydowania "czy już koniec" i pokazania
 * statusu, nigdy raw_text/treść dokumentu.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: inboxItemId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const { data: item, error } = await supabase
    .from("import_inbox_items")
    .select(
      "id, user_id, status, ocr_status, ocr_confidence, ocr_pages_processed, ocr_warnings, processing_stage, processing_error, detected_type, confidence_score, updated_at",
    )
    .eq("id", inboxItemId)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!item || item.user_id !== user.id) {
    return NextResponse.json({ error: "Nie znaleziono importu." }, { status: 404 });
  }

  // Jawna lista pól w odpowiedzi (zamiast zwrócenia całego `item`) — nigdy
  // user_id ani cokolwiek spoza tego, czego UI faktycznie potrzebuje do
  // pollingu, nawet gdyby select() powyżej kiedyś rozrósł się o nowe pola.
  return NextResponse.json({
    id: item.id,
    status: item.status,
    ocr_status: item.ocr_status,
    ocr_confidence: item.ocr_confidence,
    ocr_pages_processed: item.ocr_pages_processed,
    ocr_warnings: item.ocr_warnings,
    processing_stage: item.processing_stage,
    processing_error: item.processing_error,
    detected_type: item.detected_type,
    confidence_score: item.confidence_score,
    updated_at: item.updated_at,
  });
}
