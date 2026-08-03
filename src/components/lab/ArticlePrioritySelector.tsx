"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { updateArticlePriority } from "@/app/lab/artykuly/[id]/actions";
import { PRIORITY_COLORS, PRIORITY_ICONS } from "@/components/lab/PriorityTag";
import { ARTICLE_PRIORITIES, ARTICLE_PRIORITY_LABELS, NO_PRIORITY_LABEL, type ArticlePriority } from "@/lib/lab/types";

const DROPDOWN_WIDTH = 220;
// Wygląd triggera, gdy priorytet nie jest ustawiony — celowo stonowany,
// bez koloru (sekcja 5 specyfikacji: brak priorytetu nie ma dużego badge'a).
const NO_PRIORITY_COLORS = { bg: "transparent", text: "#9a919f" };

type ToastState = { message: string; kind: "success" | "error" } | null;

function PriorityToast({ toast }: { toast: ToastState }) {
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

/** Opcje menu w kolejności: "Bez priorytetu" najpierw, potem ARTICLE_PRIORITIES (sekcja 3 specyfikacji). */
const MENU_OPTIONS: ArticlePriority[] = [null, ...ARTICLE_PRIORITIES];

export default function ArticlePrioritySelector({
  articleId,
  priority,
}: {
  articleId: string;
  priority: ArticlePriority;
}) {
  const router = useRouter();
  const [currentPriority, setCurrentPriority] = useState(priority);
  const [syncedPriority, setSyncedPriority] = useState(priority);
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; openUpward: boolean } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Patrz identyczny komentarz w ArticleStatusSelector — dopasowanie stanu
  // do zmiany propsa w trakcie renderu zamiast w efekcie.
  if (priority !== syncedPriority) {
    setSyncedPriority(priority);
    setCurrentPriority(priority);
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
        if (!target.closest("[data-article-priority-menu]")) setOpen(false);
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
    const estimatedHeight = MENU_OPTIONS.length * 36 + 16;
    const openUpward = rect.bottom + estimatedHeight > window.innerHeight && rect.top > estimatedHeight;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - DROPDOWN_WIDTH - 8);
    const top = openUpward ? rect.top - 6 : rect.bottom + 6;
    setMenuPos({ top, left, openUpward });
    setOpen(true);
  };

  const handleSelect = async (nextPriority: ArticlePriority) => {
    setOpen(false);
    if (nextPriority === currentPriority || isSaving) return;

    const previousPriority = currentPriority;
    setCurrentPriority(nextPriority);
    setIsSaving(true);

    try {
      const result = await updateArticlePriority(articleId, nextPriority);
      if ("error" in result) {
        setCurrentPriority(previousPriority);
        setToast({ message: "Nie udało się zmienić priorytetu", kind: "error" });
      } else {
        setToast({ message: "Priorytet artykułu został zmieniony", kind: "success" });
        router.refresh();
      }
    } catch {
      setCurrentPriority(previousPriority);
      setToast({ message: "Nie udało się zmienić priorytetu", kind: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const { bg, text } = currentPriority ? PRIORITY_COLORS[currentPriority] : NO_PRIORITY_COLORS;
  const triggerLabel = currentPriority ? ARTICLE_PRIORITY_LABELS[currentPriority] : NO_PRIORITY_LABEL;
  const TriggerIcon = currentPriority ? PRIORITY_ICONS[currentPriority] : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={isSaving}
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={
          "inline-flex min-h-[28px] cursor-pointer items-center gap-[5px] rounded-[9px] border px-[9px] py-[5px] text-[12px] font-medium transition-[border-color,box-shadow,opacity] duration-150 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(91,42,134,0.14)] disabled:cursor-not-allowed disabled:opacity-70" +
          (currentPriority ? " border-transparent hover:border-[rgba(91,42,134,0.18)]" : " border-dashed border-[#d9d2de] hover:border-[#b9adc2]")
        }
        style={{ background: bg, color: text }}
      >
        {TriggerIcon && <TriggerIcon className="h-3 w-3 shrink-0" strokeWidth={2.25} />}
        {triggerLabel}
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
            data-article-priority-menu
            role="listbox"
            aria-label="Priorytet artykułu"
            className="fixed z-[9999] rounded-[10px] border border-[#e6deec] bg-white py-1 shadow-[0_10px_30px_rgba(24,12,32,0.16)]"
            style={{
              top: menuPos.openUpward ? undefined : menuPos.top,
              bottom: menuPos.openUpward ? window.innerHeight - menuPos.top : undefined,
              left: menuPos.left,
              width: DROPDOWN_WIDTH,
            }}
          >
            {MENU_OPTIONS.map((p) => {
              const isCurrent = p === currentPriority;
              const label = p ? ARTICLE_PRIORITY_LABELS[p] : NO_PRIORITY_LABEL;
              const Icon = p ? PRIORITY_ICONS[p] : null;
              const dotColor = p ? PRIORITY_COLORS[p].text : "#c9c1cf";
              return (
                <button
                  key={p ?? "none"}
                  type="button"
                  role="option"
                  aria-selected={isCurrent}
                  onClick={() => handleSelect(p)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#201a2b] transition-colors hover:bg-[#f7f4fa]"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {isCurrent && <Check className="h-3.5 w-3.5 text-[#5b2a86]" strokeWidth={2.25} />}
                  </span>
                  {Icon ? (
                    <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: dotColor }} strokeWidth={2.25} />
                  ) : (
                    <span className="h-2 w-2 shrink-0 rounded-full border border-dashed" style={{ borderColor: dotColor }} />
                  )}
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}

      <PriorityToast toast={toast} />
    </>
  );
}
