import type { LucideIcon } from "lucide-react";

export default function SessionPlaceholderCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-[16px] border border-[#e8e2ec] bg-white p-5 shadow-[0_4px_18px_rgba(49,30,64,0.035)]">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-[#9a919f]" strokeWidth={1.75} aria-hidden="true" />
        <h2 className="text-sm font-semibold text-[#201a2b]">{title}</h2>
        <span className="ml-auto shrink-0 rounded-full bg-[#efedf0] px-2 py-0.5 text-[10px] font-medium text-[#6f6874]">
          W przygotowaniu
        </span>
      </div>
      <p className="mt-2 text-xs text-[#9a919f]">{description}</p>
    </section>
  );
}
