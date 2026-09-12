interface ZugangStepHeaderProps {
  question: string;
  hint?: string;
  questionOnly?: boolean;
}

/**
 * The one place every Zugang step's heading + hint text gets centered
 * — built after "text-center + max-w + mx-auto" copy-pasted across 11
 * separate step blocks kept being reported as drifting back to
 * left-aligned. Rather than re-verify that combination for the
 * twelfth time, this uses `flex flex-col items-center` instead:
 * centering via flex alignment doesn't depend on text-align being
 * correctly inherited/applied, or on margin-inline:auto having room to
 * work with, so it can't silently regress the same way. Every step now
 * renders its heading and hint through this one component instead of
 * hand-writing the same three classes repeatedly.
 */
export function ZugangStepHeader({ question, hint, questionOnly }: ZugangStepHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center mb-5 w-full">
      <h1 className={`text-[22px] ${questionOnly ? '' : 'mb-1'}`}>{question}</h1>
      {hint && <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed max-w-[300px]">{hint}</p>}
    </div>
  );
}
