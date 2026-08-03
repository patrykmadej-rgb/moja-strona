import { BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { RESEARCH_CONTAINER_CLASS } from "./constants";

type Props = {
  eyebrow: string;
  heading: string;
  body: string;
  linkLabel: string;
  questionsEyebrow: string;
  questions: string[];
};

export default function ResearchClosingSection({
  eyebrow,
  heading,
  body,
  linkLabel,
  questionsEyebrow,
  questions,
}: Props) {
  return (
    <section className={`${RESEARCH_CONTAINER_CLASS} pt-12 pb-16 lg:pt-16 lg:pb-24`}>
      <div className="rounded-research-lg border border-[var(--research-line)] bg-[var(--research-paper)] p-8 md:p-12 dark:border-white/10 dark:bg-neutral-900">
        <div className="grid gap-10 md:grid-cols-2 md:gap-14">
          <div>
            <span
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--research-lavender-soft)] text-[var(--research-violet)]"
            >
              <BookOpen className="h-5 w-5" />
            </span>
            <p className="mt-5 text-xs font-semibold tracking-[0.22em] uppercase text-[var(--research-violet)] dark:text-purple-400">
              {eyebrow}
            </p>
            <h2 className="research-font-display mt-3 text-2xl leading-snug font-semibold text-[#1C1028] dark:text-white">
              {heading}
            </h2>
            <p className="mt-4 leading-relaxed text-[#4A3360] dark:text-neutral-300">{body}</p>
            <Link
              href="/#o-mnie"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--research-violet)] transition-transform hover:translate-x-1 dark:text-purple-300"
            >
              {linkLabel} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="border-t border-[var(--research-line)] pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-14 dark:border-white/10">
            <h3 className="text-xs font-semibold tracking-[0.22em] uppercase text-[var(--research-violet)] dark:text-purple-400">
              {questionsEyebrow}
            </h3>
            <ul className="mt-4 space-y-3">
              {questions.map((q) => (
                <li key={q} className="flex gap-2.5 text-sm leading-relaxed text-[#4A3360] dark:text-neutral-300">
                  <span aria-hidden="true" className="mt-0.5 shrink-0 font-semibold text-[var(--research-gold)]">
                    ✓
                  </span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
