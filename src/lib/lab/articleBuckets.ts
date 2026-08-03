import type { ArticleStatus } from "@/lib/lab/types";

export type BucketKey = "wszystkie" | "w_trakcie" | "wyslane" | "opublikowane";

export const BUCKETS: Record<Exclude<BucketKey, "wszystkie">, ArticleStatus[]> = {
  w_trakcie: ["idea", "first_version", "revisions", "final_version", "ready_to_submit", "post_review_revisions"],
  wyslane: ["submitted", "in_publication"],
  opublikowane: ["published"],
};

export const BUCKET_LABELS: Record<BucketKey, string> = {
  wszystkie: "Wszystkie",
  w_trakcie: "W trakcie",
  wyslane: "Wysłane",
  opublikowane: "Opublikowane",
};

export function matchesBucket(status: ArticleStatus, bucket: BucketKey): boolean {
  if (bucket === "wszystkie") return true;
  return BUCKETS[bucket].includes(status);
}
