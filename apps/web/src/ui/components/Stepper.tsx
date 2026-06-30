import { Check } from "lucide-react";

export type Step = {
  label: string;
  description?: string;
  state: "done" | "current" | "pending";
};

export function Stepper({ steps }: { steps: Step[] }) {
  return (
    <ol className="stepper" aria-label="Cycle Source-to-Contract">
      {steps.map((step, index) => (
        <li key={`${step.label}-${index}`} className={`step ${step.state}`}>
          <span className="step-marker">
            {step.state === "done" ? <Check size={14} /> : index + 1}
          </span>
          <div>
            <strong>{step.label}</strong>
            {step.description && <span>{step.description}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}