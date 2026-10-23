import { LichtCompanion } from './LichtCompanion';
import { useSettings } from '../../state/SettingsContext';

interface InlineCompanionNoteProps {
  joyBurst?: 'hop' | 'spin' | 'wobble' | 'dance' | null;
  sleepStateOverride?: 'awake' | 'settling' | 'sleeping' | 'waking' | 'meditating';
  onTap?: () => void;
}

/**
 * Drop-in replacement for `<LichtCompanion size="small" />` used
 * decoratively inside page content (explainer cards, highlighted tips,
 * etc.).
 *
 * Also the single fix point for "vollständig abschaltbar" (fully
 * disableable): when brainEnabled is off, this renders nothing at all
 * rather than still showing the avatar inline on every page that uses
 * it — without this, turning the companion off in Settings wouldn't
 * actually remove it from Zugang, Orientierung, and everywhere else
 * this component is used.
 *
 * "Anleitung stirbt ab beim Weiterklicken"-Auftrag — this used to also
 * call useRegisterHeroCompanion(settings.brainEnabled), registering
 * EVERY inline usage as "the" hero companion. That's redundant (the
 * actual large Home companion already registers itself correctly via
 * CompanionDock's own useRegisterHeroCompanion(variant === 'hero'))
 * and, worse, actively circular wherever a caller decides whether to
 * render this component based on heroMounted — exactly what
 * AppTourOverlay does ({!heroMounted && <InlineCompanionNote />}):
 * render → registers as hero → heroMounted flips true → condition
 * now false → unmounts → unregisters → heroMounted flips false →
 * condition true again → mounts → ... forever, which is precisely
 * React's "Maximum update depth exceeded" (error #185). Removed the
 * registration here; CompanionDock's own hero instance is the only
 * one that should ever claim the slot.
 */
export function InlineCompanionNote({ joyBurst = null, sleepStateOverride, onTap }: InlineCompanionNoteProps = {}) {
  const { settings } = useSettings();
  if (!settings.brainEnabled) return null;
  return <LichtCompanion size="small" joyBurst={joyBurst} sleepStateOverride={sleepStateOverride} onTap={onTap} />;
}
