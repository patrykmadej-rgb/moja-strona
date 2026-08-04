import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logImportStage } from "@/lib/szkola/importLogging";
import { isOcrEligibleMimeType } from "@/lib/szkola/import/ocr";
import { runOcrJob } from "@/lib/szkola/import/reprocessCore";

/**
 * "Spróbuj OCR" / "Ponów OCR" — dedykowana trasa API zamiast Server Action.
 *
 * Kluczowa zmiana architektury (naprawa "OCR trwa bardzo długo"): OCR NIE
 * jest już uruchamiany synchronicznie w ramach requestu, na który czeka
 * przeglądarka. Ten handler tylko: (1) sprawdza uprawnienia, (2) oznacza
 * rekord jako "processing"/"ocr_status: processing", (3) planuje faktyczne
 * rozpoznawanie przez `after()` — natywny mechanizm Next.js/Vercel (pod
 * spodem: `waitUntil`) do kontynuowania pracy PO wysłaniu odpowiedzi, bez
 * zewnętrznej kolejki/usługi — i od razu zwraca odpowiedź. Przeglądarka nie
 * czeka na koniec OCR w tym samym żądaniu; UI odpytuje osobną trasę
 * `/api/szkola/import/[id]/status` (patrz route.ts w sąsiednim katalogu).
 *
 * maxDuration=60 ogranicza CAŁKOWITY czas działania funkcji (razem z pracą
 * zaplanowaną przez after()) — wyraźnie POWYŻEJ wewnętrznego twardego
 * limitu OCR (45s, localOcrProvider.ts), więc to nasz kod ma szansę
 * pierwszy zapisać czytelny stan w bazie.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: inboxItemId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const { data: item, error: itemError } = await supabase
    .from("import_inbox_items")
    .select("id, user_id, storage_path, mime_type, status")
    .eq("id", inboxItemId)
    .maybeSingle();
  if (itemError) {
    return NextResponse.json({ error: itemError.message }, { status: 500 });
  }
  if (!item) {
    return NextResponse.json({ error: "Nie znaleziono importu." }, { status: 404 });
  }
  if (item.user_id !== user.id) {
    return NextResponse.json({ error: "Brak dostępu." }, { status: 403 });
  }
  if (!item.storage_path) {
    return NextResponse.json({ error: "Ten import nie ma pliku, więc nie można ponowić OCR." }, { status: 400 });
  }
  if (!isOcrEligibleMimeType(item.mime_type)) {
    return NextResponse.json(
      { error: "OCR nie jest dostępny dla tego typu pliku (obsługiwane: PDF, JPG, PNG, WEBP)." },
      { status: 400 },
    );
  }

  logImportStage("manual-ocr-requested", { inboxItemId });
  const { error: updateError } = await supabase
    .from("import_inbox_items")
    .update({ status: "processing", ocr_status: "processing", updated_at: new Date().toISOString() })
    .eq("id", inboxItemId);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const userId = user.id;
  after(async () => {
    await runOcrJob(supabase, userId, inboxItemId);
  });

  return NextResponse.json({ started: true });
}
