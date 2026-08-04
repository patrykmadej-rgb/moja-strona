"use server";

// Uwaga: pliki "use server" mogą eksportować WYŁĄCZNIE async function (Server
// Actions) — `export const runtime` tutaj psuje cały moduł ("module has no
// exports"). Jawna deklaracja runtime = "nodejs" (wymagana przez
// pdf-parse/mammoth/mailparser — pełne Node API, node:crypto, natywne
// dodatki, niedostępne w Edge Runtime) siedzi więc w page.tsx/[id]/page.tsx
// tej trasy zamiast tutaj. Node.js i tak jest domyślnym runtime dla Server
// Actions (nigdzie w drzewie /lab/szkola nie ma `export const runtime = "edge"`).

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { classifyImportContent, isLowConfidence } from "@/lib/szkola/importClassifier";
import { extractReservationFields, type ExtractedReservationFields } from "@/lib/szkola/importFieldExtraction";
import { matchImportToSession } from "@/lib/szkola/importSessionMatching";
import { findDuplicateInboxItem, findDuplicateReservation, hashFileBuffer } from "@/lib/szkola/importDuplicates";
import { IMPORTS_BUCKET } from "@/lib/szkola/importStorage";
import { DOCUMENTS_BUCKET } from "@/lib/szkola/documentsStorage";
import { sanitizeStorageFilename } from "@/lib/storageFilename";
import { logImportStage, safeErrorMessage } from "@/lib/szkola/importLogging";
import {
  extractTextWithOcrFallback,
  buildProcessingNote,
  type ExtractionOutcome,
} from "@/lib/szkola/import/textExtractionWithOcr";
import { isOcrEligibleMimeType } from "@/lib/szkola/import/ocr";
import {
  CURRENCIES,
  IMPORT_DETECTED_TYPES,
  type Currency,
  type ExtractionMethod,
  type ImportDetectedType,
  type OcrStatus,
  type ProcessingStage,
  type SchoolSession,
} from "@/lib/szkola/types";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");
  return user.id;
}

