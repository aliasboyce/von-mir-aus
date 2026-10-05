import { skillkettenRepo } from './skillkettenRepo';
import { AROUSAL_BANDS } from '../polyvagal/arousalBands';
import type { Skillkette } from '../../data/types';

/**
 * "Skills und Skillketten geordnet fuer den jeweiligen
 * Anspannungsbereich"-Auftrag — which saved chains are worth offering
 * in a given zone. A chain is a path DOWN the tension scale (see the
 * Skillkette concept text), so it only makes sense from the Fruehwarn-
 * bereich upward: it fits a zone when the chain's own start tension
 * (startProzent) reaches that zone, or when no start value was entered
 * at all. Hypoarousal gets none — there the way is up, not down; skills
 * tagged for that zone are shown instead.
 */
export function skillkettenForZone(zoneId: string): Skillkette[] {
  if (zoneId !== 'zone4' && zoneId !== 'zone5') return [];
  const band = AROUSAL_BANDS.find((b) => b.id === zoneId);
  if (!band) return [];
  return skillkettenRepo
    .getAll()
    .filter((k) => {
      const start = parseFloat((k.startProzent ?? '').replace(',', '.'));
      return Number.isNaN(start) || start >= band.min;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
