import { SESSION_STATUS_LABELS, type SessionStatus } from "@/lib/szkola/types";

const STATUS_COLORS: Record<SessionStatus, { bg: string; text: string }> = {
  do_zaplanowania: { bg: "#efedf0", text: "#6f6874" },
  planowanie: { bg: "#f1eafd", text: "#5b2a86" },
  wymaga_dzialania: { bg: "#fff2d9", text: "#a76616" },
  czesciowo_przygotowany: { bg: "#eaf0ff", text: "#3564bd" },
  kompletny: { bg: "#e5f6eb", text: "#2f7a4c" },
  zakonczony: { bg: "#e5f6eb", text: "#2f7a4c" },
  anulowany: { bg: "#fbe9ea", text: "#a13d47" },
};

export default function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const { bg, text } = STATUS_COLORS[status];

  return (
    <span
      className="inline-flex h-6 items-center rounded-full px-[9px] text-[10px] font-semibold"
      style={{ background: bg, color: text }}
    >
      {SESSION_STATUS_LABELS[status]}
    </span>
  );
}
