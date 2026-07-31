import type { ComponentType } from "react";

export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
  compact = false,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "flex flex-col items-center justify-center gap-2 py-4 text-center"
          : "flex min-h-[120px] flex-col items-center justify-center gap-2 py-6 text-center"
      }
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#f1eafd] text-[#5b2a86]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-1 text-sm font-medium text-[#201a2b]">{title}</p>
      {subtitle && <p className="max-w-xs text-xs text-[#706878]">{subtitle}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 rounded-[10px] bg-[#5b2a86] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#32134f]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
