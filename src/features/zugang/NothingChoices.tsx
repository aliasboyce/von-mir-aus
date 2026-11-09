import { NOTHING_CHOICES, type NothingStep } from './zugangContent';
import { zl } from './zugangEn';
import { useT } from '../../i18n';

/**
 * "Man muss nicht immer etwas finden": a quiet row under the choices of a step. Picking one says "I looked – nothing of
 * these / not right now", which is a complete answer and is never treated as missing.
 */
export function NothingChoices({ step, selected, onPick }: { step: NothingStep; selected: string[]; onPick: (v: string) => void }) {
  const t = useT();
  return (
    <div className="mt-5 pt-4 border-t border-[var(--color-border)]" data-testid={`nothing-${step}`}>
      <p className="text-[12px] text-[var(--color-text-faint)] mb-2">{t.zugang.nothingLabel}</p>
      <div className="flex flex-wrap gap-2">
        {NOTHING_CHOICES[step].map((m) => {
          const on = selected.includes(m);
          return (
            <button key={m} type="button" onClick={() => onPick(m)} aria-pressed={on} data-testid={`nothing-${step}-${NOTHING_CHOICES[step].indexOf(m)}`}
              className="px-3.5 py-2 rounded-full text-[14px] border border-dashed"
              style={{ borderColor: on ? 'var(--color-primary)' : 'var(--color-border-strong)', background: on ? 'var(--color-primary-soft)' : 'transparent', color: 'var(--color-text)' }}>
              {on ? '✓ ' : ''}{zl(m)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