function optionalString(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function parseOptionalAmount(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  if (Number.isNaN(value) || value < 0) throw new Error("Nieprawidłowa kwota.");
  return value;
}

function parseOptionalCurrency(formData: FormData): Currency | null {
  const value = String(formData.get("currency") ?? "").trim();
  if (!value) return null;
  if (!CURRENCIES.includes(value as Currency)) throw new Error("Nieprawidłowa waluta.");
  return value as Currency;
}

async function getOrCreateItinerary(supabase: SupabaseClient, sessionId: string): Promise<string> {
  const { data: existing } = await supabase.from("travel_itineraries").select("id").eq("session_id", sessionId).maybeSingle();
  if (existing) return existing.id as string;
  const { data: created, error } = await supabase
    .from("travel_itineraries")
    .insert({ session_id: sessionId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return created.id as string;
}

const DOCUMENT_TYPE_BY_DETECTED_TYPE: Record<ImportDetectedType, string> = {
  flight: "bilet",
  train: "bilet",
  bus: "bilet",
  hotel: "rezerwacja",
  school_payment: "potwierdzenie_platnosci",
  invoice: "faktura",
  receipt: "paragon",
  school_information: "inne",
  schedule: "harmonogram",
  certificate: "zaswiadczenie",
  other: "inne",
};

// ---------------------------------------------------------------------------
// Wspólny rdzeń przyjęcia importu (klasyfikacja -> ekstrakcja -> duplikaty ->
// dopasowanie zjazdu -> zapis). Używany przez upload/wklejenie/EML, żeby nie
// duplikować tej samej logiki trzy razy.
//
// WAŻNE: ta funkcja celowo NIE łapie własnych błędów — robi to wywołujący
// (createImportFromUpload/createImportFromPastedEmail), który zna kontekst
// (czy jest plik w Storage do ewentualnego posprzątania) i potrafi w razie
// błędu i tak utworzyć rekord ze statusem "error" zamiast dać wyjątkowi
// uciec do poziomu całego Server Action (sekcja 2/3 briefu).
// ---------------------------------------------------------------------------
async function runIntakePipeline(params: {
  userId: string;
  source: "upload" | "pasted_email" | "eml";
  originalFilename: string | null;
  storagePath: string | null;
  mimeType: string | null;
  fileSize: number | null;
  fileHash: string | null;
  senderName: string | null;
  subject: string | null;
  receivedAt: string | null;
  text: string;
  extractionMethod: ExtractionMethod;
  ocrStatus: OcrStatus;
  ocrConfidence: number | null;
  ocrPagesProcessed: number | null;
  ocrWarnings: string[];
  processingStage: ProcessingStage;
  processingNote: string | null;
}) {
  const supabase = await createClient();

  logImportStage("classification-start", { source: params.source, mimeType: params.mimeType });

  const duplicateInboxMatches = await findDuplicateInboxItem(supabase, params.userId, {
    fileHash: params.fileHash,
    filename: params.originalFilename,
  });

  const classification = classifyImportContent({
    text: params.text,
    subject: params.subject,
    filename: params.originalFilename,
    senderName: params.senderName,
  });

  const extracted = extractReservationFields(classification.detectedType, params.text);

  const { data: sessionsData } = await supabase.from("school_sessions").select("*");
  const sessions = (sessionsData as SchoolSession[] | null) ?? [];
  const sessionMatch = matchImportToSession(
    { text: params.text, startAt: extracted.start_at, checkIn: extracted.check_in, checkOut: extracted.check_out },
    sessions,
  );

  const duplicateReservationMatches = await findDuplicateReservation(supabase, params.userId, {
    reservationType: classification.detectedType,
    bookingReference: extracted.booking_reference,
    amount: extracted.amount,
    currency: extracted.currency,
    startAt: extracted.start_at,
  });

  const hasDuplicates = duplicateInboxMatches.length > 0 || duplicateReservationMatches.length > 0;
  const lowConfidence = isLowConfidence(classification.confidence);
  const status = hasDuplicates || lowConfidence ? "needs_review" : "recognized";

  // Etap końcowy: "ocr_error" ma pierwszeństwo (informacja, że konkretnie OCR
  // zawiódł), inaczej odzwierciedla wynik klasyfikacji (sekcja 9 briefu).
  const finalStage: ProcessingStage =
    params.processingStage === "ocr_error" ? "ocr_error" : status === "recognized" ? "ready_for_review" : "needs_manual_review";

  logImportStage("inbox-record-create", {
    status,
    detectedType: classification.detectedType,
    extractionMethod: params.extractionMethod,
    ocrStatus: params.ocrStatus,
  });

  const { data: inboxItem, error: inboxError } = await supabase
    .from("import_inbox_items")
    .insert({
      user_id: params.userId,
      source: params.source,
      original_filename: params.originalFilename,
      storage_path: params.storagePath,
      raw_email_subject: params.subject,
      raw_email_from: params.senderName,
      sender_name: params.senderName,
      raw_text: params.text.slice(0, 20000),
      mime_type: params.mimeType,
      file_size: params.fileSize,
      file_hash: params.fileHash,
      received_at: params.receivedAt ?? new Date().toISOString(),
      status,
      detected_type: classification.detectedType,
      confidence_score: Math.round(classification.confidence * 1000) / 1000,
      proposed_session_id: sessionMatch?.confidence === "high" ? sessionMatch.session.id : null,
      processing_error: params.processingNote,
      extraction_method: params.extractionMethod,
      ocr_status: params.ocrStatus,
      ocr_confidence: params.ocrConfidence,
      ocr_pages_processed: params.ocrPagesProcessed,
      ocr_warnings: params.ocrWarnings,
      processing_stage: finalStage,
      processed_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (inboxError) throw new Error(inboxError.message);

  const { error: reservationError } = await supabase.from("imported_reservations").insert({
    user_id: params.userId,
    inbox_item_id: inboxItem.id,
    session_id: sessionMatch?.confidence === "high" ? sessionMatch.session.id : null,
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
    baggage: typeof extracted.extra.baggage === "string" ? extracted.extra.baggage : null,
    seat: extracted.seat,
    cancellation_deadline: extracted.cancellation_deadline,
    parsed_data: extracted.extra,
    confidence_score: Math.round(classification.confidence * 1000) / 1000,
    status,
  });
  if (reservationError) throw new Error(reservationError.message);

  logImportStage("redirect", { inboxItemId: inboxItem.id as string });

  revalidatePath("/lab/szkola/import");
  revalidatePath("/lab/szkola");

  return {
    inboxItemId: inboxItem.id as string,
    detectedType: classification.detectedType,
    confidence: classification.confidence,
    duplicates: [...duplicateInboxMatches, ...duplicateReservationMatches],
    sessionMatch,
  };
}

/**
 * Ostatnia linia obrony (sekcja 2/3 briefu): plik JUŻ jest bezpiecznie w
 * Storage, ale klasyfikacja/ekstrakcja/zapis rozpoznanej rezerwacji się nie
 * udały. Zamiast dać wyjątkowi uciec do poziomu Server Action (dokładnie tak
 * wyglądała pierwotna awaria — plik w buckecie, zero śladu w bazie), zawsze
 * tworzy (albo aktualizuje istniejący, żeby nie duplikować przy ponownej
 * próbie tego samego pliku) rekord `import_inbox_items` ze statusem "error"
 * i bezpiecznym komunikatem. Tylko jeśli TEN zapis też się nie uda, sprząta
 * osierocony plik i rzuca czytelny błąd do wyświetlenia w formularzu.
 */
async function recordFailedImport(params: {
  userId: string;
  source: "upload" | "eml";
  originalFilename: string | null;
  storagePath: string;
  mimeType: string | null;
  fileSize: number | null;
  fileHash: string;
  err: unknown;
}) {
  const supabase = await createClient();
  const message = safeErrorMessage(params.err, "Nie udało się przetworzyć przesłanego pliku.");
  logImportStage("intake-pipeline-failed", { source: params.source, mimeType: params.mimeType });

  const { data: existing } = await supabase
    .from("import_inbox_items")
    .select("id")
    .eq("user_id", params.userId)
    .eq("file_hash", params.fileHash)
    .eq("status", "error")
    .maybeSingle();

  if (existing) {
    await supabase
      .from("import_inbox_items")
      .update({
        storage_path: params.storagePath,
        processing_error: message,
        // "none" jest uczciwe niezależnie od przyczyny — pipeline przerwał
        // się przed uzyskaniem UŻYWALNEGO tekstu. Nie zgadujemy natomiast
        // ocr_status/processing_stage tutaj (to ogólny catch-all, nie
        // wiadomo, czy w ogóle OCR był próbowany) — zostają bez zmian.
        extraction_method: "none",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    revalidatePath("/lab/szkola/import");
    return { inboxItemId: existing.id as string, detectedType: null, confidence: 0, duplicates: [], sessionMatch: null };
  }

  const { data: inboxItem, error: insertError } = await supabase
    .from("import_inbox_items")
    .insert({
      user_id: params.userId,
      source: params.source,
      original_filename: params.originalFilename,
      storage_path: params.storagePath,
      mime_type: params.mimeType,
      file_size: params.fileSize,
      file_hash: params.fileHash,
      received_at: new Date().toISOString(),
      status: "error",
      processing_error: message,
      extraction_method: "none",
      processed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError) {
    logImportStage("intake-fallback-insert-failed", { code: insertError.code });
    try {
      await supabase.storage.from(IMPORTS_BUCKET).remove([params.storagePath]);
    } catch {
      // best-effort — nie maskuj oryginalnego błędu niepowodzeniem sprzątania
    }
    throw new Error("Nie udało się zapisać danych importu. Spróbuj przesłać plik ponownie.");
  }

  revalidatePath("/lab/szkola/import");
  return { inboxItemId: inboxItem.id as string, detectedType: null, confidence: 0, duplicates: [], sessionMatch: null };
}

export async function createImportFromUpload(formData: FormData) {
  const userId = await requireUserId();
  const storagePath = String(formData.get("storage_path") ?? "").trim();
  const mimeType = String(formData.get("mime_type") ?? "").trim();
  const originalFilename = optionalString(formData, "original_filename");
  const fileSize = Number(formData.get("file_size") ?? 0) || null;
  if (!storagePath) throw new Error("Brak przesłanego pliku.");

  logImportStage("upload-intake-start", { mimeType });

  const supabase = await createClient();
  const { data: blob, error: downloadError } = await supabase.storage.from(IMPORTS_BUCKET).download(storagePath);
  if (downloadError) {
    logImportStage("storage-download-failed");
    throw new Error("Plik został przesłany, ale nie udało się go odczytać z magazynu. Spróbuj ponownie.");
  }
  logImportStage("storage-download-success");

  const buffer = Buffer.from(await blob.arrayBuffer());
  const fileHash = hashFileBuffer(buffer);
  const source = mimeType === "message/rfc822" ? "eml" : "upload";

  // Od tego miejsca plik już bezpiecznie istnieje w Storage — każdy kolejny
  // błąd (parser, OCR, klasyfikacja, zapis do bazy) MUSI skończyć się
  // rekordem ze statusem "error" (patrz recordFailedImport), a nie
  // nieobsłużonym wyjątkiem, żeby plik nigdy nie został osierocony bez śladu.
  // Sam OCR nie rzuca tutaj — extractTextWithOcrFallback już łapie własne
  // błędy (sekcja 12) i zwraca ocrStatus="failed" zamiast wyjątku, ten
  // zewnętrzny try/catch to wyłącznie ostatnia linia obrony na WSZYSTKO inne.
  try {
    const outcome: ExtractionOutcome = await extractTextWithOcrFallback(mimeType, buffer);
    const hasSourceFile = source === "upload" || source === "eml";

    return await runIntakePipeline({
      userId,
      source,
      originalFilename,
      storagePath,
      mimeType,
      fileSize,
      fileHash,
      senderName: outcome.senderName,
      subject: outcome.subject,
      receivedAt: outcome.receivedAt,
      text: outcome.text,
      extractionMethod: outcome.extractionMethod,
      ocrStatus: outcome.ocrStatus,
      ocrConfidence: outcome.ocrConfidence,
      ocrPagesProcessed: outcome.ocrPagesProcessed,
      ocrWarnings: outcome.ocrWarnings,
      processingStage: outcome.processingStage,
      processingNote: buildProcessingNote(outcome, hasSourceFile),
    });
  } catch (err) {
    return recordFailedImport({ userId, source, originalFilename, storagePath, mimeType, fileSize, fileHash, err });
  }
}

export async function createImportFromPastedEmail(formData: FormData) {
  const userId = await requireUserId();
  const senderName = optionalString(formData, "sender_name");
  const subject = optionalString(formData, "subject");
  const receivedAt = optionalString(formData, "received_at");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Treść wiadomości jest wymagana.");

  logImportStage("pasted-email-intake-start");

  try {
    return await runIntakePipeline({
      userId,
      source: "pasted_email",
      originalFilename: null,
      storagePath: null,
      mimeType: "text/plain",
      fileSize: body.length,
      fileHash: null,
      senderName,
      subject,
      receivedAt: receivedAt ? new Date(receivedAt).toISOString() : null,
      text: [subject, body].filter(Boolean).join("\n\n"),
      // Wklejony tekst — nie ma koncepcji OCR/warstwy tekstowej, użytkownik
      // dostarczył treść wprost.
      extractionMethod: "manual",
      ocrStatus: "not_needed",
      ocrConfidence: null,
      ocrPagesProcessed: null,
      ocrWarnings: [],
      processingStage: "analyzing",
      processingNote: null,
    });
  } catch (err) {
    // Brak pliku w Storage do posprzątania (wklejony tekst), więc nie ma
    // czego "osierocić" — ale nadal nie chcemy, żeby wyjątek uciekł
    // nieobsłużony do poziomu Server Action (ta sama zasada co przy uploadzie).
    logImportStage("pasted-email-intake-failed");
    throw new Error(safeErrorMessage(err, "Nie udało się zapisać wiadomości."));
  }
}

/**
 * Rdzeń "Przetwórz ponownie" / "Spróbuj OCR" (sekcja 11 briefu) — jedna
 * wspólna implementacja, tylko forceOcr różni te dwie akcje. Aktualizuje
 * ISTNIEJĄCY rekord (żaden nowy wiersz, żadna nowa kopia pliku).
 *
 * Bez forceOcr: jeśli rekord ma już raw_text, ponowna klasyfikacja działa na
 * nim bez ponownego pobierania pliku (szybkie — przydatne po zmianie reguł
 * klasyfikatora). Z forceOcr: zawsze pobiera plik na nowo i wymusza OCR,
 * niezależnie od tego, czy zwykły parser już coś znalazł.
 */
async function reprocessInboxItem(
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
    const { data: blob, error: downloadError } = await supabase.storage.from(IMPORTS_BUCKET).download(item.storage_path);
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
    const { data: blob, error: downloadError } = await supabase.storage.from(IMPORTS_BUCKET).download(item.storage_path);
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

  await supabase
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
    .eq("id", inboxItemId);

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

/** Ponawia klasyfikację/ekstrakcję dla istniejącego elementu skrzynki (sekcja 3: "processing" nie może być stanem bez wyjścia). */
export async function reprocessImport(formData: FormData) {
  const userId = await requireUserId();
  const inboxItemId = String(formData.get("id") ?? "");
  if (!inboxItemId) throw new Error("Brak identyfikatora elementu.");

  const supabase = await createClient();
  logImportStage("reprocess-start", { inboxItemId });
  await supabase.from("import_inbox_items").update({ status: "processing" }).eq("id", inboxItemId);

  try {
    await reprocessInboxItem(supabase, userId, inboxItemId, { forceOcr: false });
  } catch (err) {
    const message = safeErrorMessage(err, "Nie udało się przetworzyć ponownie.");
    logImportStage("reprocess-failed", { inboxItemId });
    await supabase
      .from("import_inbox_items")
      .update({ status: "error", processing_error: message, updated_at: new Date().toISOString() })
      .eq("id", inboxItemId);
    throw new Error(message);
  }

  logImportStage("reprocess-done", { inboxItemId });
  revalidatePath("/lab/szkola/import");
  revalidatePath(`/lab/szkola/import/${inboxItemId}`);
}

/**
 * "Spróbuj OCR" (sekcja 11 briefu) — dostępne, gdy zwykłe odczytanie nie
 * znalazło tekstu, poprzedni OCR się nie udał, albo użytkownik chce ponowić
 * mimo wszystko. Zawsze wymusza OCR (forceOcr: true), niezależnie od tego,
 * co wcześniej znalazł zwykły parser. Nie tworzy nowego rekordu ani nowej
 * kopii pliku — aktualizuje istniejący import.
 */
export async function tryOcr(formData: FormData) {
  const userId = await requireUserId();
  const inboxItemId = String(formData.get("id") ?? "");
  if (!inboxItemId) throw new Error("Brak identyfikatora elementu.");

  const supabase = await createClient();
  logImportStage("manual-ocr-start", { inboxItemId });
  await supabase.from("import_inbox_items").update({ status: "processing", ocr_status: "processing" }).eq("id", inboxItemId);

  try {
    await reprocessInboxItem(supabase, userId, inboxItemId, { forceOcr: true });
  } catch (err) {
    const message = safeErrorMessage(
      err,
      "Nie udało się odczytać dokumentu automatycznie. Plik został bezpiecznie zapisany. Możesz uzupełnić dane ręcznie lub ponowić OCR.",
    );
    logImportStage("manual-ocr-failed", { inboxItemId });
    await supabase
      .from("import_inbox_items")
      .update({
        status: "error",
        ocr_status: "failed",
        processing_stage: "ocr_error",
        processing_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inboxItemId);
    throw new Error(message);
  }

  logImportStage("manual-ocr-done", { inboxItemId });
  revalidatePath("/lab/szkola/import");
  revalidatePath(`/lab/szkola/import/${inboxItemId}`);
}

export async function updateImportFields(formData: FormData) {
  await requireUserId();
  const supabase = await createClient();

  const inboxItemId = String(formData.get("inbox_item_id") ?? "");
  const reservationId = String(formData.get("reservation_id") ?? "");
  if (!inboxItemId || !reservationId) throw new Error("Brak identyfikatora importu.");

  const reservationType = String(formData.get("reservation_type") ?? "other") as ImportDetectedType;
  if (!IMPORT_DETECTED_TYPES.includes(reservationType)) throw new Error("Nieprawidłowy typ dokumentu.");

  const sessionId = optionalString(formData, "session_id");

  const { error: reservationErrorUpdate } = await supabase
    .from("imported_reservations")
    .update({
      session_id: sessionId,
      reservation_type: reservationType,
      provider: optionalString(formData, "provider"),
      booking_reference: optionalString(formData, "booking_reference"),
      origin: optionalString(formData, "origin"),
      destination: optionalString(formData, "destination"),
      start_at: optionalString(formData, "start_at"),
      end_at: optionalString(formData, "end_at"),
      check_in: optionalString(formData, "check_in"),
      check_out: optionalString(formData, "check_out"),
      amount: parseOptionalAmount(formData, "amount"),
      currency: parseOptionalCurrency(formData),
      payment_status: optionalString(formData, "payment_status"),
      passenger_name: optionalString(formData, "passenger_name"),
      baggage: optionalString(formData, "baggage"),
      seat: optionalString(formData, "seat"),
      cancellation_deadline: optionalString(formData, "cancellation_deadline"),
      status: "ready",
      updated_at: new Date().toISOString(),
    })
    .eq("id", reservationId);
  if (reservationErrorUpdate) throw new Error(reservationErrorUpdate.message);

  const { error: inboxErrorUpdate } = await supabase
    .from("import_inbox_items")
    .update({
      detected_type: reservationType,
      proposed_session_id: sessionId,
      status: "ready",
      updated_at: new Date().toISOString(),
    })
    .eq("id", inboxItemId);
  if (inboxErrorUpdate) throw new Error(inboxErrorUpdate.message);

  revalidatePath("/lab/szkola/import");
  revalidatePath(`/lab/szkola/import/${inboxItemId}`);
}

export async function rejectImport(formData: FormData) {
  await requireUserId();
  const supabase = await createClient();
  const inboxItemId = String(formData.get("inbox_item_id") ?? "");
  const reason = optionalString(formData, "reason");
  if (!inboxItemId) throw new Error("Brak identyfikatora importu.");

  const { error: inboxErr } = await supabase
    .from("import_inbox_items")
    .update({ status: "rejected", notes: reason, updated_at: new Date().toISOString() })
    .eq("id", inboxItemId);
  if (inboxErr) throw new Error(inboxErr.message);

  await supabase
    .from("imported_reservations")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("inbox_item_id", inboxItemId);

  revalidatePath("/lab/szkola/import");
}

/** Sekcja 12: "Połącz" (nie twórz nowego rekordu, oznacz jako powiązany z istniejącym) / "Utwórz mimo to". */
export async function resolveDuplicate(formData: FormData) {
  await requireUserId();
  const supabase = await createClient();
  const inboxItemId = String(formData.get("inbox_item_id") ?? "");
  const action = String(formData.get("action") ?? "");

  if (action === "link") {
    await supabase
      .from("import_inbox_items")
      .update({ status: "assigned", notes: "Połączono z istniejącą rezerwacją.", updated_at: new Date().toISOString() })
      .eq("id", inboxItemId);
    await supabase
      .from("imported_reservations")
      .update({ status: "assigned", updated_at: new Date().toISOString() })
      .eq("inbox_item_id", inboxItemId);
  } else if (action === "create_anyway") {
    await supabase
      .from("import_inbox_items")
      .update({ status: "ready", updated_at: new Date().toISOString() })
      .eq("id", inboxItemId);
    await supabase
      .from("imported_reservations")
      .update({ status: "ready", updated_at: new Date().toISOString() })
      .eq("inbox_item_id", inboxItemId);
  } else if (action === "reject") {
    await rejectImport(formData);
    return;
  }

  revalidatePath("/lab/szkola/import");
}

async function moveImportFileToDocuments(
  supabase: SupabaseClient,
  storagePath: string,
  userId: string,
  sessionId: string,
  filename: string,
): Promise<string> {
  const { data: blob, error: downloadError } = await supabase.storage.from(IMPORTS_BUCKET).download(storagePath);
  if (downloadError) throw new Error(downloadError.message);

  const destinationPath = `${userId}/${sessionId}/documents/${Date.now()}-${sanitizeStorageFilename(filename)}`;
  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(destinationPath, blob, { contentType: blob.type || "application/octet-stream" });
  if (uploadError) throw new Error(uploadError.message);

  return destinationPath;
}

/**
 * Zatwierdzenie: tworzy właściwy rekord docelowy (sekcja 11). Supabase-js nie
 * obsługuje transakcji rozpiętych na wielu tabelach z poziomu klienta — więc
 * zamiast prawdziwego BEGIN/COMMIT stosujemy sekwencyjne tworzenie z
 * kompensacyjnym czyszczeniem przy błędzie (usuwamy to, co już powstało),
 * żeby nigdy nie zostawić połowicznie utworzonych danych.
 */
export async function approveImport(formData: FormData) {
  const userId = await requireUserId();
  const supabase = await createClient();

  const inboxItemId = String(formData.get("inbox_item_id") ?? "");
  const reservationId = String(formData.get("reservation_id") ?? "");
  if (!inboxItemId || !reservationId) throw new Error("Brak identyfikatora importu.");

  const { data: reservation, error: reservationError } = await supabase
    .from("imported_reservations")
    .select("*")
    .eq("id", reservationId)
    .single();
  if (reservationError) throw new Error(reservationError.message);
  if (!reservation.session_id) throw new Error("Najpierw przypisz import do zjazdu.");

  const { data: inboxItem, error: inboxError } = await supabase
    .from("import_inbox_items")
    .select("*")
    .eq("id", inboxItemId)
    .single();
  if (inboxError) throw new Error(inboxError.message);

  const sessionId = reservation.session_id as string;
  const created: { table: string; id: string }[] = [];

  const cleanup = async () => {
    for (const record of created.reverse()) {
      await supabase.from(record.table).delete().eq("id", record.id);
    }
  };

  try {
    let documentStoragePath: string | null = null;
    if (inboxItem.storage_path) {
      documentStoragePath = await moveImportFileToDocuments(
        supabase,
        inboxItem.storage_path,
        userId,
        sessionId,
        inboxItem.original_filename ?? "dokument",
      );
    }

    const reservationType = reservation.reservation_type as ImportDetectedType;

    if (reservationType === "flight" || reservationType === "train" || reservationType === "bus") {
      const itineraryId = await getOrCreateItinerary(supabase, sessionId);
      const segmentType = reservationType === "flight" ? "samolot" : reservationType === "train" ? "pociag" : "autobus";
      const { data: segment, error: segmentError } = await supabase
        .from("travel_segments")
        .insert({
          itinerary_id: itineraryId,
          segment_type: segmentType,
          departure_place: reservation.origin,
          arrival_place: reservation.destination,
          departure_date: reservation.start_at ? String(reservation.start_at).slice(0, 10) : null,
          departure_time: reservation.start_at ? String(reservation.start_at).slice(11, 16) : null,
          reservation_number: reservation.booking_reference,
          seat: reservation.seat,
          baggage: reservation.baggage,
          price: reservation.amount,
          currency: reservation.currency,
          status: "zarezerwowane",
          sort_order: 0,
        })
        .select("id")
        .single();
      if (segmentError) throw new Error(segmentError.message);
      created.push({ table: "travel_segments", id: segment.id });
    }

    if (reservationType === "hotel") {
      const { data: accommodation, error: accommodationError } = await supabase
        .from("accommodations")
        .insert({
          session_id: sessionId,
          name: (reservation.parsed_data as ExtractedReservationFields["extra"])?.hotel_name || "Nocleg z importu",
          check_in: reservation.check_in,
          check_out: reservation.check_out,
          price: reservation.amount,
          currency: reservation.currency,
          payment_status: "zarezerwowane",
          reservation_number: reservation.booking_reference,
          free_cancellation_until: reservation.cancellation_deadline
            ? String(reservation.cancellation_deadline).slice(0, 10)
            : null,
          breakfast_included: Boolean((reservation.parsed_data as ExtractedReservationFields["extra"])?.breakfast_included),
        })
        .select("id")
        .single();
      if (accommodationError) throw new Error(accommodationError.message);
      created.push({ table: "accommodations", id: accommodation.id });
    }

    if (reservationType === "school_payment") {
      const { data: payment, error: paymentError } = await supabase
        .from("school_payments")
        .insert({
          session_id: sessionId,
          category: "oplata_za_zjazd",
          amount: reservation.amount ?? 0,
          currency: reservation.currency ?? "PLN",
          paid_date: reservation.start_at ? String(reservation.start_at).slice(0, 10) : null,
          status: "oplacone",
          document_number: reservation.booking_reference,
        })
        .select("id")
        .single();
      if (paymentError) throw new Error(paymentError.message);
      created.push({ table: "school_payments", id: payment.id });
    }

    if (reservationType === "invoice" || reservationType === "receipt") {
      const { data: expense, error: expenseError } = await supabase
        .from("expenses")
        .insert({
          session_id: sessionId,
          name: reservationType === "invoice" ? "Faktura z importu" : "Paragon z importu",
          category: "inne",
          amount: reservation.amount ?? 0,
          currency: reservation.currency ?? "PLN",
          expense_date: reservation.start_at ? String(reservation.start_at).slice(0, 10) : null,
          status: "oplacony",
          document_number: reservation.booking_reference,
          has_invoice: reservationType === "invoice",
        })
        .select("id")
        .single();
      if (expenseError) throw new Error(expenseError.message);
      created.push({ table: "expenses", id: expense.id });
    }

    if (documentStoragePath) {
      const { data: document, error: documentError } = await supabase
        .from("session_documents")
        .insert({
          session_id: sessionId,
          name: inboxItem.original_filename ?? "Dokument z importu",
          title: inboxItem.original_filename ?? "Dokument z importu",
          doc_type: DOCUMENT_TYPE_BY_DETECTED_TYPE[reservationType],
          document_date: reservation.start_at ? String(reservation.start_at).slice(0, 10) : null,
          storage_path: documentStoragePath,
          mime_type: inboxItem.mime_type,
          file_size: inboxItem.file_size,
        })
        .select("id")
        .single();
      if (documentError) throw new Error(documentError.message);
      created.push({ table: "session_documents", id: document.id });
    }

    await supabase
      .from("imported_reservations")
      .update({ status: "assigned", approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", reservationId);
    await supabase
      .from("import_inbox_items")
      .update({ status: "assigned", updated_at: new Date().toISOString() })
      .eq("id", inboxItemId);
  } catch (err) {
    await cleanup();
    const message = err instanceof Error ? err.message : "Nie udało się zatwierdzić importu.";
    await supabase
      .from("import_inbox_items")
      .update({ status: "error", processing_error: message, updated_at: new Date().toISOString() })
      .eq("id", inboxItemId);
    throw new Error(message);
  }

  revalidatePath("/lab/szkola/import");
  revalidatePath("/lab/szkola");
  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
}

/**
 * "Zapisz jako dokument" (sekcja 10) — lżejszy wariant zatwierdzenia: zapisuje
 * tylko session_document (bez travel_segment/accommodation/school_payment/
 * expense), np. dla dokumentów, które są ważne jako plik, ale nie wymagają
 * osobnego rekordu w budżecie/podróży.
 */
export async function approveAsDocumentOnly(formData: FormData) {
  const userId = await requireUserId();
  const supabase = await createClient();

  const inboxItemId = String(formData.get("inbox_item_id") ?? "");
  const reservationId = String(formData.get("reservation_id") ?? "");
  if (!inboxItemId || !reservationId) throw new Error("Brak identyfikatora importu.");

  const { data: reservation, error: reservationError } = await supabase
    .from("imported_reservations")
    .select("*")
    .eq("id", reservationId)
    .single();
  if (reservationError) throw new Error(reservationError.message);
  if (!reservation.session_id) throw new Error("Najpierw przypisz import do zjazdu.");

  const { data: inboxItem, error: inboxError } = await supabase
    .from("import_inbox_items")
    .select("*")
    .eq("id", inboxItemId)
    .single();
  if (inboxError) throw new Error(inboxError.message);

  const sessionId = reservation.session_id as string;

  try {
    if (!inboxItem.storage_path) {
      throw new Error("Ten import nie ma pliku do zapisania jako dokument.");
    }
    const documentStoragePath = await moveImportFileToDocuments(
      supabase,
      inboxItem.storage_path,
      userId,
      sessionId,
      inboxItem.original_filename ?? "dokument",
    );

    const { error: documentError } = await supabase.from("session_documents").insert({
      session_id: sessionId,
      name: inboxItem.original_filename ?? "Dokument z importu",
      title: inboxItem.original_filename ?? "Dokument z importu",
      doc_type: DOCUMENT_TYPE_BY_DETECTED_TYPE[(reservation.reservation_type as ImportDetectedType) ?? "other"],
      document_date: reservation.start_at ? String(reservation.start_at).slice(0, 10) : null,
      storage_path: documentStoragePath,
      mime_type: inboxItem.mime_type,
      file_size: inboxItem.file_size,
    });
    if (documentError) throw new Error(documentError.message);

    await supabase
      .from("imported_reservations")
      .update({ status: "assigned", approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", reservationId);
    await supabase
      .from("import_inbox_items")
      .update({ status: "assigned", updated_at: new Date().toISOString() })
      .eq("id", inboxItemId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nie udało się zapisać dokumentu.";
    await supabase
      .from("import_inbox_items")
      .update({ status: "error", processing_error: message, updated_at: new Date().toISOString() })
      .eq("id", inboxItemId);
    throw new Error(message);
  }

  revalidatePath("/lab/szkola/import");
  revalidatePath("/lab/szkola");
  revalidatePath(`/lab/szkola/zjazdy/${sessionId}`);
}
