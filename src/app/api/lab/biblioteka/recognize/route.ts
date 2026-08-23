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
const MAX_FILE_BYTES = 8 * 1024 * 1024;

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
    return NextResponse.json({ error: "Zdjęcie jest za duże (limit 8 MB)." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await recognizeBookFromImage(buffer, file.type);
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Nie udało się rozpoznać zdjęcia." }, { status: 500 });
  }
}
