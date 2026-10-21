import { createRepository } from '../../services/storage/repository';
import type { SavedMedication } from '../../data/types';

export const savedMedicationsRepo = createRepository<SavedMedication>('saved-medications');

/**
 * A curated palette, not an arbitrary color wheel — chosen to stay
 * clearly distinguishable from each other even with several medications
 * active at once, while still fitting the app's soft, muted overall look
 * (no neon/saturated colors that would clash with the rest of the UI).
 * 16 rather than 8 so a person tracking several medications still has
 * genuinely different-looking options, not near-duplicates. A custom
 * color picker (see MedicationManagerModal) covers anything beyond this.
 */
export const MEDICATION_COLOR_PALETTE = [
  '#5C7ACB', // blue
  '#3F9C7A', // green
  '#C1683F', // clay orange
  '#8A5CB0', // violet
  '#C1495C', // rose
  '#3F9CB0', // teal
  '#B08A3F', // amber
  '#7A5C8A', // plum
  '#4F8A3D', // olive green
  '#B0473F', // brick red
  '#3F6BB0', // steel blue
  '#9C6F3F', // ochre
  '#5C8ABF', // sky blue
  '#8A3F6E', // magenta plum
  '#3F9C9C', // teal cyan
  '#6E7A3F', // moss
];

export function nextSuggestedColor(): string {
  const used = new Set(savedMedicationsRepo.getAll().map((m) => m.color));
  const free = MEDICATION_COLOR_PALETTE.find((c) => !used.has(c));
  return free ?? MEDICATION_COLOR_PALETTE[savedMedicationsRepo.getAll().length % MEDICATION_COLOR_PALETTE.length];
}
