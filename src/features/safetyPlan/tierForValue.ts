import type { WarningTier } from '../../data/types';

/**
 * Which warning tier of the safety plan a tension value belongs to:
 * gelb = Fruehwarnbereich (60-69), orange = Hyperarousal (70-84) or
 * Rueckzug (under 15), rot = the extremes (85 and up, or under 5).
 * Null inside the comfortable range. Used to (a) file a body sign the
 * Koerperdetektiv found under the right tier and (b) pick the plan items
 * that belong first in the personal roadmap.
 */
export function tierForValue(value: number): WarningTier | null {
  if (value < 5) return 'rot';
  if (value < 15) return 'orange';
  if (value >= 85) return 'rot';
  if (value >= 70) return 'orange';
  if (value >= 60) return 'gelb';
  return null;
}
