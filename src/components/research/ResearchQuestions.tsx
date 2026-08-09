import { RESEARCH_CONTAINER_CLASS } from "./constants";

type Props = {
  labelLine1: string;
  labelLine2: string;
  questions: [string, string, string];
};

/** Mały, czysto dekoracyjny fragment "neuralny" przy separatorze wiersza. */
function QuestionMotif() {
  return (
    <svg aria-hidden="true" width="30" height="10" viewBox="0 0 30 10" className="research-question-motif">
      <path d="M0,5 Q8,1 15,5 T30,5" stroke="var(--research-gold)" strokeWidth="1" fill="none" opacity="0.55" />
      <circle cx="30" cy="5" r="1.4" fill="var(--research-gold)" opacity="0.7" />
    </svg>
  );
}

export default function ResearchQuestions({ labelLine1, labelLine2, questions }: Props) {
  return (
    <section className="research-questions">
      <div className={RESEARCH_CONTAINER_CLASS}>
        <div className="research-questions-grid">
          <h2 className="research-questions-label">
            {labelLine1}
            <br />
            {labelLine2}
          </h2>

          <div>
            {questions.map((q, i) => (
              <div key={q} className="research-question-row">
                <span className="research-question-number" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="research-question-text">{q}</p>
                <span className="research-question-arrow" aria-hidden="true">
                  →
                </span>
                <QuestionMotif />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
