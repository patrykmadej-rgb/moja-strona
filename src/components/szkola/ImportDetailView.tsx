"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { AlertTriangle, CheckCircle2, ExternalLink, FileText, Loader2 } from "lucide-react";
import {
  approveAsDocumentOnly,
  approveImport,
  rejectImport,
  reprocessImport,
  resolveDuplicate,
  tryOcr,
  updateImportFields,
} from "@/app/lab/szkola/import/actions";
import { getImportDownloadUrl } from "@/lib/szkola/importStorage";
import { formatBytes, formatDateTime } from "@/lib/lab/format";
import type { DuplicateMatch } from "@/lib/szkola/importDuplicates";
import {
  CURRENCIES,
  IMPORT_DETECTED_TYPE_LABELS,
  IMPORT_DETECTED_TYPES,
  IMPORT_STATUS_LABELS,
  PROCESSING_STAGE_LABELS,
  type ImportInboxItem,
  type ImportedReservation,
  type ProcessingStage,
  type SchoolSession,
} from "@/lib/szkola/types";

// Powielone celowo (nie importowane z @/lib/szkola/import/ocr — ten moduł ma
// "server-only" na górze i wysadziłby ten Client Component). Ta sama lista
// co ALLOWED_IMPORT_MIME_TYPES minus DOCX/TXT/EML, dla których OCR nie ma
// zastosowania.
const OCR_ELIGIBLE_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

const inputClass =
  "h-9 w-full rounded-[10px] border border-[#e8e2ec] bg-white px-3 text-sm text-[#201a2b] outline-none focus:border-[#5b2a86]";
const labelClass = "text-xs font-medium text-[#201a2b]";

function SubmitButton({ label, pendingLabel, className }: { label: string; pendingLabel: string; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : null}
      {pending ? pendingLabel : label}
    </button>
  );
}

