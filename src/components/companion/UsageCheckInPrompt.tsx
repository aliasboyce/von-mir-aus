import { useT } from '../../i18n';

export type UsageCheckInContext = 'game' | 'app';

interface UsageCheckInPromptProps {
  context: UsageCheckInContext;
  onContinue: () => void;
  onExit: () => void;
}

/**
 * "Nach 5 Min Spiel / 15 Min App eine Erinnerung vom Wesen, ob das
 * gerade noch gut tut, mit Ja weiter / Nein raus, die sich wie beim
 * Nur-jetzt-Modus oben drauf legt"-Auftrag — deliberately the same
 * visual weight and z-index family as TooMuchModal (the app's
 * existing "this is genuinely stopping everything" pattern) rather
 * than a dismissible toast: this is a real pause-and-ask moment, not
 * a notification to swipe away. No "later" or "remind me again" — a
 * clear yes/no keeps the check honest rather than easy to defer
 * indefinitely.
 */
export function UsageCheckInPrompt({ context, onContinue, onExit }: UsageCheckInPromptProps) {
  const t = useT();
  const copy = context === 'game' ? t.usageCheckIn.game : t.usageCheckIn.app;

  return (
    <div className="fixed inset-0 z-[430] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-[380px] rounded-[var(--radius-xl)] p-5 animate-in text-center" style={{ background: 'var(--color-surface)' }}>
        <p className="text-[15px] font-medium text-[var(--color-text)] mb-2">{copy.title}</p>
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-5">{copy.question}</p>
        <div className="flex gap-2">
          <button
            onClick={onExit}
            className="flex-1 py-2.5 rounded-full text-[14px]"
            style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text)' }}
          >
            {t.usageCheckIn.exitCta}
          </button>
          <button
            onClick={onContinue}
            className="flex-1 py-2.5 rounded-full text-[14px]"
            style={{ background: 'var(--color-primary)', color: 'var(--color-surface)' }}
          >
            {t.usageCheckIn.continueCta}
          </button>
        </div>
      </div>
    </div>
  );
}
