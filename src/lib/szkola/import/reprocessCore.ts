import "server-only";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { classifyImportContent, isLowConfidence } from "@/lib/szkola/importClassifier";
import { extractReservationFields } from "@/lib/szkola/importFieldExtraction";
import { matchImportToSession } from "@/lib/szkola/importSessionMatching";
import { findDuplicateReservation } from "@/lib/szkola/importDuplicates";
import { IMPORTS_BUCKET } from "@/lib/szkola/importStorage";
import { logImportStage, safeErrorMessage } from "@/lib/szkola/importLogging";
import { timeStage } from "@/lib/szkola/import/ocr/timing";
import { extractTextWithOcrFallback, buildProcessingNote, type ExtractionOutcome } from "@/lib/szkola/import/textExtractionWithOcr";
import { isOcrEligibleMimeType } from "@/lib/szkola/import/ocr";
import type { ExtractionMethod, OcrStatus, ProcessingStage, SchoolSession } from "@/lib/szkola/types";

/**
 * Rdzeń "Przetwórz ponownie" / "Spróbuj OCR" — jedna wspólna implementacja,
 * tylko forceOcr różni te dwie ścieżki. Aktualizuje ISTNIEJĄCY rekord (żaden
 * nowy wiersz, żadna nowa kopia pliku).
 *
 * Wydzielone z actions.ts (plik "use server" może eksportować wyłącznie
 * Server Actions) do osobnego modułu, żeby:
 *  (1) trasa API `/api/szkola/import/[id]/ocr/route.ts` mogła wywołać
 *      dokładnie tę samą logikę bezpośrednio, bez narzutu Server Action,
 *  (2) uruchamianie OCR w tle (after()) nie musiało przechodzić przez
 *      warstwę Server Actions, która nie jest do tego przeznaczona.
 *
 * Bez forceOcr: jeśli rekord ma już raw_text, ponowna klasyfikacja działa na
 * nim bez ponownego pobierania pliku (szybkie). Z forceOcr: zawsze pobiera
 * plik na nowo i wymusza OCR, niezależnie od tego, czy zwykły parser już coś
 * znalazł.
 */
