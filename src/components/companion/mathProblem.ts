export interface MathProblem {
  question: string;
  answer: number;
}

/**
 * Generated fresh each time rather than drawn from a static pool —
 * simple arithmetic has effectively infinite genuine variety, so a
 * fixed list would just mean memorizing answers instead of actually
 * doing the small mental-math task. Kept deliberately easy (small
 * numbers, addition/subtraction, occasional light multiplication) so
 * this stays a gentle distraction, not a frustrating test.
 */
export function generateMathProblem(): MathProblem {
  const kind = Math.random();
  if (kind < 0.45) {
    const a = Math.floor(Math.random() * 40) + 10;
    const b = Math.floor(Math.random() * 40) + 10;
    return { question: `${a} + ${b} = ?`, answer: a + b };
  }
  if (kind < 0.85) {
    const a = Math.floor(Math.random() * 50) + 20;
    const b = Math.floor(Math.random() * 20) + 5;
    return { question: `${a} - ${b} = ?`, answer: a - b };
  }
  const a = Math.floor(Math.random() * 9) + 2;
  const b = Math.floor(Math.random() * 9) + 2;
  return { question: `${a} × ${b} = ?`, answer: a * b };
}
