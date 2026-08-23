export type LibraryTabKey = "owned" | "wishlist";

export const LIBRARY_TABS: { key: LibraryTabKey; label: string }[] = [
  { key: "owned", label: "Moje książki" },
  { key: "wishlist", label: "Chcę kupić" },
];

export default function LibraryTabs({ tab, onChange }: { tab: LibraryTabKey; onChange: (tab: LibraryTabKey) => void }) {
  return (
    <div className="flex gap-[30px] overflow-x-auto border-b border-[#e6deec]" role="tablist" aria-label="Widok biblioteki">
      {LIBRARY_TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={tab === t.key}
          onClick={() => onChange(t.key)}
          className={
            tab === t.key
              ? "flex h-[52px] shrink-0 items-center border-b-2 border-[#5b2a86] px-1 text-sm font-medium text-[#5b2a86]"
              : "flex h-[52px] shrink-0 items-center px-1 text-sm text-[#706878] transition-colors hover:text-[#5b2a86]"
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
