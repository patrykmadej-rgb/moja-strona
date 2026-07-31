export type TabKey =
  | "przeglad"
  | "wersje"
  | "zrodla"
  | "harmonogram"
  | "notatki"
  | "zadania"
  | "pliki";

export const TABS: { key: TabKey; label: string; enabled: boolean }[] = [
  { key: "przeglad", label: "Przegląd", enabled: true },
  { key: "wersje", label: "Wersje", enabled: true },
  { key: "zrodla", label: "Źródła", enabled: true },
  { key: "harmonogram", label: "Harmonogram", enabled: true },
  { key: "notatki", label: "Notatki", enabled: true },
  { key: "zadania", label: "Zadania", enabled: false },
  { key: "pliki", label: "Pliki", enabled: true },
];

export default function ArticleTabs({
  tab,
  onChange,
}: {
  tab: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  return (
    <div className="flex gap-[30px] overflow-x-auto border-b border-[#e6deec]">
      {TABS.map((t) => (
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
