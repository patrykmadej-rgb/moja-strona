import { RESEARCH_CONTAINER_CLASS } from "./constants";

type Props = {
  headingLine1: string;
  headingLine2: string;
  intro: string;
  questions: [string, string, string];
};

/** Pełnoszerokościowa sekcja w kolorze ciemnej śliwki — jedna ciągła kompozycja
 * typograficzna, bez kart. Wyłamanie na szerokość viewportu tą samą techniką co
 * sekcje "PIĘĆ FILARÓW" / "CYTAT" na stronie głównej (src/app/(site)/[locale]/page.tsx). */
export default function ResearchQuestions({ headingLine1, headingLine2, intro, questions }: Props) {
  return (
    <section className="relative mt-20 lg:mt-28">
      <div className="relative left-[calc(-50vw+50%)] w-screen bg-[var(--research-plum-900)] py-16 lg:py-24">
        <div
          className={`${RESEARCH_CONTAINER_CLASS} grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.3fr] lg:gap-20`}
        >
          <div>
            <h2 className="research-font-display text-3xl leading-[1.05] font-medium text-[var(--research-ivory)] uppercase lg:text-[40px]">
              {headingLine1}
              <br />
              {headingLine2}
            </h2>
            <p className="mt-5 max-w-[380px] leading-relaxed text-[var(--research-ivory)]/70">{intro}</p>
          </div>
          <div>
            {questions.map((q, i) => (
              <p
                key={q}
                className={`research-font-display text-2xl leading-snug font-medium text-[var(--research-ivory)] sm:text-[28px] lg:text-3xl ${
                  i > 0 ? "border-t border-[var(--research-gold)]/30 pt-8" : ""
                } ${i < questions.length - 1 ? "pb-8" : ""}`}
              >
                {q}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