export async function reprocessInboxItem(
  supabase: SupabaseClient,
  userId: string,
  inboxItemId: string,
  options: { forceOcr: boolean },
): Promise<void> {
  const { data: item, error: itemError } = await supabase
    .from("import_inbox_items")
    .select("*")
    .eq("id", inboxItemId)
    .single();
  if (itemError) throw new Error(itemError.message);

  let outcome: ExtractionOutcome;
  if (options.forceOcr) {
    if (!item.storage_path) throw new Error("Ten import nie ma pliku, więc nie można ponowić OCR.");
    if (!isOcrEligibleMimeType(item.mime_type)) {
      throw new Error("OCR nie jest dostępny dla tego typu pliku (obsługiwane: PDF, JPG, PNG, WEBP).");
    }
    const { data: blob, error: downloadError } = await timeStage("download", () =>
      supabase.storage.from(IMPORTS_BUCKET).download(item.storage_path),
    );
    if (downloadError) throw new Error(downloadError.message);
    const buffer = Buffer.from(await blob.arrayBuffer());
    outcome = await extractTextWithOcrFallback(item.mime_type ?? "", buffer, { forceOcr: true });
  } else if (item.raw_text) {
    outcome = {
      text: item.raw_text,
      senderName: item.sender_name,
      subject: item.raw_email_subject,
      receivedAt: null,
      extractionMethod: (item.extraction_method as ExtractionMethod | null) ?? "text_layer",
      ocrStatus: (item.ocr_status as OcrStatus | null) ?? "not_needed",
      ocrConfidence: item.ocr_confidence,
      ocrPagesProcessed: item.ocr_pages_processed,
      ocrWarnings: [],
      processingStage: "analyzing",
    };
  } else if (item.storage_path) {
    const { data: blob, error: downloadError } = await timeStage("download", () =>
      supabase.storage.from(IMPORTS_BUCKET).download(item.storage_path),
    );
    if (downloadError) throw new Error(downloadError.message);
    const buffer = Buffer.from(await blob.arrayBuffer());
    outcome = await extractTextWithOcrFallback(item.mime_type ?? "", buffer);
  } else {
    outcome = {
      text: "",
      senderName: item.sender_name,
      subject: item.raw_email_subject,
      receivedAt: null,
      extractionMethod: "none",
      ocrStatus: "not_needed",
      ocrConfidence: null,
      ocrPagesProcessed: null,
      ocrWarnings: [],
      processingStage: "needs_manual_review",
    };
  }

  const classification = classifyImportContent({
    text: outcome.text,
    subject: item.raw_email_subject,
    filename: item.original_filename,
    senderName: item.sender_name,
  });
  const extracted = extractReservationFields(classification.detectedType, outcome.text);

  const { data: sessionsData } = await supabase.from("school_sessions").select("*");
  const sessions = (sessionsData as SchoolSession[] | null) ?? [];
  const sessionMatch = matchImportToSession(
    { text: outcome.text, startAt: extracted.start_at, checkIn: extracted.check_in, checkOut: extracted.check_out },
    sessions,
  );

  const duplicates = await findDuplicateReservation(supabase, userId, {
    reservationType: classification.detectedType,
    bookingReference: extracted.booking_reference,
    amount: extracted.amount,
    currency: extracted.currency,
    startAt: extracted.start_at,
  });
  const status = duplicates.length > 0 || isLowConfidence(classification.confidence) ? "needs_review" : "recognized";
  const finalStage: ProcessingStage =
    outcome.processingStage === "ocr_error" ? "ocr_error" : status === "recognized" ? "ready_for_review" : "needs_manual_review";

  await timeStage("save-result", () =>
    supabase
      .from("import_inbox_items")
      .update({
        raw_text: outcome.text.slice(0, 20000),
        status,
        detected_type: classification.detectedType,
        confidence_score: Math.round(classification.confidence * 1000) / 1000,
        proposed_session_id: sessionMatch?.confidence === "high" ? sessionMatch.session.id : null,
        processing_error: buildProcessingNote(outcome, Boolean(item.storage_path)),
        extraction_method: outcome.extractionMethod,
        ocr_status: outcome.ocrStatus,
        ocr_confidence: outcome.ocrConfidence,
        ocr_pages_processed: outcome.ocrPagesProcessed,
        ocr_warnings: outcome.ocrWarnings,
        processing_stage: finalStage,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", inboxItemId),
  );

  const { data: reservation } = await supabase
    .from("imported_reservations")
    .select("id")
    .eq("inbox_item_id", inboxItemId)
    .maybeSingle();

  if (reservation) {
    await supabase
      .from("imported_reservations")
      .update({
        reservation_type: classification.detectedType,
        provider: extracted.provider,
        booking_reference: extracted.booking_reference,
        origin: extracted.origin,
        destination: extracted.destination,
        start_at: extracted.start_at,
        end_at: extracted.end_at,
        check_in: extracted.check_in,
        check_out: extracted.check_out,
        amount: extracted.amount,
        currency: extracted.currency,
        passenger_name: extracted.passenger_name,
        seat: extracted.seat,
        cancellation_deadline: extracted.cancellation_deadline,
        parsed_data: extracted.extra,
        confidence_score: Math.round(classification.confidence * 1000) / 1000,
        status,
        // undefined => pole pominięte w zapytaniu, nie nadpisujemy już przypisanego
        // zjazdu, jeśli ponowne przetworzenie nie znalazło jednoznacznego dopasowania.
        session_id: sessionMatch?.confidence === "high" ? sessionMatch.session.id : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservation.id);
  }
}

/**
 * Ciało zadania "Spróbuj OCR" uruchamianego w tle (after(), patrz trasa API
 * /api/szkola/import/[id]/ocr) — poza timingiem "total" identyczne z tym, co
 * wcześniej robił Server Action `tryOcr`: wymusza OCR, a jeśli COKOLWIEK
 * rzuci wyjątek poza własną obsługą błędów OCR (patrz textExtractionWithOcr.ts,
 * które już łapie timeout/błąd OCR i zwraca normalny wynik), to ostatnia
 * linia obrony zapisuje rekord jako "error" zamiast zostawić go w "processing".
 */
export async function runOcrJob(supabase: SupabaseClient, userId: string, inboxItemId: string): Promise<void> {
  const start = performance.now();
  logImportStage("manual-ocr-start", { inboxItemId });
  try {
    await reprocessInboxItem(supabase, userId, inboxItemId, { forceOcr: true });
    logImportStage("manual-ocr-done", { inboxItemId });
  } catch (err) {
    const message = safeErrorMessage(
      err,
      "Nie udało się odczytać dokumentu automatycznie. Plik został bezpiecznie zapisany. Możesz uzupełnić dane ręcznie lub ponowić OCR.",
    );
    logImportStage("manual-ocr-failed", { inboxItemId });
    await supabase
      .from("import_inbox_items")
      .update({
        status: "needs_review",
        ocr_status: "failed",
        processing_stage: "ocr_error",
        processing_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inboxItemId);
  } finally {
    console.log(`[school-ocr] total (job): ${Math.round(performance.now() - start)}ms`);
    // revalidatePath działa wewnątrz after() (dokumentacja Next.js) — bez
    // tego lista importów i strona szczegółów trzymałyby stary cache aż do
    // naturalnego wygaśnięcia, mimo że rekord w bazie jest już zaktualizowany.
    revalidatePath("/lab/szkola/import");
    revalidatePath(`/lab/szkola/import/${inboxItemId}`);
  }
}
