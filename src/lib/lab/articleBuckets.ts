import type { ArticleStatus } from "@/lib/lab/types";

export type BucketKey = "wszystkie" | "w_trakcie" | "wyslane" | "opublikowane";

export const BUCKETS: Record<Exclude<BucketKey, "wszystkie">, ArticleStatus[]> = {
  w_trakcie: ["pomysl", "pisanie"],
  wyslane: ["do_wyslania", "w_redakcji", "recenzja", "poprawki", "przyjety"],
  opublikowane: ["opublikowany"],
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