function toDateTimeLocal(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}
function toDateOnly(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function ImportDetailView({
  item,
  reservation,
  sessions,
  duplicates,
}: {
  item: ImportInboxItem;
  reservation: ImportedReservation | null;
  sessions: SchoolSession[];
  duplicates: DuplicateMatch[];
}) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [isRunningOcr, setIsRunningOcr] = useState(false);
  const isImage = item.mime_type?.startsWith("image/");

  useEffect(() => {
    if (isImage && item.storage_path) {
      getImportDownloadUrl(item.storage_path).then(setPreviewUrl).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.storage_path]);

  const handleOpenFile = async () => {
    setError(null);
    try {
      if (!item.storage_path) return;
      const url = await getImportDownloadUrl(item.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się otworzyć pliku.");
    }
  };

  const handleReprocess = async () => {
    setError(null);
    setIsReprocessing(true);
    const formData = new FormData();
    formData.set("id", item.id);
    try {
      await reprocessImport(formData);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się przetworzyć ponownie.");
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleTryOcr = async () => {
    setError(null);
    setIsRunningOcr(true);
    const formData = new FormData();
    formData.set("id", item.id);
    try {
      await tryOcr(formData);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się odczytać dokumentu automatycznie. Plik został bezpiecznie zapisany. Możesz uzupełnić dane ręcznie lub ponowić OCR.",
      );
    } finally {
      setIsRunningOcr(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt("Powód odrzucenia (opcjonalnie):") ?? "";
    setError(null);
    const formData = new FormData();
    formData.set("inbox_item_id", item.id);
    formData.set("reason", reason);
    try {
      await rejectImport(formData);
      router.push("/lab/szkola/import");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się odrzucić importu.");
    }
  };

  const isLowConfidence = (item.confidence_score ?? 0) < 0.35;
  const isFinal = item.status === "assigned" || item.status === "rejected";
  // Sekcja 11 briefu: dostępne, gdy zwykłe odczytanie nie znalazło tekstu,
  // poprzedni OCR się nie udał, albo użytkownik chce ponowić — czyli zawsze,
  // dopóki plik nadaje się do OCR i import nie jest już zamknięty.
  const canTryOcr = !isFinal && Boolean(item.storage_path) && OCR_ELIGIBLE_MIME_TYPES.has(item.mime_type ?? "");
  const wasOcrUsed = item.extraction_method === "ocr";

  return (
    <div className="grid grid-cols-1 gap-5 min-[900px]:grid-cols-[minmax(0,1fr)_360px] min-[900px]:items-start">
      {/* LEWA KOLUMNA */}
      <div className="flex min-w-0 flex-col gap-5">
        <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <h2 className="text-sm font-semibold text-[#201a2b]">Podgląd</h2>

          {item.storage_path ? (
            <div className="mt-3">
              {isImage && previewUrl ? (
                <button type="button" onClick={handleOpenFile} className="block overflow-hidden rounded-[10px] border border-[#e8e2ec]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniatura z signed URL, poza optymalizacją next/image */}
                  <img src={previewUrl} alt="" className="max-h-[360px] w-full object-contain" />
                </button>
              ) : (
                <div className="flex items-center gap-3 rounded-[10px] border border-dashed border-[#d9cde5] bg-[#f7f4ef] p-4">
                  <FileText className="h-6 w-6 text-[#5b2a86]" strokeWidth={1.75} />
                  <span className="text-sm text-[#4f4758]">{item.original_filename ?? "Plik"}</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleOpenFile}
                className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[#5b2a86] hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
                Otwórz plik
              </button>
            </div>
          ) : (
            <div className="mt-3 max-h-[360px] overflow-y-auto whitespace-pre-wrap rounded-[10px] border border-[#e8e2ec] bg-[#f7f4ef] p-4 text-sm text-[#4f4758]">
              {item.raw_text || "Brak treści."}
            </div>
          )}

          {/* Sekcja 15 briefu: subtelna informacja o OCR, bez surowych logów technicznych. */}
          {wasOcrUsed && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-[#706878]">
              <span className="rounded-full bg-[#f1eafd] px-2.5 py-1 font-medium text-[#5b2a86]">
                Treść odczytana za pomocą OCR
              </span>
              {item.ocr_pages_processed != null && (
                <span>
                  {item.ocr_pages_processed} {item.ocr_pages_processed === 1 ? "strona" : "stron"}
                </span>
              )}
              {item.ocr_confidence != null && <span>· pewność {Math.round(item.ocr_confidence)}%</span>}
            </div>
          )}
        </section>

        <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-6 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <h2 className="text-sm font-semibold text-[#201a2b]">Oryginalne dane</h2>
          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm min-[480px]:grid-cols-2">
            <div>
              <dt className="text-xs text-[#9a919f]">Nadawca</dt>
              <dd className="text-[#201a2b]">{item.sender_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#9a919f]">Temat</dt>
              <dd className="text-[#201a2b]">{item.raw_email_subject ?? item.original_filename ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#9a919f]">Otrzymano</dt>
              <dd className="text-[#201a2b]">{formatDateTime(item.received_at)}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#9a919f]">Rozmiar / typ</dt>
              <dd className="text-[#201a2b]">
                {[item.file_size ? formatBytes(item.file_size) : null, item.mime_type].filter(Boolean).join(" · ") || "—"}
              </dd>
            </div>
          </dl>
          {item.processing_error && (
            <p className={`mt-3 text-xs ${item.status === "error" ? "text-red-600" : "text-amber-700"}`}>
              {item.processing_error}
            </p>
          )}
          {item.processing_stage && (
            <p className="mt-2 text-xs text-[#9a919f]">
              Etap: {PROCESSING_STAGE_LABELS[item.processing_stage as ProcessingStage] ?? item.processing_stage}
            </p>
          )}
        </section>
      </div>

      {/* PRAWA KOLUMNA */}
      <div className="flex min-w-0 flex-col gap-5">
        <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-[#f1eafd] px-2.5 py-1 text-xs font-medium text-[#5b2a86]">
              {item.detected_type ? IMPORT_DETECTED_TYPE_LABELS[item.detected_type] : "Nierozpoznano"}
            </span>
            <span className="text-xs text-[#9a919f]">{IMPORT_STATUS_LABELS[item.status]}</span>
          </div>
          {item.confidence_score != null && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-[#706878]">
                <span>Pewność rozpoznania</span>
                <span>{Math.round(item.confidence_score * 100)}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#f1eafd]">
                <div
                  className={isLowConfidence ? "h-full rounded-full bg-amber-500" : "h-full rounded-full bg-[#5b2a86]"}
                  style={{ width: `${Math.round(item.confidence_score * 100)}%` }}
                />
              </div>
            </div>
          )}
          {isLowConfidence && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
              Niska pewność — sprawdź i popraw dane przed zatwierdzeniem.
            </p>
          )}
        </section>

        {duplicates.length > 0 && (
          <section className="rounded-[16px] border border-amber-200 bg-amber-50 p-5">
            <p className="flex items-center gap-1.5 text-sm font-medium text-amber-900">
              <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
              Ta rezerwacja może już istnieć
            </p>
            <ul className="mt-2 space-y-1 text-xs text-amber-800">
              {duplicates.map((d) => (
                <li key={d.id}>{d.summary}</li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["link", "Połącz"],
                  ["create_anyway", "Utwórz mimo to"],
                  ["reject", "Odrzuć"],
                ] as const
              ).map(([action, label]) => (
                <form
                  key={action}
                  action={async (formData) => {
                    setError(null);
                    try {
                      await resolveDuplicate(formData);
                      router.refresh();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Nie udało się rozwiązać duplikatu.");
                    }
                  }}
                >
                  <input type="hidden" name="inbox_item_id" value={item.id} />
                  <input type="hidden" name="action" value={action} />
                  <button
                    type="submit"
                    className="rounded-[9px] border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
                  >
                    {label}
                  </button>
                </form>
              ))}
            </div>
          </section>
        )}

        {reservation && !isFinal && (
          <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
            <h2 className="text-sm font-semibold text-[#201a2b]">Rozpoznane dane</h2>
            <form
              action={async (formData) => {
                setError(null);
                try {
                  await updateImportFields(formData);
                  router.refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Nie udało się zapisać zmian.");
                }
              }}
              className="mt-3 flex flex-col gap-2.5"
            >
              <input type="hidden" name="inbox_item_id" value={item.id} />
              <input type="hidden" name="reservation_id" value={reservation.id} />

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Typ dokumentu</label>
                <select name="reservation_type" defaultValue={reservation.reservation_type} className={inputClass}>
                  {IMPORT_DETECTED_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {IMPORT_DETECTED_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Zjazd</label>
                <select name="session_id" defaultValue={reservation.session_id ?? ""} className={inputClass}>
                  <option value="">Nie przypisano</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Przewoźnik / obiekt</label>
                  <input name="provider" defaultValue={reservation.provider ?? ""} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Nr rezerwacji</label>
                  <input name="booking_reference" defaultValue={reservation.booking_reference ?? ""} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Skąd</label>
                  <input name="origin" defaultValue={reservation.origin ?? ""} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Dokąd</label>
                  <input name="destination" defaultValue={reservation.destination ?? ""} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Początek</label>
                  <input type="datetime-local" name="start_at" defaultValue={toDateTimeLocal(reservation.start_at)} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Koniec</label>
                  <input type="datetime-local" name="end_at" defaultValue={toDateTimeLocal(reservation.end_at)} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Check-in</label>
                  <input type="date" name="check_in" defaultValue={toDateOnly(reservation.check_in)} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Check-out</label>
                  <input type="date" name="check_out" defaultValue={toDateOnly(reservation.check_out)} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Kwota</label>
                  <input type="number" step="0.01" name="amount" defaultValue={reservation.amount ?? ""} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Waluta</label>
                  <select name="currency" defaultValue={reservation.currency ?? ""} className={inputClass}>
                    <option value="">—</option>
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Pasażer</label>
                  <input name="passenger_name" defaultValue={reservation.passenger_name ?? ""} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Miejsce</label>
                  <input name="seat" defaultValue={reservation.seat ?? ""} className={inputClass} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Termin bezpłatnego anulowania</label>
                <input
                  type="datetime-local"
                  name="cancellation_deadline"
                  defaultValue={toDateTimeLocal(reservation.cancellation_deadline)}
                  className={inputClass}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <SubmitButton
                label="Zapisz zmiany"
                pendingLabel="Zapisywanie…"
                className="mt-1 self-start rounded-[10px] border border-[#e8e2ec] px-4 py-2 text-sm text-[#5b2a86] hover:border-[#d9cde5] hover:bg-[#f1eafd] disabled:opacity-50"
              />
            </form>
          </section>
        )}

        {!isFinal && (
          <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
            <h2 className="text-sm font-semibold text-[#201a2b]">Akcje</h2>
            <div className="mt-3 flex flex-col gap-2">
              {/* Zatwierdzenie wymaga istniejącej rozpoznanej rezerwacji — przy
                  całkowitej awarii pipeline'u (patrz recordFailedImport w
                  actions.ts) jej może nie być, ale reprocess/OCR/odrzucenie
                  poniżej działają zawsze, żeby użytkownik nigdy nie utknął
                  bez żadnej akcji na zepsutym imporcie. */}
              {reservation && (
                <form
                  action={async (formData) => {
                    setError(null);
                    try {
                      await approveImport(formData);
                      router.push("/lab/szkola/import");
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Nie udało się zatwierdzić.");
                    }
                  }}
                >
                  <input type="hidden" name="inbox_item_id" value={item.id} />
                  <input type="hidden" name="reservation_id" value={reservation.id} />
                  <SubmitButton
                    label="Zatwierdź i utwórz"
                    pendingLabel="Zatwierdzanie…"
                    className="flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-4 py-2 text-sm font-medium text-white hover:bg-[#32134f] disabled:opacity-50"
                  />
                </form>
              )}

              {item.storage_path && reservation && (
                <form
                  action={async (formData) => {
                    setError(null);
                    try {
                      await approveAsDocumentOnly(formData);
                      router.push("/lab/szkola/import");
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Nie udało się zapisać dokumentu.");
                    }
                  }}
                >
                  <input type="hidden" name="inbox_item_id" value={item.id} />
                  <input type="hidden" name="reservation_id" value={reservation.id} />
                  <SubmitButton
                    label="Zapisz jako dokument"
                    pendingLabel="Zapisywanie…"
                    className="flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-4 py-2 text-sm text-[#5b2a86] hover:border-[#d9cde5] hover:bg-[#f1eafd] disabled:opacity-50"
                  />
                </form>
              )}

              {canTryOcr && (
                <button
                  type="button"
                  onClick={handleTryOcr}
                  disabled={isRunningOcr || isReprocessing}
                  className="flex items-center justify-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-4 py-2 text-sm text-[#5b2a86] hover:border-[#d9cde5] hover:bg-[#f1eafd] disabled:opacity-50"
                >
                  {isRunningOcr ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : null}
                  {isRunningOcr ? "Rozpoznawanie…" : wasOcrUsed ? "Ponów OCR" : "Spróbuj OCR"}
                </button>
              )}

              <button
                type="button"
                onClick={handleReprocess}
                disabled={isReprocessing || isRunningOcr}
                className="flex items-center justify-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-4 py-2 text-sm text-[#706878] hover:border-[#d9cde5] disabled:opacity-50"
              >
                {isReprocessing ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : null}
                {isReprocessing ? "Przetwarzanie…" : "Przetwórz ponownie"}
              </button>

              <button
                type="button"
                onClick={handleReject}
                className="flex items-center justify-center gap-1.5 rounded-[10px] border border-[#e8e2ec] px-4 py-2 text-sm text-red-600 hover:border-red-200 hover:bg-red-50"
              >
                Odrzuć
              </button>
            </div>
          </section>
        )}

        {isFinal && (
          <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-5 text-center shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
            <CheckCircle2
              className={item.status === "assigned" ? "mx-auto h-6 w-6 text-emerald-600" : "mx-auto h-6 w-6 text-[#9a919f]"}
              strokeWidth={1.75}
            />
            <p className="mt-2 text-sm font-medium text-[#201a2b]">
              {item.status === "assigned" ? "Ten import został przypisany." : "Ten import został odrzucony."}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
