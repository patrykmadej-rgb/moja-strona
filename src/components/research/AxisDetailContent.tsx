import type { LocalizedResearchAxis, ResearchAxisId } from "@/lib/research";

type Labels = {
  questionsHeading: string;
  tagsHeading: string;
  seeRelatedProjects: string;
};

export default function AxisDetailContent({
  axis,
  labels,
  onSeeRelated,
}: {
  axis: LocalizedResearchAxis;
  labels: Labels;
  onSeeRelated: (id: ResearchAxisId) => void;
}) {
  return (
    <div className="grid gap-8 pt-6 pb-2 sm:grid-cols-2">
      <div>
        <p className="leading-relaxed text-[#4A3360] dark:text-neutral-300">{axis.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {axis.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-research-md bg-[var(--research-lavender-soft)] px-3 py-1 text-xs font-medium text-[var(--research-plum-800)] dark:bg-purple-900/30 dark:text-purple-200"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--research-violet)] dark:text-purple-400">
          {labels.questionsHeading}
        </p>
        <ul className="mt-3 space-y-2.5">
          {axis.questions.map((q) => (
            <li key={q} className="flex gap-2.5 text-sm leading-relaxed text-[#4A3360] dark:text-neutral-300">
              <span className="mt-0.5 shrink-0 text-[var(--research-gold)]">—</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => onSeeRelated(axis.id)}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--research-violet)] transition-transform hover:translate-x-1 dark:text-purple-300"
        >
          {labels.seeRelatedProjects}
        </button>
      </div>
    </div>
  );
}
