import { useSettings } from '../../../state/SettingsContext';
import { playCompanionSound } from '../../../services/sounds';
import { useCompanionAge } from '../useCompanionAge';
import type { LichtwesenConfig } from '../lichtwesen';
import { AnimalFigure, type AnimalLook } from './AnimalFigure';
import { getAnimal } from './animalRegistry';
import type { AccKind } from './kit';
import { isProp } from './extras';

interface Props {
  being: LichtwesenConfig;
  /** small = floating companion in the corner, large = selection / hero */
  size?: 'small' | 'large';
  onTap?: () => void;
  presence?: boolean;
  joyBurst?: 'hop' | 'spin' | 'wobble' | 'dance' | null;
  sleepStateOverride?: 'awake' | 'settling' | 'sleeping' | 'waking' | 'meditating';
  /** the first-launch name step etc. show a being that is not stored yet */
  isOverride?: boolean;
}

export function lookOf(being: LichtwesenConfig): AnimalLook {
  const a = being.animal;
  // older saves kept items (bone, ball …) in "acc" – they are items now
  const accIsItem = isProp(a?.acc);
  return { variantId: a?.variantId, acc: accIsItem ? undefined : (a?.acc as AccKind | undefined), item: a?.item ?? (accIsItem ? a?.acc : undefined), accColor: a?.accColor, bodyColor: a?.bodyColor, accentColor: a?.accentColor, harness: a?.harness };
}

/**
 * The animal as a companion: same props and same states as the light being, so it stands in for it
 * wherever the companion is shown (dock, hero, timers, "send away / call back").
 */
export function AnimalCompanion({ being, size = 'small', onTap, presence = false, joyBurst = null, sleepStateOverride, isOverride = false }: Props) {
  const { settings } = useSettings();
  const { age } = useCompanionAge(being.adoptedAt);
  const animal = getAnimal(being.animal?.species);
  if (!animal) return null;
  if (size === 'small' && (!settings.brainEnabled || (settings.companionAway && !isOverride))) return null;
  const state = sleepStateOverride ?? settings.brainState ?? 'awake';
  const dimension = size === 'large' ? 108 : 76;
  return (
    <div
      style={{
        display: 'inline-block',
        transform: presence ? 'scale(1.28)' : 'scale(1)',
        transformOrigin: size === 'large' ? 'center' : 'bottom right',
        transition: settings.reduceMotion ? 'none' : 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <AnimalFigure
        animal={animal}
        look={lookOf(being)}
        age={age}
        state={state}
        joy={joyBurst}
        size={dimension}
        onClick={() => {
          playCompanionSound('giggle', settings, animal.id);
          onTap?.();
        }}
      />
    </div>
  );
}
