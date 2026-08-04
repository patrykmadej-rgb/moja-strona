import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findDuplicateReservation, type DuplicateMatch } from "@/lib/szkola/importDuplicates";
import ImportDetailView from "@/components/szkola/ImportDetailView";
import type { ImportInboxItem, ImportedReservation, SchoolSession } from "@/lib/szkola/types";

export const metadata: Metadata = { title: "Import" };
// Patrz komentarz w ../page.tsx — reprocessImport (wywoływane z tej trasy)
// też potrzebuje pełnego Node API i tego samego marginesu czasu. OCR sam w
// sobie idzie teraz przez /api/szkola/import/[id]/ocr (route handler +
// after()), nie przez Server Action na tej stronie.
export const runtime = "nodejs";
export const maxDuration = 60;

export default async function ImportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: item } = await supabase.from("import_inbox_items").select("*").eq("id", id).maybeSingle();
  if (!item) notFound();

  const [{ data: reservation }, { data: sessionsData }] = await Promise.all([
    supabase.from("imported_reservations").select("*").eq("inbox_item_id", id).maybeSingle(),
    supabase.from("school_sessions").select("*").order("start_date", { ascending: false }),
  ]);

  const sessions = (sessionsData as SchoolSession[] | null) ?? [];

  let duplicates: DuplicateMatch[] = [];
  if (reservation) {
    const allMatches = await findDuplicateReservation(supabase, user.id, {
      reservationType: reservation.reservation_type,
      bookingReference: reservation.booking_reference,
      amount: reservation.amount,
      currency: reservation.currency,
      startAt: reservation.start_at,
    });
    duplicates = allMatches.filter((d) => d.id !== reservation.id);
  }

  return (
    <div className="lab-szkola-page min-h-full bg-[#f7f4ef]">
      <div className="mx-auto max-w-[1180px] px-8 pt-9 pb-16">
        <Link href="/lab/szkola/import" className="flex items-center gap-1.5 text-xs text-[#706878] hover:text-[#5b2a86]">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          Skrzynka importu
        </Link>

        <div className="mt-6">
          <ImportDetailView
            item={item as ImportInboxItem}
            reservation={(reservation as ImportedReservation | null) ?? null}
            sessions={sessions}
            duplicates={duplicates}
          />
        </div>
      </div>
    </div>
  );
}
