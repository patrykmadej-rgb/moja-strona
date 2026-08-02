"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sanitizeStorageFilename } from "@/lib/storageFilename";

const BUCKET = "documents";

export async function createTrip(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak autoryzacji.");

  const eventDate = String(formData.get("event_date") ?? "");
  const ticketReservationNumber = String(formData.get("ticket_reservation_number") ?? "").trim();
  const accommodation = String(formData.get("accommodation") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const costRaw = String(formData.get("cost") ?? "");
  const cost = costRaw ? Number(costRaw) : null;
  const paid = formData.get("paid") === "on";
  const file = formData.get("file");

  if (!eventDate) throw new Error("Data zjazdu jest wymagana.");

  const { data: trip, error } = await supabase
    .from("trips")
    .insert({
      user_id: user.id,
      event_date: eventDate,
      ticket_reservation_number: ticketReservationNumber || null,
      accommodation: accommodation || null,
      address: address || null,
      cost,
      paid,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (file instanceof File && file.size > 0) {
    const path = `${user.id}/zjazdy/${trip.id}-${sanitizeStorageFilename(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || "application/pdf" });

    if (uploadError) throw new Error(uploadError.message);

    const { error: updateError } = await supabase
      .from("trips")
      .update({ ticket_pdf_path: path })
      .eq("id", trip.id);

    if (updateError) throw new Error(updateError.message);
  }

  revalidatePath("/panel/zjazdy");
}

export async function deleteTrip(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const ticketPdfPath = String(formData.get("ticket_pdf_path") ?? "");

  if (ticketPdfPath) {
    await supabase.storage.from(BUCKET).remove([ticketPdfPath]);
  }

  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/panel/zjazdy");
}

export async function toggleTripPaid(id: string, paid: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("trips").update({ paid }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/panel/zjazdy");
}
