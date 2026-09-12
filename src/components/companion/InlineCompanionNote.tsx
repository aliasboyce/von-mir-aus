import { LichtCompanion } from './LichtCompanion';
import { useRegisterHeroCompanion } from '../../state/HeroCompanionContext';
import { useSettings } from '../../state/SettingsContext';

interface InlineCompanionNoteProps {
  joyBurst?: 'hop' | 'spin' | 'wobble' | 'dance' | null;
  sleepStateOverride?: 'awake' | 'settling' | 'sleeping' | 'waking' | 'meditating';
  onTap?: () => void;
}

/**
 * Drop-in replacement for `<LichtCompanion size="small" />` used
 * decoratively inside page content (explainer cards, highlighted tips,
 * etc.) - registers with the same HeroCompanionContext used by the large
 * Home companion, so the floating dock automatically hides itself for as
 * long as this is mounted. This is the structural fix for "the companion
 * shows up twice": every inline usage goes through this one component
 * instead of each page needing to remember to handle it separately.
 *
 * Also the single fix point for "vollständig abschaltbar" (fully
 * disableable): when brainEnabled is off, this renders nothing at all
 * rather than still showing the avatar inline on every page that uses
 * it — without this, turning the companion off in Settings wouldn't
 * actually remove it from Zugang, Orientierung, and everywhere else
 * this component is used.
 */
export function InlineCompanionNote({ joyBurst = null, sleepStateOverride, onTap }: InlineCompanionNoteProps = {}) {
  const { settings } = useSettings();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useRegisterHeroCompanion(settings.brainEnabled);
  if (!settings.brainEnabled) return null;
  return <LichtCompanion size="small" joyBurst={joyBurst} sleepStateOverride={sleepStateOverride} onTap={onTap} />;
}
