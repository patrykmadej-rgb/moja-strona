"use client";

import { useState } from "react";
import Image from "next/image";
import { BookOpen } from "lucide-react";

const SIZES = {
  small: { w: 32, h: 46 },
  normal: { w: 40, h: 56 },
  large: { w: 56, h: 80 },
} as const;

/**
 * Subtelny placeholder, gdy okładka nie istnieje LUB gdy się nie załaduje
 * (sekcja 2 i 5 briefu) — używane w kompaktowym wierszu, pickerze okładek i
 * modalu dodawania ze zdjęcia. `onError` jest ważny: nawet po naprawie
 * wyszukiwania (Open Library fallback, next.config.ts remotePatterns) URL
 * zapisany kiedyś w bazie może z czasem obumrzeć (wydawca usunął miniaturę,
 * chwilowy problem sieciowy) — bez tej obsługi next/image po prostu nie
 * renderuje niczego w miejscu obrazu, co wygląda jak zepsuta karta, a nie
 * jak świadomy, elegancki brak okładki.
 */
export default function LibraryCoverImage({ url, size = "normal" }: { url: string | null; size?: keyof typeof SIZES }) {
  const [failed, setFailed] = useState(false);
  const { w, h } = SIZES[size];

  if (!url || failed) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-[6px] border border-[#ece4f5] bg-[#f7f4ef] text-[#c3b3da]"
        style={{ width: w, height: h }}
        aria-hidden="true"
      >
        <BookOpen className="h-4 w-4" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <Image
      src={url}
      width={w}
      height={h}
      alt=""
      onError={() => setFailed(true)}
      className="shrink-0 rounded-[6px] border border-[#ece4f5] object-cover"
      style={{ width: w, height: h }}
    />
  );
}
