import { IconBook2, IconNotes, IconSquareCheck, IconUpload } from "@tabler/icons-react";

type QuickAction = {
  key: string;
  label: string;
  icon: typeof IconUpload;
  onClick: () => void;
};

export default function QuickActionsCard({
  onNavigateVersions,
  onNavigateSources,
  onNavigateTasks,
  onNavigateNotes,
}: {
  onNavigateVersions: () => void;
  onNavigateSources: () => void;
  onNavigateTasks: () => void;
  onNavigateNotes: () => void;
}) {
  const actions: QuickAction[] = [
    { key: "version", label: "Dodaj wersję", icon: IconUpload, onClick: onNavigateVersions },
    { key: "source", label: "Dodaj źródło", icon: IconBook2, onClick: onNavigateSources },
    { key: "task", label: "Dodaj zadanie", icon: IconSquareCheck, onClick: onNavigateTasks },
    { key: "note", label: "Dodaj notatkę", icon: IconNotes, onClick: onNavigateNotes },
  ];

  return (
    <section className="rounded-[16px] border border-[#e6deec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <h2 className="text-sm font-semibold text-[#201a2b]">Szybkie akcje</h2>
      <div className="mt-4 flex flex-col gap-2">
        {actions.map(({ key, label, icon: Icon, onClick }) => (
          <button
            key={key}
            type="button"
            onClick={onClick}
            className="flex h-[38px] w-full items-center gap-2.5 rounded-[10px] border border-[#e6deec] bg-white px-3.5 text-left text-sm text-[#201a2b] transition-colors hover:border-[#d9cde5] hover:bg-[#f1eafd] hover:text-[#32134f]"
          >
            <Icon className="h-4 w-4 shrink-0" stroke={1.75} />
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
