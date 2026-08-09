import { RESEARCH_CONTAINER_CLASS } from "./constants";

type Step = { number: string; label: string; description: string };

type Props = {
  heading: [string, string, string];
  steps: [Step, Step, Step, Step];
};

export default function ResearchProcess({ heading, steps }: Props) {
  return (
    <section className="research-process">
      <div className={RESEARCH_CONTAINER_CLASS}>
        <div className="research-process-grid">
          <h2 className="research-process-heading">
            {heading[0]}
            <br />
            {heading[1]}
            <br />
            {heading[2]}
          </h2>

          <div className="research-process-steps">
            {steps.map((step) => (
              <div key={step.number} className="research-process-step">
                <p className="research-process-step-label">
                  <span className="research-process-step-number">{step.number} —</span>
                  {step.label}
                </p>
                <p className="research-process-step-desc">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
