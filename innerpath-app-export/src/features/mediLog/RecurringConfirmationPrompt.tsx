import { Check, X, Clock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { useT } from '../../i18n';
import type { PendingInstance } from './recurringPending';

interface RecurringConfirmationPromptProps {
  pending: PendingInstance[];
  onAnswer: (instance: PendingInstance, answer: 'taken' | 'skipped' | 'now') => void;
}

/**
 * Deliberately friendly, not naggy: shown once, inline on the page (not
 * a blocking modal the person has to dismiss), lists every pending
 * instance together rather than one popup per medication. "Ja" records
 * the dose at its originally scheduled time; "Mach ich jetzt" records it
 * at the current time instead, for whenever the confirmation itself
 * happens later than the dose actually was/will be taken.
 */
export function RecurringConfirmationPrompt({ pending, onAnswer }: RecurringConfirmationPromptProps) {
  const t = useT();

  if (pending.length === 0) return null;

  return (
    <Card padding="lg" className="mb-5 animate-in">
      <div className="flex items-start gap-3 mb-3">
        <InlineCompanionNote />
        <p className="text-[14px] text-[var(--color-text)] flex-1">{t.mediLog.recurringPromptTitle}</p>
      </div>
      <div className="flex flex-col gap-3">
        {pending.map((p) => (
          <div key={`${p.recurring.id}-${p.time}`} className="rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] p-3">
            <p className="text-[14px] text-[var(--color-text)] mb-0.5">
              {p.recurring.name}
              {p.recurring.doseValue != null && ` — ${p.recurring.doseValue} ${p.recurring.doseUnit ?? ''}`}
            </p>
            <p className="text-[12px] text-[var(--color-text-faint)] mb-1.5">{t.mediLog.scheduledFor.replace('{time}', p.time)}</p>
            <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">{t.mediLog.takenTodayQuestion}</p>
            <p className="text-[11px] text-[var(--color-text-faint)] mb-2.5">{t.mediLog.recurringAnswerHint}</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => onAnswer(p, 'taken')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] bg-[var(--color-primary)] text-[var(--color-surface)]"
              >
                <Check size={13} /> {t.mediLog.answerYes}
              </button>
              <button
                onClick={() => onAnswer(p, 'now')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]"
              >
                <Clock size={13} /> {t.mediLog.answerNow}
              </button>
              <button
                onClick={() => onAnswer(p, 'skipped')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] text-[var(--color-text-faint)]"
              >
                <X size={13} /> {t.mediLog.answerNo}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
