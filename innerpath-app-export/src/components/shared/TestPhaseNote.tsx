import { useSettings } from '../../state/SettingsContext';
import { TEST_PHASE } from '../../services/testSupport';

export const TEST_PHASE_NOTE_DE = 'Wir befinden uns in der Testphase. Es sind noch viele unseriöse Dinge mit drin – da ändert sich noch einiges. Das ist Absicht.';
export const TEST_PHASE_NOTE_EN = 'We are in the test phase. There are still many unserious things in here – a lot will still change. That is on purpose.';

/** Small, calm note: this is a test version, much of it is unserious on purpose and will change. */
export function TestPhaseNote({ className = '' }: { className?: string }) {
  const { settings } = useSettings();
  if (!TEST_PHASE) return null;
  return (
    <p className={`text-[12px] text-[var(--color-text-faint)] leading-relaxed text-center ${className}`} data-testid="test-phase-note">
      🧪 {settings.language === 'en' ? TEST_PHASE_NOTE_EN : TEST_PHASE_NOTE_DE}
    </p>
  );
}
