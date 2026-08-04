import "server-only";
import sharp from "sharp";

/**
 * Lekki preprocessing obrazu przed OCR (sekcja 7 briefu) — sharp, który jest
 * już bezpośrednią zależnością samego Next.js (next/image), więc jest
 * potwierdzone działający w tym dokładnym środowisku produkcyjnym, w
 * przeciwieństwie do @napi-rs/canvas, które spowodowało wcześniejszą awarię.
 *
 * Celowo POWŚCIĄGLIWE filtry — dokument, który już jest czytelny, nie ma
 * być pogarszany agresywnym przetwarzaniem: auto-orientacja EXIF,
 * skala szarości, rozciągnięcie kontrastu (normalize) i bardzo lekkie
 * wyostrzenie. Duże obrazy (np. zdjęcie z telefonu 4000×3000) są
 * zmniejszane, żeby nie eksplodować pamięcią/czasem w funkcji serverless.
 */

const MAX_DIMENSION_PX = 2500;

export async function preprocessImageForOcr(input: Buffer): Promise<Buffer> {
  const metadata = await sharp(input, { failOn: "none" }).metadata();

  let pipeline = sharp(input, { failOn: "none" }).rotate(); // auto-orientacja wg EXIF

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (width > MAX_DIMENSION_PX || height > MAX_DIMENSION_PX) {
    pipeline = pipeline.resize({
      width: MAX_DIMENSION_PX,
      height: MAX_DIMENSION_PX,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  pipeline = pipeline.grayscale().normalize().sharpen({ sigma: 0.5 });

  return pipeline.png().toBuffer();
}
