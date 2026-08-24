const MAX_IMAGE_DIMENSION = 1600;
const TARGET_UPLOAD_BYTES = 3.5 * 1024 * 1024;
const INITIAL_JPEG_QUALITY = 0.85;

/**
 * Przygotowanie zdjęcia zrobionego telefonem przed wysyłką — wydzielone z
 * LibraryPhotoAddModal.tsx (gdzie powstało dla rozpoznawania okładki przez
 * OCR) do wspólnego modułu, żeby ręczny upload własnej okładki
 * (LibraryCoverPickerModal.tsx, zakres 6 briefu, Supabase Storage) używał
 * DOKŁADNIE tej samej, już sprawdzonej logiki zamiast drugiej implementacji.
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
export async function prepareImageForUpload(file: File): Promise<{ blob: Blob } | { error: string }> {
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
