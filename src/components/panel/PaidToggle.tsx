"use client";

import { useTransition } from "react";
import { toggleTripPaid } from "@/app/(site)/panel/zjazdy/actions";

export default function PaidToggle({ id, paid }: { id: string; paid: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input
        type="checkbox"
        defaultChecked={paid}
        disabled={isPending}
        className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-700"
        onChange={(event) => {
          const nextValue = event.target.checked;
          startTransition(() => {
            toggleTripPaid(id, nextValue);
          });
        }}
      />
      Opłacone
    </label>
  );
}
