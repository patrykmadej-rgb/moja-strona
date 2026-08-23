import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { lookupBookByIsbn } from "@/lib/lab/library-isbn-lookup";

/** Sekcja 6 briefu: "wpisz ISBN i pobierz dane bibliograficzne" — wyłącznie odczyt z Google Books, nic nie zapisuje do biblioteki. */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const isbn = searchParams.get("isbn")?.trim();
  if (!isbn) {
    return NextResponse.json({ error: "Brak numeru ISBN." }, { status: 400 });
  }

  const result = await lookupBookByIsbn(isbn);
  return NextResponse.json({ result });
}
