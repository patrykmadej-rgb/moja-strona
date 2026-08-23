import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recognizeBookFromImage } from "@/lib/lab/library-ocr";

/**
 * "Dodaj ze zdjęcia" (sekcja 6 briefu) — WYŁĄCZNIE rozpoznaje i zwraca
 * propozycję danych, nigdy nie zapisuje książki do biblioteki (zapis idzie
 * osobno przez istniejącą server action createLibraryBook, dopiero po
 * ręcznym zatwierdzeniu w LibraryPhotoAddModal.tsx). Synchroniczne (bez
 * after()/pollingu jak w OCR importu szkoły) — nie ma tu żadnego rekordu w
 * bazie do odpytywania w tle, klient po prostu czeka na jedną odpowiedź;
 * wewnętrzny twardy limit OCR to 45s (localOcrProvider.ts), maxDuration=60
 * daje temu zapas, tak samo jak w /api/szkola/import/[id]/ocr.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
// Klient (LibraryPhotoAddModal.tsx) kompresuje zdjęcie do ok. 1.5 MB przed
// wysyłką — ten limit to backstop, nie normalna ścieżka. Celowo NIŻEJ niż
// domyślny limit body requestu funkcji serverless na Vercelu (ok. 4.5 MB):
// stary limit 8 MB przy oryginalnym zdjęciu z aparatu iPhone'a (często
// 3-8 MB) był rzeczywistą przyczyną "Błąd połączenia z serwerem" — platforma
// odrzucała request PRZED dotarciem do tego handlera, więc klient dostawał
// odpowiedź, która nie była poprawnym JSON.
const MAX_FILE_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe żądanie." }, { status: 400 });
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Brak zdjęcia." }, { status: 400 });
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Obsługiwane formaty: JPG, PNG, WEBP." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Zdjęcie jest za duże (limit 4 MB). Spróbuj zrobić nowe zdjęcie albo wybrać inne z galerii." }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await recognizeBookFromImage(buffer, file.type);
    return NextResponse.json({ result });
  } catch (err) {
    // OCR_TIMEOUT: rzucane przez localOcrProvider.ts po przekroczeniu jego
    // wewnętrznego twardego limitu (45s) — osobny, zrozumiały komunikat
    // zamiast ogólnego "500", bo to nie jest awaria serwera, tylko zbyt
    // wolna analiza (np. bardzo duże/nieczytelne zdjęcie).
    if (err instanceof Error && err.message.startsWith("OCR_TIMEOUT")) {
      return NextResponse.json({ error: "Analiza zdjęcia trwała zbyt długo. Spróbuj ponownie albo wpisz dane ręcznie." }, { status: 504 });
    }
    // Treść błędu (err.message) świadomie NIE trafia do klienta — może
    // zawierać szczegóły środowiska serwera (ścieżki plików, komunikaty
    // biblioteki OCR). Logujemy ją po stronie serwera do diagnostyki, users
    // dostają wyłącznie bezpieczny, ogólny komunikat.
    console.error("[biblioteka/recognize] OCR failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Nie udało się przeanalizować zdjęcia po stronie serwera. Spróbuj ponownie albo wpisz dane ręcznie." }, { status: 500 });
  }
}
