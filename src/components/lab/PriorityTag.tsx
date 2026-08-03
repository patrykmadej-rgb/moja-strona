import { ArrowDown, Equal, Flame, PauseCircle, type LucideIcon } from "lucide-react";
import { ARTICLE_PRIORITY_LABELS, type ArticlePriorityValue } from "@/lib/lab/types";

export const PRIORITY_COLORS: Record<ArticlePriorityValue, { bg: string; text: string }> = {
  top: { bg: "#fdecee", text: "#9c3b4f" },
  medium: { bg: "#fdf3d9", text: "#8a5a10" },
  low: { bg: "#eef1f5", text: "#5b6b7a" },
  on_hold: { bg: "#f0eef4", text: "#5c5460" },
};

export const PRIORITY_ICONS: Record<ArticlePriorityValue, LucideIcon> = {
  top: Flame,
  medium: Equal,
  low: ArrowDown,
  on_hold: PauseCircle,
};

/**
 * Widoczny, ale nie krzykliwy wskaźnik priorytetu — pastelowe tło + ikona,
 * ten sam poziom "głośności" co StatusTag. Brak priorytetu celowo nie ma
 * dużego badge'a (sekcja 5 specyfikacji) — caller decyduje, co (jeśli
 * cokolwiek) pokazać w tym miejscu, ten komponent po prostu nic nie
 * renderuje dla `null`.
 */
export default function PriorityTag({ priority, compact = false }: { priority: ArticlePriorityValue | null; compact?: boolean }) {
  if (!priority) return null;

  const { bg, text } = PRIORITY_COLORS[priority];
  const Icon = PRIORITY_ICONS[priority];
  const label = ARTICLE_PRIORITY_LABELS[priority];

  return (
    <span
      title={label}
      className="inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-[7px] px-[7px] py-[3px] text-[10px] font-medium leading-[1.2]"
      style={{ background: bg, color: text }}
    >
      <Icon className="h-[11px] w-[11px] shrink-0" strokeWidth={2.25} />
      {!compact && label}
    </span>
  );
}
