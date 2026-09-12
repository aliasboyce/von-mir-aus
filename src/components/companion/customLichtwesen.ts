import { createRepository, createId } from '../../services/storage/repository';
import { LICHTWESEN, type LichtwesenConfig, type LichtwesenMovement, type LichtwesenEyeStyle } from './lichtwesen';
import type { CompanionCategory } from './companionRegistry';

export const customLichtwesenRepo = createRepository<LichtwesenConfig>('custom-lichtwesen');

const DEFAULT_PREFERRED_CATEGORIES: CompanionCategory[] = ['positiv', 'beruhigend'];

/** Guards against custom beings saved before preferredCategories existed. */
function normalize(being: LichtwesenConfig): LichtwesenConfig {
  return { ...being, preferredCategories: being.preferredCategories ?? DEFAULT_PREFERRED_CATEGORIES };
}

/** All selectable beings — the 16 built-in ones plus anything the person created. */
export function getAllLichtwesen(): LichtwesenConfig[] {
  return [...LICHTWESEN, ...customLichtwesenRepo.getAll().map(normalize)];
}

export function getAnyLichtwesen(id: string | undefined): LichtwesenConfig {
  return normalize(getAllLichtwesen().find((l) => l.id === id) ?? LICHTWESEN[0]);
}

export function createCustomLichtwesen(params: {
  name: string;
  color: string;
  glow: string;
  movement: LichtwesenMovement;
  eyeStyle: LichtwesenEyeStyle;
  preferredCategories: CompanionCategory[];
}): LichtwesenConfig {
  const being: LichtwesenConfig = {
    id: createId('lw'),
    name: params.name,
    color: params.color,
    glow: params.glow,
    trait: '',
    movement: params.movement,
    eyeStyle: params.eyeStyle,
    preferredCategories: params.preferredCategories,
  };
  customLichtwesenRepo.save(being);
  return being;
}

/** Only ever called with a custom being's id — built-in beings live in the
 * hardcoded LICHTWESEN array and are never in this repo, so there's no way
 * to accidentally overwrite one through here. */
export function updateCustomLichtwesen(
  id: string,
  params: {
    name: string;
    color: string;
    glow: string;
    movement: LichtwesenMovement;
    eyeStyle: LichtwesenEyeStyle;
    preferredCategories: CompanionCategory[];
  },
): LichtwesenConfig {
  const existing = customLichtwesenRepo.getById(id);
  const being: LichtwesenConfig = {
    id,
    name: params.name,
    color: params.color,
    glow: params.glow,
    trait: existing?.trait ?? '',
    movement: params.movement,
    eyeStyle: params.eyeStyle,
    preferredCategories: params.preferredCategories,
  };
  customLichtwesenRepo.save(being);
  return being;
}

/** Same protection as above — this only ever operates on the custom-beings
 * store, so a built-in being's id passed here (which shouldn't happen, but
 * just in case) simply matches nothing and does nothing. */
export function deleteCustomLichtwesen(id: string): void {
  customLichtwesenRepo.remove(id);
}

/** A soft, lighter tint derived from a hex color — used as the glow when the
 * person picks a custom color and hasn't chosen a separate glow shade. */
export function deriveGlow(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#F0EAD9';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const lighten = (c: number) => Math.round(c + (255 - c) * 0.62);
  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(lighten(r))}${toHex(lighten(g))}${toHex(lighten(b))}`;
}
