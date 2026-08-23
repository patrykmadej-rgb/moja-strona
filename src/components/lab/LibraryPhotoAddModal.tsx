"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Camera, Check, Info, Loader2, Trash2, X } from "lucide-react";
import { createLibraryBook, type LibraryActionError } from "@/app/lab/biblioteka/actions";
import LibraryCoverPicker, { type CoverCandidate } from "@/components/lab/LibraryCoverPicker";
import type { OwnershipStatus } from "@/lib/lab/library-types";

type ProposalStatus = "recognizing" | "ready" | "recognize_error" | "saving" | "saved" | "duplicate" | "save_error";

type PhotoProposal = {
  localId: string;
  file: File;
  previewUrl: string;
  status: ProposalStatus;
  selected: boolean;
  title: string;
  author: string;
  /** ISBN/wydawnictwo/rok z OCR — nie pokazywane w UI (sekcja 10 briefu), tylko do identyfikacji/zapisu; nadpisywane danymi z wybranej okładki, jeśli jest. */
  isbn: string;
  publisher: string;
  year: string;
  /** Zawsze z aktywnej zakładki, bez UI do zmiany — sekcja 10 briefu. */
  ownershipStatus: OwnershipStatus;
  selectedCover: CoverCandidate | null;
  /** Błąd (rozpoznawania albo zapisu) — czerwony tekst. */
  message: string | null;
  /** Neutralna informacja (np. "nie rozpoznano tytułu, uzupełnij ręcznie") — nie jest błędem, formularz i tak działa. */
  infoMessage: string | null;
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

const fieldLabelClass = "flex flex-col gap-1 text-xs font-medium text-[#4f4758]";
// text-[16px] jest celowe — poniżej 16px Safari na iOS automatycznie
// przybliża widok po dotknięciu pola, co na telefonie jest bardzo mylące.
const fieldInputClass =
  "w-full rounded-[10px] border border-[#e6deec] bg-white px-3 py-2.5 text-[16px] text-[#201a2b] outline-none focus:border-[#5b2a86] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5b2a86]/40";

const MAX_IMAGE_DIMENSION = 1600;
const TARGET_UPLOAD_BYTES = 3.5 * 1024 * 1024;
const INITIAL_JPEG_QUALITY = 0.85;

/**
 * Przygotowanie zdjęcia przed wysyłką (sekcja 2 briefu) — jest to
 * BEZPOŚREDNIA przyczyna, dla której rozpoznawanie nie działało na
 * prawdziwym iPhonie: oryginalne zdjęcia z aparatu (często 3-8 MB) trafiały
 * na serwer, którego platforma hostingowa odrzuca zbyt duże żądania,
 * zanim dotrą do naszego kodu — klient dostawał odpowiedź, która nie była
 * poprawnym JSON, i lądował w ogólnym "Błąd połączenia z serwerem".
 *
 * Standardowy <img> + <canvas> (NIE createImageBitmap — gorzej wspierane
 * opcje orientacji w Safari): nowoczesne przeglądarki, łącznie z Safari na
 * iOS, renderują <img> z uwzględnieniem orientacji EXIF, więc obraz
 * narysowany z takiego <img> na canvasie jest już poprawnie obrócony bez
 * ręcznego parsowania EXIF. Safari dekoduje też HEIC/HEIF natywnie w
 * <img> — canvas.toBlob() zawsze zwraca JPEG niezależnie od formatu
 * wejściowego, więc to jednocześnie naturalnie "konwertuje" HEIC. W
 * przeglądarkach bez natywnego dekodera HEIC (np. desktopowy Chrome)
 * wczytanie się nie uda — wtedy zwracamy jawny komunikat zamiast udawać
 * obsługę.
 */
async function prepareImageForUpload(file: File): Promise<{ blob: Blob } | { error: string }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode-failed"));
      el.src = objectUrl;
    });

    if (!img.naturalWidth || !img.naturalHeight) {
      return { error: "Nie udało się odczytać tego zdjęcia. Spróbuj zdjęcia w formacie JPG lub PNG." };
    }

    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { error: "Ta przeglądarka nie obsługuje przetwarzania zdjęć." };
    ctx.drawImage(img, 0, 0, width, height);

    let quality = INITIAL_JPEG_QUALITY;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (!blob) return { error: "Nie udało się przygotować zdjęcia do wysyłki." };
      if (blob.size <= TARGET_UPLOAD_BYTES || quality <= 0.4) return { blob };
      quality -= 0.15;
    }
    return { error: "Nie udało się wystarczająco zmniejszyć zdjęcia." };
  } catch {
    return { error: "Nie udało się odczytać tego formatu zdjęcia w tej przeglądarce. Spróbuj zdjęcia w formacie JPG lub PNG." };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Sekcja 5 briefu: rozróżnienie przyczyn zamiast jednego ogólnego komunikatu. */
function messageForStatus(status: number, serverMessage?: string): string {
  if (serverMessage) return serverMessage;
  if (status === 401 || status === 403) return "Sesja wygasła — zaloguj się ponownie.";
  if (status === 413) return "Zdjęcie jest za duże. Spróbuj innego zdjęcia.";
  if (status === 504 || status === 408) return "Analiza trwała zbyt długo. Spróbuj ponownie albo wpisz dane ręcznie.";
  if (status >= 500) return "Wystąpił problem po stronie serwera. Spróbuj ponownie za chwilę.";
  return "Nie udało się rozpoznać zdjęcia. Spróbuj ponownie albo wpisz dane ręcznie.";
}

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
    const prepared = await prepareImageForUpload(proposal.file);
    if ("error" in prepared) {
      updateProposal(proposal.localId, { status: "recognize_error", message: prepared.error });
      return;
    }

    const formData = new FormData();
    formData.set("image", prepared.blob, "cover.jpg");

    let res: Response;
    try {
      res = await fetch("/api/lab/biblioteka/recognize", { method: "POST", body: formData });
    } catch {
      updateProposal(proposal.localId, {
        status: "recognize_error",
        message: "Nie udało się połączyć z serwerem. Sprawdź internet i spróbuj ponownie.",
      });
      return;
    }

    let json: {
      result?: { title: string | null; author: string | null; isbn: string | null; publisher: string | null; year: number | null; rawTextPreview: string };
      error?: string;
    } | null = null;
    try {
      json = await res.json();
    } catch {
      // Odpowiedź nie była poprawnym JSON — najczęściej strona błędu samego
      // hostingu (limit rozmiaru/czasu), nie coś zwrócone przez nasz kod.
      updateProposal(proposal.localId, { status: "recognize_error", message: messageForStatus(res.status) });
      return;
    }

    if (!json || !res.ok || !json.result) {
      updateProposal(proposal.localId, { status: "recognize_error", message: messageForStatus(res.status, json?.error) });
      return;
    }

    const { result } = json;
    const foundNothing = !result.title && !result.author;
    updateProposal(proposal.localId, {
      status: "ready",
      title: result.title ?? "",
      author: result.author ?? "",
      isbn: result.isbn ?? "",
      publisher: result.publisher ?? "",
      year: result.year ? String(result.year) : "",
      rawTextPreview: result.rawTextPreview,
      selected: Boolean(result.title && result.author),
      infoMessage: foundNothing ? "Nie udało się rozpoznać tytułu i autora na tym zdjęciu — uzupełnij pola ręcznie." : null,
    });
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
      selectedCover: null,
      message: null,
      infoMessage: null,
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
    // Wydawnictwo/rok/ISBN/okładka z wybranego kandydata mają pierwszeństwo
    // przed surowym odczytem OCR — katalog jest wiarygodniejszy; OCR
    // zostaje jako fallback, gdy wyszukiwanie okładki nic nie znalazło.
    const isbn = proposal.selectedCover?.isbn ?? (proposal.isbn.trim() || null);
    const publisher = proposal.selectedCover?.publisher ?? (proposal.publisher.trim() || null);
    const year = proposal.selectedCover?.year ?? (proposal.year.trim() ? Number.parseInt(proposal.year, 10) : null);
    if (isbn) formData.set("isbn", isbn);
    if (publisher) formData.set("publisher", publisher);
    if (year) formData.set("year", String(year));
    if (proposal.selectedCover?.thumbnailUrl) formData.set("coverUrl", proposal.selectedCover.thumbnailUrl);
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
    updateProposal(proposal.localId, { status: "saved", message: null, infoMessage: null, selected: false, duplicates: null });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 min-[420px]:p-4" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <div className="flex max-h-[90dvh] w-full max-w-[640px] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_20px_60px_rgba(30,15,45,0.25)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#f0ebf5] p-4 min-[420px]:p-6 min-[420px]:pb-4">
          <div className="min-w-0">
            <h2 id={headingId} className="font-[family-name:var(--font-cormorant)] text-[20px] font-semibold text-[#201a2b] min-[420px]:text-[22px]">
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-[#9a919f] transition-colors hover:bg-[#f7f4ef] hover:text-[#5b2a86]"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* overscroll-contain: przewijanie treści modalu nie "przecieka" do
            przewijania strony pod spodem podczas gestów na iOS. */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 min-[420px]:p-6">
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
              className="flex w-full flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-[#d9cde5] bg-[#faf8fc] px-6 py-10 text-center transition-colors hover:border-[#5b2a86] hover:bg-[#f1eafd]"
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
                className="flex h-10 items-center gap-1.5 self-start rounded-[10px] border border-[#e6deec] px-3.5 text-xs font-medium text-[#5b2a86] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd]"
              >
                <Camera className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                Dodaj kolejne zdjęcie
              </button>

              <div className="mt-3 flex flex-col gap-3">
                {photos.map((p) => {
                  const missingRequired = !p.title.trim() || !p.author.trim();
                  return (
                    <div key={p.localId} className="rounded-[14px] border border-[#e8e2ec] bg-white p-3">
                      {/* Górny rząd: miniatura + status/checkbox + usuń — zawsze krótki, mieści się poziomo nawet na telefonie. */}
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element -- podgląd lokalnego pliku przez object URL, nie zasób do optymalizacji przez next/image */}
                        <img src={p.previewUrl} alt="" className="h-20 w-14 shrink-0 rounded-[8px] object-cover" />

                        <div className="min-w-0 flex-1">
                          {p.status === "recognizing" && (
                            <p className="flex items-center gap-1.5 text-xs text-[#706878]">
                              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                              Rozpoznaję zdjęcie…
                            </p>
                          )}
                          {p.status === "saved" && (
                            <p className="flex items-center gap-1.5 text-xs font-medium text-[#2f7a4c]">
                              <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                              <span className="truncate">Dodano: „{p.title}”</span>
                            </p>
                          )}
                          {p.status !== "recognizing" && p.status !== "saved" && (
                            <label className="flex items-center gap-2 text-xs font-medium text-[#4f4758]">
                              <input
                                type="checkbox"
                                checked={p.selected}
                                onChange={(e) => updateProposal(p.localId, { selected: e.target.checked })}
                                className="h-[18px] w-[18px] shrink-0 accent-[#5b2a86]"
                              />
                              Zaznacz do zapisu
                            </label>
                          )}
                        </div>

                        {p.status !== "saved" && p.status !== "saving" && (
                          <button
                            type="button"
                            onClick={() => removeProposal(p.localId)}
                            aria-label="Usuń zdjęcie z listy"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-[#9a919f] transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                          </button>
                        )}
                      </div>

                      {/* Pola formularza — zawsze pełna szerokość, pod górnym rzędem (sekcja 6 briefu: pionowy układ na telefonie). */}
                      {p.status !== "recognizing" && p.status !== "saved" && (
                        <div className="mt-3 flex flex-col gap-2.5">
                          <label className={fieldLabelClass}>
                            <span>Tytuł *</span>
                            <input
                              value={p.title}
                              onChange={(e) => updateProposal(p.localId, { title: e.target.value })}
                              placeholder="np. Leżąc na kozetce"
                              className={fieldInputClass}
                            />
                          </label>
                          <label className={fieldLabelClass}>
                            <span>Autor *</span>
                            <input
                              value={p.author}
                              onChange={(e) => updateProposal(p.localId, { author: e.target.value })}
                              placeholder="np. Irvin D. Yalom"
                              className={fieldInputClass}
                            />
                          </label>

                          <div className={fieldLabelClass}>
                            <span>Okładka</span>
                            <LibraryCoverPicker
                              title={p.title}
                              author={p.author}
                              selected={p.selectedCover}
                              onSelect={(candidate) => updateProposal(p.localId, { selectedCover: candidate })}
                            />
                          </div>

                          {p.infoMessage && (
                            <p className="flex items-start gap-1.5 text-xs text-[#706878]">
                              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                              {p.infoMessage}
                            </p>
                          )}
                          {!p.infoMessage && missingRequired && p.status === "ready" && (
                            <p className="flex items-start gap-1.5 text-xs text-[#a76616]">
                              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                              Uzupełnij tytuł i autora, aby zatwierdzić tę pozycję.
                            </p>
                          )}

                          {p.rawTextPreview && (
                            <button
                              type="button"
                              onClick={() => updateProposal(p.localId, { textOpen: !p.textOpen })}
                              className="self-start text-xs text-[#9a919f] underline decoration-dotted"
                            >
                              {p.textOpen ? "Ukryj rozpoznany tekst" : "Pokaż rozpoznany tekst (OCR)"}
                            </button>
                          )}
                          {p.textOpen && (
                            <p className="whitespace-pre-wrap rounded-[8px] bg-[#f7f4ef] p-2 text-[11px] leading-relaxed text-[#706878]">
                              {p.rawTextPreview}
                            </p>
                          )}

                          {p.status === "duplicate" && p.duplicates && (
                            <div className="rounded-[8px] border border-[#f0d9a8] bg-[#fff8e8] p-2.5 text-xs text-[#8a5a10]">
                              <p className="flex items-center gap-1.5 font-medium">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
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
                                className="mt-2 flex h-8 items-center rounded-[8px] border border-[#e6c98a] bg-white px-3 text-xs font-medium text-[#8a5a10] hover:bg-[#fff2d9]"
                              >
                                Dodaj mimo to
                              </button>
                            </div>
                          )}

                          {(p.status === "recognize_error" || p.status === "save_error") && p.message && (
                            <p className="flex items-start gap-1.5 text-xs text-red-600">
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                              {p.message}
                            </p>
                          )}

                          {p.status === "saving" && (
                            <p className="flex items-center gap-1.5 text-xs text-[#706878]">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                              Zapisywanie…
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {photos.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-[#f0ebf5] p-4 min-[420px]:flex-row min-[420px]:p-6 min-[420px]:pt-4">
            <button
              type="button"
              disabled={selectedCount === 0 || savingAll || stillRecognizing}
              onClick={handleSaveSelected}
              className="flex h-11 items-center justify-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-5 text-sm font-medium text-white transition-colors hover:bg-[#32134f] disabled:opacity-50 min-[420px]:h-10"
            >
              {savingAll && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />}
              Zatwierdź zaznaczone ({selectedCount})
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 items-center justify-center rounded-[10px] border border-[#e6deec] px-5 text-sm font-medium text-[#706878] transition-colors hover:border-[#d9cde5] min-[420px]:h-10"
            >
              Zamknij
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
