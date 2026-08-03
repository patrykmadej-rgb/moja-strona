"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { updateArticleStatus } from "@/app/lab/artykuly/[id]/actions";
import { STATUS_COLORS } from "@/components/lab/StatusTag";
import { ARTICLE_STATUSES, ARTICLE_STATUS_LABELS, type ArticleStatus } from "@/lib/lab/types";

const DROPDOWN_WIDTH = 270;
const FALLBACK_COLORS = { bg: "#f1eef2", text: "#5c5460" };

type ToastState = { message: string; kind: "success" | "error" } | null;

function StatusToast({ toast }: { toast: ToastState }) {
  if (!toast || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="status"
      className="fixed right-5 bottom-5 z-[9999] rounded-[10px] border px-4 py-2.5 text-sm shadow-[0_10px_30px_rgba(24,12,32,0.16)]"
      style={
        toast.kind === "success"
          ? { background: "#f3fbf5", borderColor: "#cfe9d7", color: "#2f7a4c" }
          : { background: "#fdf2f2", borderColor: "#f0c9c9", color: "#a13a3a" }
      }
    >
      {toast.message}
    </div>,
    document.body,
  );
}

export default function ArticleStatusSelector({
  articleId,
  status,
}: {
  articleId: string;
  status: ArticleStatus;
}) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [syncedStatus, setSyncedStatus] = useState(status);
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; openUpward: boolean } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Zamiast synchronizować w efekcie (renderowanie na krótko pokazałoby
  // wtedy nieaktualny stan), dopasowujemy stan w trakcie renderu — oficjalnie
  // rekomendowany wzorzec React na "dopasuj stan do zmiany propsa":
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (status !== syncedStatus) {
    setSyncedStatus(status);
    setCurrentStatus(status);
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (!target.closest("[data-article-status-menu]")) setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const estimatedHeight = ARTICLE_STATUSES.length * 36 + 16;
    const openUpward = rect.bottom + estimatedHeight > window.innerHeight && rect.top > estimatedHeight;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - DROPDOWN_WIDTH - 8);
    const top = openUpward ? rect.top - 6 : rect.bottom + 6;
    setMenuPos({ top, left, openUpward });
    setOpen(true);
  };

  const handleSelect = async (nextStatus: ArticleStatus) => {
    setOpen(false);
    if (nextStatus === currentStatus || isSaving) return;

    const previousStatus = currentStatus;
    setCurrentStatus(nextStatus);
    setIsSaving(true);

    try {
      const result = await updateArticleStatus(articleId, nextStatus);
      if ("error" in result) {
        setCurrentStatus(previousStatus);
        setToast({ message: "Nie udało się zmienić statusu", kind: "error" });
      } else {
        setToast({ message: "Status artykułu został zmieniony", kind: "success" });
        router.refresh();
      }
    } catch {
      setCurrentStatus(previousStatus);
      setToast({ message: "Nie udało się zmienić statusu", kind: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const { bg, text } = STATUS_COLORS[currentStatus] ?? FALLBACK_COLORS;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={isSaving}
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex min-h-[28px] cursor-pointer items-center gap-[5px] rounded-[9px] border border-transparent px-[9px] py-[5px] text-[12px] font-medium transition-[border-color,box-shadow,opacity] duration-150 hover:border-[rgba(91,42,134,0.18)] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(91,42,134,0.14)] disabled:cursor-not-allowed disabled:opacity-70"
        style={{ background: bg, color: text }}
      >
        {ARTICLE_STATUS_LABELS[currentStatus]}
        {isSaving ? (
          <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
        ) : (
          <ChevronDown className="h-3 w-3" strokeWidth={2} />
        )}
      </button>

      {open &&
        menuPos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            data-article-status-menu
            role="listbox"
            aria-label="Status artykułu"
            className="fixed z-[9999] rounded-[10px] border border-[#e6deec] bg-white py-1 shadow-[0_10px_30px_rgba(24,12,32,0.16)]"
            style={{
              top: menuPos.openUpward ? undefined : menuPos.top,
              bottom: menuPos.openUpward ? window.innerHeight - menuPos.top : undefined,
              left: menuPos.left,
              width: DROPDOWN_WIDTH,
            }}
          >
            {ARTICLE_STATUSES.map((s) => {
              const colors = STATUS_COLORS[s];
              const isCurrent = s === currentStatus;
              return (
                <button
                  key={s}
                  type="button"
                  role="option"
                  aria-selected={isCurrent}
                  onClick={() => handleSelect(s)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#201a2b] transition-colors hover:bg-[#f7f4fa]"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {isCurrent && <Check className="h-3.5 w-3.5 text-[#5b2a86]" strokeWidth={2.25} />}
                  </span>
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colors.text }} />
                  <span className="truncate">{ARTICLE_STATUS_LABELS[s]}</span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}

      <StatusToast toast={toast} />
    </>
  );
}
