import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useT } from '../../i18n';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useRegisterModalOpen } from '../../state/ModalStackContext';

type Answer = 'ja' | 'teilweise' | 'nein' | null;

interface Dimension {
  id: 'wollen' | 'wissen' | 'energie' | 'sicherheit' | 'konkret' | 'erreichbar';
  emoji: string;
}

const DIMENSIONS: Dimension[] = [
  { id: 'wollen', emoji: '❤️' },
  { id: 'wissen', emoji: '🧠' },
  { id: 'energie', emoji: '🔋' },
  { id: 'sicherheit', emoji: '🛡️' },
  { id: 'konkret', emoji: '👣' },
  { id: 'erreichbar', emoji: '🌉' },
];

/**
 * "ChatGPT-Konzept" brief — the user's own described core thesis of
 * the whole app: "Ich will es" ≠ "Ich kann darauf zugreifen." Rather
 * than treating "not doing something helpful" as one flat fact, this
 * walks through the six distinct places the gap between wanting and
 * doing can actually sit — matching the user's own six questions (Will
 * ich? Weiß ich, dass es guttut? Habe ich Energie? Fühlt es sich
 * sicher genug an? Ist es konkret genug? Ist es gerade erreichbar?).
 * Deliberately reusable rather than tied to one page — the same
 * question makes sense from a Zugang pass's "was hat erschwert"
 * reflection and from looking at a bridge that hasn't been working.
 * Never produces a verdict, only names where the answers were "nein"
 * or "teilweise" as something to notice, not a diagnosis.
 */
export function AccessGapModal({ subject, onClose }: { subject?: string; onClose: () => void }) {
  const t = useT();
  useRegisterModalOpen(true);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [showResult, setShowResult] = useState(false);

  const answeredCount = Object.values(answers).filter((a) => a !== null && a !== undefined).length;
  const gaps = DIMENSIONS.filter((d) => answers[d.id] === 'nein' || answers[d.id] === 'teilweise');

  function setAnswer(id: string, a: Answer) {
    setAnswers((prev) => ({ ...prev, [id]: a }));
  }

  return createPortal(
    <div className="fixed inset-0 z-[230] bg-[rgba(44,42,34,0.35)] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-[var(--color-surface)] rounded-t-[24px] sm:rounded-[24px] w-full sm:max-w-[440px] max-h-[85vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-2">
          <p className="text-[18px] text-[var(--color-text)] flex-1">🌉 {t.accessGap.title}</p>
          <button onClick={onClose} aria-label={t.common.close} className="p-1 text-[var(--color-text-faint)] flex-shrink-0">
            <X size={18} />
          </button>
        </div>
        {subject && <p className="text-[13px] text-[var(--color-text-muted)] mb-3">{subject}</p>}

        {!showResult ? (
          <>
            <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mb-4">{t.accessGap.intro}</p>
            <div className="flex flex-col gap-3 mb-5">
              {DIMENSIONS.map((d) => (
                <div key={d.id}>
                  <p className="text-[13px] text-[var(--color-text)] mb-1.5">
                    {d.emoji} {t.accessGap.questions[d.id]}
                  </p>
                  <div className="flex gap-1.5">
                    {(['ja', 'teilweise', 'nein'] as const).map((a) => (
                      <button
                        key={a}
                        onClick={() => setAnswer(d.id, a)}
                        className="flex-1 py-2 rounded-[var(--radius-md)] text-[12px]"
                        style={{
                          background: answers[d.id] === a ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                          color: answers[d.id] === a ? 'var(--color-surface)' : 'var(--color-text)',
                        }}
                      >
                        {t.accessGap.answerLabels[a]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button fullWidth onClick={() => setShowResult(true)} disabled={answeredCount === 0}>
              {t.accessGap.showResultCta}
            </Button>
          </>
        ) : (
          <>
            {gaps.length === 0 ? (
              <Card className="mb-4" style={{ background: 'var(--color-primary-soft)' }}>
                <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{t.accessGap.noGapText}</p>
              </Card>
            ) : (
              <>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.accessGap.gapIntro}</p>
                <div className="flex flex-col gap-2 mb-4">
                  {gaps.map((d) => (
                    <Card key={d.id}>
                      <p className="text-[13px] text-[var(--color-text)]">
                        {d.emoji} {t.accessGap.questions[d.id]}
                      </p>
                      <p className="text-[12px] text-[var(--color-text-faint)] mt-1">{t.accessGap.gapNotes[d.id]}</p>
                    </Card>
                  ))}
                </div>
              </>
            )}
            <p className="text-[11px] text-[var(--color-text-faint)] leading-relaxed mb-4">{t.accessGap.disclaimerText}</p>
            <Button fullWidth variant="ghost" onClick={() => setShowResult(false)}>
              {t.common.back}
            </Button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
