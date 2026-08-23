import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchBookCovers } from "@/lib/lab/library-isbn-lookup";

/**
 * Sekcja 7 briefu: wyszukiwanie kandydatów okładek po tytule/autorze —
 * używane przez LibraryCoverPicker.tsx (formularz dodawania/edycji,
 * dodawanie ze zdjęcia, "Znajdź okładkę" z menu istniejącej książki).
 * Wyłącznie odczyt z Google Books, nic nie zapisuje.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.trim();
  const author = searchParams.get("author")?.trim() || null;
  if (!title) {
    return NextResponse.json({ error: "Brak tytułu." }, { status: 400 });
  }

  const candidates = await searchBookCovers(title, author);
  return NextResponse.json({ candidates });
}
