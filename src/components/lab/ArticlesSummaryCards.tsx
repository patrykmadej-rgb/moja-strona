import { IconCircleCheck, IconClockHour4, IconFiles, IconSend } from "@tabler/icons-react";
import type { BucketKey } from "@/lib/lab/articleBuckets";

const CARDS: { key: BucketKey; label: string; icon: typeof IconFiles }[] = [
  { key: "wszystkie", label: "Wszystkie artykuły", icon: IconFiles },
  { key: "w_trakcie", label: "W trakcie", icon: IconClockHour4 },
  { key: "wyslane", label: "Wysłane", icon: IconSend },
  { key: "opublikowane", label: "Opublikowane", icon: IconCircleCheck },
];

export default function ArticlesSummaryCards({
  counts,
  activeBucket,
  onSelect,
}: {
  counts: Record<BucketKey, number>;
  activeBucket: BucketKey;
  onSelect: (bucket: BucketKey) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 min-[700px]:grid-cols-4">
      {CARDS.map(({ key, label, icon: Icon }) => {
        const active = activeBucket === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={
              active
                ? "min-h-[84px] rounded-[12px] border border-[#ded1e8] bg-[#faf7fd] px-4 py-3.5 text-left transition-colors"
                : "min-h-[84px] rounded-[12px] border border-[#e8e2ec] bg-white/95 px-4 py-3.5 text-left transition-colors hover:border-[#d9cde5] hover:bg-[#fbfaf8]"
            }
          >
            <div className="flex items-center gap-1.5 text-[#706878]">
              <Icon className="h-3.5 w-3.5 shrink-0" stroke={1.75} />
              <span className="truncate text-[11px] font-medium">{label}</span>
            </div>
            <p className="mt-1.5 text-2xl font-semibold leading-none text-[#201a2b]">
              {counts[key]}
            </p>
          </button>
        );
      })}
    </div>
  );
}
