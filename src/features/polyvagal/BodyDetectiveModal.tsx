import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useT } from '../../i18n';
import { bandForValue } from './arousalBands';

/**
 * "Koerper-Detektiv"-Auftrag — for people whose interoception is
 * blocked (a well-documented effect of high stress or dissociation:
 * the brain cuts the felt connection to the body), asking directly
 * "where are you on a 0-100 scale" doesn't work. This offers three
 * concrete, physically-checkable questions instead — the person
 * doesn't have to interpret or estimate anything abstract, just
 * notice which description currently matches. The app converts the
 * answers into the matching percentage itself.
 *
 * Deliberately not a diagnostic tool — it's a bridge back to feeling
 * the body, matching the "kein Leistungsdruck, wertfrei" principle
 * that runs through the rest of this app.
 */
interface BodyDetectiveModalProps {
  onClose: () => void;
  onResult: (value: number) => void;
}

interface Option {
  id: string;
  text: string;
  weight: number;
}

function useQuestions(): { id: string; question: string; options: Option[] }[] {
  const t = useT();
  return t.polyvagal.bodyDetective.questions.map((q, qi) => ({
    id: `q${qi}`,
    question: q.question,
    options: q.options.map((text, oi) => ({ id: `q${qi}o${oi}`, text, weight: q.weights[oi] })),
  }));
}

export function BodyDetectiveModal({ onClose, onResult }: BodyDetectiveModalProps) {
  const t = useT();
  const questions = useQuestions();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState<number | null>(null);

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  function pick(qId: string, weight: number) {
    setAnswers((prev) => ({ ...prev, [qId]: weight }));
  }

  function evaluate() {
    const values = Object.values(answers);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    setShowResult(avg);
  }

  function applyResult() {
    if (showResult != null) onResult(showResult);
    onClose();
  }

  const band = showResult != null ? bandForValue(showResult) : null;

  return (
    <div className="fixed inset-0 z-[420] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div
        className="w-full max-w-[440px] max-h-[85vh] overflow-y-auto rounded-[var(--radius-xl)] p-5 animate-in"
        style={{ background: 'var(--color-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-2 mb-1">
          <Search size={18} className="text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
          <p className="text-[15px] font-medium text-[var(--color-text)] flex-1">{t.polyvagal.bodyDetective.title}</p>
          <button onClick={onClose} className="text-[var(--color-text-faint)]">
            <X size={18} />
          </button>
        </div>

        {showResult == null ? (
          <>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-4">{t.polyvagal.bodyDetective.intro}</p>
            <div className="flex flex-col gap-5">
              {questions.map((q) => (
                <div key={q.id}>
                  <p className="text-[13.5px] font-medium text-[var(--color-text)] mb-2">{q.question}</p>
                  <div className="flex flex-col gap-2">
                    {q.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => pick(q.id, opt.weight)}
                        className="text-left px-3.5 py-2.5 rounded-[var(--radius-md)] text-[13px]"
                        style={{
                          border: `1.5px solid ${answers[q.id] === opt.weight ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          background: answers[q.id] === opt.weight ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                          color: 'var(--color-text)',
                        }}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={evaluate}
              disabled={!allAnswered}
              className="w-full mt-5 py-3 rounded-full text-[14px]"
              style={{
                background: allAnswered ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                color: allAnswered ? 'var(--color-surface)' : 'var(--color-text-faint)',
              }}
            >
              {t.polyvagal.bodyDetective.evaluateCta}
            </button>
          </>
        ) : (
          <div className="animate-in">
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.polyvagal.bodyDetective.resultIntro}</p>
            <div className="rounded-[var(--radius-lg)] p-4 mb-4 text-center" style={{ background: `${band!.color}18` }}>
              <p className="text-[26px] font-medium" style={{ color: band!.color }}>
                {showResult}%
              </p>
              <p className="text-[13px] font-medium" style={{ color: band!.color }}>
                {t.polyvagal.arousalZones[band!.labelKey as keyof typeof t.polyvagal.arousalZones].label}
              </p>
            </div>
            <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-5">
              {t.polyvagal.arousalZones[band!.labelKey as keyof typeof t.polyvagal.arousalZones].hint}
            </p>
            <button onClick={applyResult} className="w-full py-3 rounded-full text-[14px]" style={{ background: 'var(--color-primary)', color: 'var(--color-surface)' }}>
              {t.polyvagal.bodyDetective.applyCta}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
