import { useState } from 'react';
import { LICHTWESEN } from './lichtwesen';
import { LichtCompanion } from './LichtCompanion';
import { useSettings } from '../../state/SettingsContext';
import { useT } from '../../i18n';
import { Button } from '../ui/Button';

const FIRST_COMPANION_ID = 'verlaesslich';

interface FirstNameStepProps {
  onDone: () => void;
}

/**
 * Shown once, at the very first launch, instead of the full companion
 * picker - always assigns "Verlässlich" and asks the person's name. The
 * picker itself is unchanged and stays reachable from Settings any time
 * afterward for actually choosing/changing a companion.
 */
export function FirstNameStep({ onDone }: FirstNameStepProps) {
  const { updateSettings } = useSettings();
  const t = useT();
  const [name, setName] = useState('');
  const [greeted, setGreeted] = useState(false);
  const [joyBurst, setJoyBurst] = useState<'hop' | 'spin' | 'wobble' | 'dance' | null>(null);
  const being = LICHTWESEN.find((b) => b.id === FIRST_COMPANION_ID) ?? LICHTWESEN[0];

  function advanceToNameStep() {
    setGreeted(true);
    setJoyBurst('hop');
    setTimeout(() => setJoyBurst(null), 700);
  }

  function submit(skip: boolean) {
    updateSettings({
      selectedBrainId: being.id,
      companionChosen: true,
      brainState: 'awake',
      userName: skip ? undefined : name.trim() || undefined,
    });
    onDone();
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-6 pt-14 animate-in"
      style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex-1 w-full flex flex-col items-center justify-center min-h-0">
        <LichtCompanion size="large" beingOverride={being} presence joyBurst={joyBurst} />

        {!greeted ? (
          <div key="greeting" className="animate-in mt-6 w-full max-w-[280px] mx-auto text-center">
            <p className="text-[18px] text-[var(--color-text)] leading-snug mb-2">{t.companion.helloIAmCompanion}</p>
            <p className="text-[15px] text-[var(--color-text-muted)] leading-snug">{t.companion.helloWarmWelcome}</p>
          </div>
        ) : (
          <div key="name" className="animate-in mt-4 w-full max-w-[280px] mx-auto text-center">
            <p className="text-[15px] text-[var(--color-text-muted)] mb-1" style={{ fontFamily: 'var(--font-companion)', fontWeight: 600 }}>{being.name}</p>
            <h1 className="text-[22px] leading-snug">{t.companion.askNameTitle}</h1>
          </div>
        )}
      </div>

      <div className="w-full max-w-[280px] mx-auto flex-shrink-0 pt-6">
        {!greeted ? (
          <Button fullWidth onClick={advanceToNameStep}>
            {t.companion.pickerContinue}
          </Button>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit(false);
            }}
          >
            <input
              autoFocus
              className="input text-center"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.companion.askNamePlaceholder}
              maxLength={30}
            />
            <Button type="submit" fullWidth disabled={!name.trim()}>
              {t.common.save}
            </Button>
            <button type="button" onClick={() => submit(true)} className="text-[13px] text-[var(--color-text-faint)]">
              {t.companion.askNameSkip}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
