"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Camera, Check, Loader2, Trash2, X } from "lucide-react";
import { createLibraryBook, type LibraryActionError } from "@/app/lab/biblioteka/actions";
import { OWNERSHIP_STATUS_LABELS, OWNERSHIP_STATUSES, type OwnershipStatus } from "@/lib/lab/library-types";

type ProposalStatus = "recognizing" | "ready" | "recognize_error" | "saving" | "saved" | "duplicate" | "save_error";

type PhotoProposal = {
  localId: string;
  file: File;
  previewUrl: string;
  status: ProposalStatus;
  selected: boolean;
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  year: string;
  ownershipStatus: OwnershipStatus;
  message: string | null;
  duplicates: NonNullable<LibraryActionError["duplicates"]> | null;
  rawTextPreview: string;
  textOpen: boolean;
};

let localIdCounter = 0;
function nextLocalId(): string {
  localIdCounter += 1;
  return `photo-${localIdCounter}-${Date.now()}`;
}

function bookCountLabel(count: number): string {
  if (count === 1) return "książkę";
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14)) return "książki";
  return "książek";
}

const smallInputClass =
  "w-full rounded-[8px] border border-[#e6deec] bg-white px-2.5 py-1.5 text-xs text-[#201a2b] outline-none focus:border-[#5b2a86] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5b2a86]/40";

/**
 * "Dodaj ze zdjęcia" (sekcja 6 briefu). Priorytet: solidne działanie dla
 * jednej książki — obsługa "kilku książek" jest zrealizowana jako kilka
 * ODDZIELNYCH ZDJĘĆ (każde = jedna propozycja do przeglądu), NIE jako
 * wykrywanie kilku okładek w jednym kadrze — ta druga funkcja wymagałaby
 * segmentacji obrazu, której obecna integracja (tesseract.js, patrz
 * library-ocr.ts) nie robi. To jest świadome, uczciwe ograniczenie.
 *
 * Zapis idzie WYŁĄCZNIE przez istniejącą server action createLibraryBook
 * (ta sama walidacja, wykrywanie duplikatów, RLS co w zwykłym dodawaniu) —
 * ten modal nigdy nie zapisuje bezpośrednio do Supabase i nigdy nie zapisuje
 * niczego bez jawnego zatwierdzenia użytkownika.
 */
