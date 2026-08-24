import { BookOpen, BookMarked, CheckCircle2, UserRound, type LucideIcon } from "lucide-react";
import { LOANED_STATUS_COLORS, LOANED_STATUS_LABEL, READING_STATUS_COLORS, READING_STATUS_LABELS, type ReadingStatus } from "@/lib/lab/library-types";

export type LibraryDisplayStatus = ReadingStatus | "loaned";

const ICONS: Record<LibraryDisplayStatus, LucideIcon> = {
  unread: BookOpen,
  reading: BookMarked,
  read: CheckCircle2,
  loaned: UserRound,
};

/**
 * Mały wskaźnik statusu zamiast tekstowego dropdownu w kompaktowej liście
 * (sekcja 4 briefu). Wyłącznie prezentacyjny — kliknięcie otwiera panel
 * szczegółów całej książki (LibraryBookCard), gdzie status jest faktycznie
 * zmieniany (LibraryReadingStatusSelector). aria-label/title niosą pełną
 * etykietę tekstową dla czytników ekranu i podpowiedzi na desktopie, bo
 * sama ikona nie jest jednoznaczna wizualnie dla wszystkich użytkowników.
 */
export default function LibraryStatusIcon({ status }: { status: LibraryDisplayStatus }) {
  const Icon = ICONS[status];
  const label = status === "loaned" ? LOANED_STATUS_LABEL : READING_STATUS_LABELS[status];
  const colors = status === "loaned" ? LOANED_STATUS_COLORS : READING_STATUS_COLORS[status];

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
      style={{ background: colors.bg, color: colors.text }}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
    </span>
  );
}
