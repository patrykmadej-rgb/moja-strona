import Link from "next/link";
import { Inbox } from "lucide-react";
import EmptyState from "@/components/lab/EmptyState";

export default function ImportSummaryCard({
  newCount,
  needsReviewCount,
  readyCount,
}: {
  newCount: number;
  needsReviewCount: number;
  readyCount: number;
}) {
  const total = newCount + needsReviewCount + readyCount;

  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-[#201a2b]">Import</h2>
        {total > 0 && (
          <Link href="/lab/szkola/import" className="text-xs font-medium text-[#5b2a86] hover:underline">
            Zobacz skrzynkę →
          </Link>
        )}
      </div>

      {total === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Skrzynka pusta"
          subtitle="Prześlij bilet, potwierdzenie hotelu albo wiadomość organizacyjną."
          compact
        />
      ) : (
        <div className="mt-3 flex gap-6 text-sm">
          <div>
            <p className="text-lg font-semibold text-[#201a2b]">{newCount}</p>
            <p className="text-xs text-[#706878]">nowych</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-[#201a2b]">{needsReviewCount}</p>
            <p className="text-xs text-[#706878]">wymaga sprawdzenia</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-[#201a2b]">{readyCount}</p>
            <p className="text-xs text-[#706878]">gotowych</p>
          </div>
        </div>
      )}
    </section>
  );
}