export default function LibraryPhotoAddModal({
  initialOwnershipStatus = "owned",
  onClose,
  onDone,
}: {
  initialOwnershipStatus?: OwnershipStatus;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoProposal[]>([]);
  const [savingAll, setSavingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<PhotoProposal[]>([]);
  const headingId = useId();

  // Refy aktualizowane w efekcie (nie podczas renderu — mutacja ref.current
  // w trakcie renderu jest zabroniona przez React), żeby efekt czyszczący
  // poniżej mógł przy odmontowaniu odczytać NAJŚWIEŻSZĄ listę zdjęć mimo
  // pustej tablicy zależności (który uruchamia się tylko raz).
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    // Sprzątanie object URL-i podglądu przy zamknięciu modalu — inaczej
    // wyciekają aż do przeładowania strony (URL.createObjectURL trzyma
    // referencję do Blob w pamięci, dopóki nie zostanie jawnie zwolniony).
    return () => {
      for (const p of photosRef.current) URL.revokeObjectURL(p.previewUrl);
    };
  }, []);

  const updateProposal = (localId: string, patch: Partial<PhotoProposal>) => {
    setPhotos((prev) => prev.map((p) => (p.localId === localId ? { ...p, ...patch } : p)));
  };

  const recognizeOne = async (proposal: PhotoProposal) => {
    const formData = new FormData();
    formData.set("image", proposal.file);
    try {
      const res = await fetch("/api/lab/biblioteka/recognize", { method: "POST", body: formData });
      const json = (await res.json()) as {
        result?: { title: string | null; author: string | null; isbn: string | null; publisher: string | null; year: number | null; rawTextPreview: string };
        error?: string;
      };
      if (!res.ok || !json.result) {
        updateProposal(proposal.localId, { status: "recognize_error", message: json.error ?? "Nie udało się rozpoznać zdjęcia." });
        return;
      }
      const { result } = json;
      updateProposal(proposal.localId, {
        status: "ready",
        title: result.title ?? "",
        author: result.author ?? "",
        isbn: result.isbn ?? "",
        publisher: result.publisher ?? "",
        year: result.year ? String(result.year) : "",
        rawTextPreview: result.rawTextPreview,
        selected: Boolean(result.title && result.author),
      });
    } catch {
      updateProposal(proposal.localId, { status: "recognize_error", message: "Błąd połączenia z serwerem." });
    }
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newProposals: PhotoProposal[] = Array.from(files).map((file) => ({
      localId: nextLocalId(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "recognizing",
      selected: false,
      title: "",
      author: "",
      isbn: "",
      publisher: "",
      year: "",
      ownershipStatus: initialOwnershipStatus,
      message: null,
      duplicates: null,
      rawTextPreview: "",
      textOpen: false,
    }));
    setPhotos((prev) => [...prev, ...newProposals]);
    for (const proposal of newProposals) void recognizeOne(proposal);
  };

  const removeProposal = (localId: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.localId === localId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.localId !== localId);
    });
  };

  const saveOne = async (proposal: PhotoProposal, confirmDuplicate = false): Promise<boolean> => {
    if (!proposal.title.trim() || !proposal.author.trim()) {
      updateProposal(proposal.localId, { status: "save_error", message: "Uzupełnij tytuł i autora przed zapisem." });
      return false;
    }
    updateProposal(proposal.localId, { status: "saving", message: null });

    const formData = new FormData();
    formData.set("title", proposal.title.trim());
    formData.set("author", proposal.author.trim());
    formData.set("ownershipStatus", proposal.ownershipStatus);
    formData.set("readingStatus", "unread");
    if (proposal.isbn.trim()) formData.set("isbn", proposal.isbn.trim());
    if (proposal.publisher.trim()) formData.set("publisher", proposal.publisher.trim());
    if (proposal.year.trim()) formData.set("year", proposal.year.trim());
    if (confirmDuplicate) formData.set("confirmDuplicate", "true");

    const result = await createLibraryBook(formData);
    if (result?.error) {
      if (result.duplicates && result.duplicates.length > 0) {
        updateProposal(proposal.localId, { status: "duplicate", message: result.error, duplicates: result.duplicates });
      } else {
        updateProposal(proposal.localId, { status: "save_error", message: result.error });
      }
      return false;
    }
    updateProposal(proposal.localId, { status: "saved", message: null, selected: false, duplicates: null });
    return true;
  };

  const handleSaveSelected = async () => {
    const toSave = photos.filter((p) => p.selected && (p.status === "ready" || p.status === "save_error" || p.status === "duplicate"));
    if (toSave.length === 0 || savingAll) return;
    setSavingAll(true);
    let savedNow = 0;
    for (const proposal of toSave) {
      const ok = await saveOne(proposal);
      if (ok) savedNow += 1;
    }
    setSavingAll(false);
    if (savedNow > 0) {
      router.refresh();
      onDone(`Dodano ${savedNow} ${bookCountLabel(savedNow)} do biblioteki.`);
    }
  };

  const selectedCount = photos.filter((p) => p.selected && (p.status === "ready" || p.status === "save_error" || p.status === "duplicate")).length;
  const stillRecognizing = photos.some((p) => p.status === "recognizing");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <div className="flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-y-auto rounded-[16px] bg-white p-6 shadow-[0_20px_60px_rgba(30,15,45,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={headingId} className="font-[family-name:var(--font-cormorant)] text-[22px] font-semibold text-[#201a2b]">
              Dodaj ze zdjęcia
            </h2>
            <p className="mt-1 text-xs text-[#706878]">
              Rozpoznawanie jest automatyczne, ale zawsze przybliżone — sprawdź i popraw dane przed zapisaniem.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[#9a919f] transition-colors hover:bg-[#f7f4ef] hover:text-[#5b2a86]"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFilesSelected(e.target.files);
            e.target.value = "";
          }}
        />

        {photos.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-5 flex flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-[#d9cde5] bg-[#faf8fc] px-6 py-10 text-center transition-colors hover:border-[#5b2a86] hover:bg-[#f1eafd]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#5b2a86] shadow-[0_4px_12px_rgba(91,42,134,0.15)]">
              <Camera className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-[#201a2b]">Zrób zdjęcie okładki lub wybierz z galerii</span>
            <span className="text-xs text-[#9a919f]">Możesz dodać kilka zdjęć — każde to osobna książka do przeglądu</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 flex h-9 items-center gap-1.5 self-start rounded-[10px] border border-[#e6deec] px-3.5 text-xs font-medium text-[#5b2a86] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]"
            >
              <Camera className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              Dodaj kolejne zdjęcie
            </button>

            <div className="mt-3 flex flex-col gap-2.5">
              {photos.map((p) => (
                <div key={p.localId} className="flex gap-3 rounded-[14px] border border-[#e8e2ec] bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- podgląd lokalnego pliku przez object URL, nie zasób do optymalizacji przez next/image */}
                  <img src={p.previewUrl} alt="" className="h-24 w-16 shrink-0 rounded-[8px] object-cover" />

                  <div className="min-w-0 flex-1">
                    {p.status === "recognizing" && (
                      <p className="flex items-center gap-1.5 text-xs text-[#706878]">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                        Rozpoznaję zdjęcie…
                      </p>
                    )}

                    {p.status === "saved" && (
                      <p className="flex items-center gap-1.5 text-xs font-medium text-[#2f7a4c]">
                        <Check className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                        Dodano: „{p.title}”
                      </p>
                    )}

                    {p.status !== "recognizing" && p.status !== "saved" && (
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={p.selected}
                          onChange={(e) => updateProposal(p.localId, { selected: e.target.checked })}
                          aria-label="Zaznacz do zapisu"
                          className="mt-1.5 h-4 w-4 shrink-0 accent-[#5b2a86]"
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <input
                            value={p.title}
                            onChange={(e) => updateProposal(p.localId, { title: e.target.value })}
                            placeholder="Tytuł *"
                            className={smallInputClass}
                          />
                          <input
                            value={p.author}
                            onChange={(e) => updateProposal(p.localId, { author: e.target.value })}
                            placeholder="Autor *"
                            className={smallInputClass}
                          />
                          <div className="flex gap-1.5">
                            <input
                              value={p.isbn}
                              onChange={(e) => updateProposal(p.localId, { isbn: e.target.value })}
                              placeholder="ISBN"
                              className={`${smallInputClass} flex-1`}
                            />
                            <input
                              value={p.year}
                              onChange={(e) => updateProposal(p.localId, { year: e.target.value })}
                              placeholder="Rok"
                              inputMode="numeric"
                              className={`${smallInputClass} w-16 shrink-0`}
                            />
                          </div>
                          <input
                            value={p.publisher}
                            onChange={(e) => updateProposal(p.localId, { publisher: e.target.value })}
                            placeholder="Wydawnictwo"
                            className={smallInputClass}
                          />

                          <div className="flex gap-1.5">
                            {OWNERSHIP_STATUSES.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => updateProposal(p.localId, { ownershipStatus: s })}
                                aria-pressed={p.ownershipStatus === s}
                                className={
                                  p.ownershipStatus === s
                                    ? "rounded-[7px] bg-[#5b2a86] px-2.5 py-1 text-[11px] font-medium text-white"
                                    : "rounded-[7px] border border-[#e6deec] px-2.5 py-1 text-[11px] text-[#706878]"
                                }
                              >
                                {OWNERSHIP_STATUS_LABELS[s]}
                              </button>
                            ))}
                          </div>

                          {p.rawTextPreview && (
                            <button
                              type="button"
                              onClick={() => updateProposal(p.localId, { textOpen: !p.textOpen })}
                              className="self-start text-[11px] text-[#9a919f] underline decoration-dotted"
                            >
                              {p.textOpen ? "Ukryj rozpoznany tekst" : "Pokaż rozpoznany tekst (OCR)"}
                            </button>
                          )}
                          {p.textOpen && (
                            <p className="whitespace-pre-wrap rounded-[8px] bg-[#f7f4ef] p-2 text-[10px] leading-relaxed text-[#706878]">
                              {p.rawTextPreview}
                            </p>
                          )}

                          {p.status === "duplicate" && p.duplicates && (
                            <div className="rounded-[8px] border border-[#f0d9a8] bg-[#fff8e8] p-2 text-[11px] text-[#8a5a10]">
                              <p className="flex items-center gap-1.5 font-medium">
                                <AlertTriangle className="h-3 w-3 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                                Podobna pozycja już jest w bibliotece
                              </p>
                              <ul className="mt-1 flex flex-col gap-0.5 pl-4">
                                {p.duplicates.map((d) => (
                                  <li key={d.id} className="list-disc">
                                    „{d.title}” — {d.author}
                                  </li>
                                ))}
                              </ul>
                              <button
                                type="button"
                                onClick={() => void saveOne(p, true)}
                                className="mt-1.5 rounded-[7px] border border-[#e6c98a] bg-white px-2 py-1 text-[11px] font-medium text-[#8a5a10] hover:bg-[#fff2d9]"
                              >
                                Dodaj mimo to
                              </button>
                            </div>
                          )}

                          {(p.status === "recognize_error" || p.status === "save_error") && p.message && (
                            <p className="text-[11px] text-red-600">{p.message}</p>
                          )}

                          {p.status === "saving" && (
                            <p className="flex items-center gap-1 text-[11px] text-[#706878]">
                              <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                              Zapisywanie…
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {p.status !== "saved" && p.status !== "saving" && (
                    <button
                      type="button"
                      onClick={() => removeProposal(p.localId)}
                      aria-label="Usuń zdjęcie z listy"
                      className="flex h-7 w-7 shrink-0 items-center justify-center self-start rounded-[8px] text-[#9a919f] transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {photos.length > 0 && (
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              disabled={selectedCount === 0 || savingAll || stillRecognizing}
              onClick={handleSaveSelected}
              className="flex h-10 items-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-5 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50"
            >
              {savingAll && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />}
              Zatwierdź zaznaczone ({selectedCount})
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 items-center rounded-[10px] border border-[#e6deec] px-5 text-sm font-medium text-[#706878] transition-colors hover:border-[#d9cde5]"
            >
              Zamknij
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
