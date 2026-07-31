import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Trip } from "@/lib/types";
import TripForm from "@/components/panel/TripForm";
import PaidToggle from "@/components/panel/PaidToggle";
import DeleteButton from "@/components/panel/DeleteButton";
import { deleteTrip } from "./actions";

export const metadata: Metadata = {
  title: "Zjazdy",
};

const dateFormatter = new Intl.DateTimeFormat("pl-PL", { dateStyle: "long" });
const currencyFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
});

export default async function ZjazdyPage() {
  const supabase = await createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .order("event_date", { ascending: true });

  const tripsWithUrls = await Promise.all(
    ((trips as Trip[] | null) ?? []).map(async (trip) => {
      let ticketUrl: string | null = null;
      if (trip.ticket_pdf_path) {
        const { data } = await supabase.storage
          .from("documents")
          .createSignedUrl(trip.ticket_pdf_path, 60 * 10);
        ticketUrl = data?.signedUrl ?? null;
      }
      return { ...trip, ticketUrl };
    }),
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Zjazdy</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Centrum zarządzania wyjazdami na zjazdy i konferencje.
      </p>

      <TripForm />

      <ul className="mt-8 flex flex-col gap-4">
        {tripsWithUrls.map((trip) => (
          <li
            key={trip.id}
            className="rounded-xl border border-black/10 p-5 dark:border-white/10"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1 text-sm">
                <p className="text-base font-medium">
                  {dateFormatter.format(new Date(trip.event_date))}
                </p>
                {trip.ticket_reservation_number && (
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Nr rezerwacji: {trip.ticket_reservation_number}
                  </p>
                )}
                {trip.accommodation && (
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Zakwaterowanie: {trip.accommodation}
                  </p>
                )}
                {trip.address && (
                  <p className="text-neutral-600 dark:text-neutral-300">Adres: {trip.address}</p>
                )}
                {trip.cost !== null && (
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Koszt: {currencyFormatter.format(trip.cost)}
                  </p>
                )}
                {trip.ticketUrl && (
                  <a
                    href={trip.ticketUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Otwórz bilet (PDF)
                  </a>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-3">
                <PaidToggle id={trip.id} paid={trip.paid} />
                <DeleteButton
                  id={trip.id}
                  filePath={trip.ticket_pdf_path}
                  fileFieldName="ticket_pdf_path"
                  action={deleteTrip}
                />
              </div>
            </div>
          </li>
        ))}
        {tripsWithUrls.length === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Brak zjazdów — dodaj pierwszy powyżej.
          </p>
        )}
      </ul>
    </div>
  );
}
