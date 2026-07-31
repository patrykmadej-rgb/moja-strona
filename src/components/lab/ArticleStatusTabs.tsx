import { BUCKET_LABELS, type BucketKey } from "@/lib/lab/articleBuckets";

export default function ArticleStatusTabs({
  active,
  counts,
  onChange,
}: {
  active: BucketKey;
  counts: Record<BucketKey, number>;
  onChange: (bucket: BucketKey) => void;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-0.5 rounded-[10px] border border-[#e8e2ec] bg-[#fbfafc] p-1">
      {(Object.keys(BUCKET_LABELS) as BucketKey[]).map((key) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={
              isActive
                ? "inline-flex h-8 items-center gap-[7px] rounded-[7px] bg-[#f1eafd] px-3 text-[12px] font-medium text-[#5b2a86] transition-colors"
                : "inline-flex h-8 items-center gap-[7px] rounded-[7px] px-3 text-[12px] font-medium text-[#706878] transition-colors hover:bg-white hover:text-[#4c1f72]"
            }
          >
            {BUCKET_LABELS[key]}
            <span
              className={
                isActive
                  ? "rounded-full bg-[#5b2a86]/[0.1] px-[6px] py-[2px] text-[10px] text-[#5b2a86]"
                  : "rounded-full bg-[#5b2a86]/[0.08] px-[6px] py-[2px] text-[10px] text-[#706878]"
              }
            >
              {counts[key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
