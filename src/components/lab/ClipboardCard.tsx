"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy, MoreVertical, Pencil } from "lucide-react";
import { formatRelativeTime } from "@/lib/lab/format";
import type { ClipboardItem } from "@/lib/lab/clipboard-types";

const CLAMP_LINES = 9;

function CardMenu({ onDeleteRequest }: { onDeleteRequest: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Więcej działań"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-[9px] text-[#9a919f] transition-colors hover:bg-[#f7f4ef] hover:text-[#5b2a86] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5b2a86]/40"
      >
        <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-40 rounded-[10px] border border-[#e6deec] bg-white py-1 shadow-[0_8px_24px_rgba(49,30,64,0.12)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDeleteRequest();
            }}
            className="flex w-full items-center px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Usuń
          </button>
        </div>
      )}
    </div>
  );
}

export default function ClipboardCard({
  item,
  onEdit,
  onDeleteRequest,
  onCopied,
}: {
  item: ClipboardItem;
  onEdit: () => void;
  onDeleteRequest: () => void;
  onCopied: (message: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Przełącznik "Pokaż całość"/"Zwiń" pokazuje się TYLKO gdy treść realnie
  // nie mieści się w 9 liniach — scrollHeight (pełna wysokość treści, nawet
  // przy aktywnym line-clamp) porównany z clientHeight (widoczna, przycięta
  // wysokość). Przeliczane też po zmianie szerokości okna, bo liczba linii
  // zależy od szerokości karty. Wyłącznie w stanie zwiniętym (!expanded) —
  // po rozwinięciu clamp znika, więc scrollHeight===clientHeight i przycisk
  // "Zwiń" by zniknął, blokując powrót do zwiniętego widoku (realny błąd,
  // znaleziony i naprawiony podczas weryfikacji w przeglądarce).
  useLayoutEffect(() => {
    if (expanded) return;
    function measure() {
      const el = contentRef.current;
      if (!el) return;
      setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [item.content, expanded]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.content);
    } catch {
      // Fallback dla przeglądarek/kontekstów bez dostępu do Clipboard API
      // (np. brak uprawnień, kontekst nie-secure) — ukryty textarea + execCommand.
      try {
        const textarea = document.createElement("textarea");
        textarea.value = item.content;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {
        onCopied("Nie udało się skopiować tekstu.");
        return;
      }
    }
    setCopied(true);
    onCopied("Skopiowano do schowka systemowego.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="flex flex-col rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-[family-name:var(--font-cormorant)] text-[19px] font-semibold text-[#201a2b]">
              {item.title}
            </h3>
            {item.language && (
              <span className="shrink-0 rounded-full bg-[#f1eafd] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#5b2a86]">
                {item.language}
              </span>
            )}
          </div>
          {item.category && <p className="mt-0.5 text-xs text-[#9a919f]">{item.category}</p>}
        </div>
        <CardMenu onDeleteRequest={onDeleteRequest} />
      </div>

      {/* Domyślnie tylko-do-odczytu: zwykły tekst, nie textarea/input — brak
          obramowania pola i kursora edycji, przypadkowe kliknięcie nic nie
          uruchamia. Edycja startuje wyłącznie przyciskiem "Edytuj" (modal). */}
      <div
        ref={contentRef}
        className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#3c3542]"
        style={{
          overflowWrap: "anywhere",
          ...(expanded
            ? {}
            : {
                display: "-webkit-box",
                WebkitLineClamp: CLAMP_LINES,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
              }),
        }}
      >
        {item.content}
      </div>

      {isOverflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 flex items-center gap-1 self-start text-xs font-medium text-[#5b2a86] hover:text-[#32134f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#5b2a86]/40"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} strokeWidth={1.75} aria-hidden="true" />
          {expanded ? "Zwiń" : "Pokaż całość"}
        </button>
      )}

      <p className="mt-3 text-xs text-[#9a919f]">Zaktualizowano {formatRelativeTime(item.updated_at)}</p>

      <div className="mt-4 flex items-center gap-2 border-t border-[#f0ebf5] pt-4">
        <button
          type="button"
          onClick={handleCopy}
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-[#5b2a86] px-3 text-sm font-medium text-white transition-colors hover:bg-[#32134f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b2a86]"
        >
          {copied ? <Check className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> : <Copy className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
          {copied ? "Skopiowano" : "Kopiuj"}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e6deec] px-3 text-sm text-[#706878] transition-colors hover:border-[#d9cde5] hover:bg-[#f7f4ef] hover:text-[#5b2a86] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b2a86]/40"
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          Edytuj
        </button>
      </div>
    </article>
  );
}
