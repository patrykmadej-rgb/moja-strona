"use client";

import { useTransition } from "react";
import { IconPin, IconPinFilled } from "@tabler/icons-react";
import { toggleNotePinned } from "@/app/lab/artykuly/[id]/actions";

export default function NotePinnedToggle({
  articleId,
  noteId,
  isPinned,
}: {
  articleId: string;
  noteId: string;
  isPinned: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          toggleNotePinned(articleId, noteId, !isPinned);
        });
      }}
      title={isPinned ? "Odepnij notatkę" : "Przypnij notatkę"}
      className={
        isPinned
          ? "shrink-0 text-[#4A1D6E] disabled:opacity-50"
          : "shrink-0 text-[#4A3360]/50 hover:text-[#4A1D6E] disabled:opacity-50"
      }
    >
      {isPinned ? (
        <IconPinFilled className="h-4 w-4" stroke={1.75} />
      ) : (
        <IconPin className="h-4 w-4" stroke={1.75} />
      )}
    </button>
  );
}
