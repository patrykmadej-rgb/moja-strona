export type SessionTabKey =
  | "przeglad"
  | "plan"
  | "podroz"
  | "zakwaterowanie"
  | "platnosci"
  | "koszty"
  | "materialy"
  | "dokumenty"
  | "notatki"
  | "historia";

export const SESSION_TABS: { key: SessionTabKey; label: string; enabled: boolean }[] = [
  { key: "przeglad", label: "Przegląd", enabled: true },
  { key: "plan", label: "Plan zajęć", enabled: false },
  { key: "podroz", label: "Podróż", enabled: true },
  { key: "zakwaterowanie", label: "Zakwaterowanie", enabled: true },
  { key: "platnosci", label: "Płatności", enabled: true },
  { key: "koszty", label: "Koszty", enabled: true },
  { key: "materialy", label: "Materiały", enabled: false },
  { key: "dokumenty", label: "Dokumenty", enabled: false },
  { key: "notatki", label: "Notatki", enabled: false },
  { key: "historia", label: "Historia zmian", enabled: false },
];

export default function SessionTabs({
  tab,
  onChange,
}: {
  tab: SessionTabKey;
  onChange: (tab: SessionTabKey) => void;
}) {
  return (
    <div className="flex gap-[30px] overflow-x-auto border-b border-[#e8e2ec]">
      {SESSION_TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={
            tab === t.key
              ? "flex h-[52px] shrink-0 items-center border-b-2 border-[#5b2a86] px-1 text-sm font-medium text-[#5b2a86]"
              : t.enabled
                ? "flex h-[52px] shrink-0 items-center px-1 text-sm text-[#706878] transition-colors hover:text-[#5b2a86]"
                : "flex h-[52px] shrink-0 items-center px-1 text-sm text-[#706878]/50"
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
