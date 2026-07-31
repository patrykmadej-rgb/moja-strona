"use client";

import { useTransition } from "react";
import { toggleEventCompleted } from "@/app/lab/artykuly/[id]/actions";

export default function EventCompletedToggle({
  articleId,
  eventId,
  isCompleted,
}: {
  articleId: string;
  eventId: string;
  isCompleted: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-1.5 text-xs text-[#706878]">
      <input
        type="checkbox"
        defaultChecked={isCompleted}
        disabled={isPending}
        className="h-3.5 w-3.5"
        onChange={(event) => {
          const nextValue = event.target.checked;
          startTransition(() => {
            toggleEventCompleted(articleId, eventId, nextValue);
          });
        }}
      />
      Zrealizowane
    </label>
  );
}
