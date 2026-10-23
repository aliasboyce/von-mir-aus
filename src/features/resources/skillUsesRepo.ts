import { createRepository } from '../../services/storage/repository';
import type { SkillUse } from '../../data/types';

export const skillUsesRepo = createRepository<SkillUse>('skill-uses');

function sameLocalDay(iso: string, day: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
}

export function skillUsesOnDay(day: Date = new Date()): SkillUse[] {
  return skillUsesRepo
    .getAll()
    .filter((u) => sameLocalDay(u.endedAt, day))
    .sort((a, b) => a.endedAt.localeCompare(b.endedAt));
}

export function skillUsesInLastDays(days: number): SkillUse[] {
  const since = Date.now() - days * 24 * 3600 * 1000;
  return skillUsesRepo
    .getAll()
    .filter((u) => new Date(u.endedAt).getTime() >= since)
    .sort((a, b) => a.endedAt.localeCompare(b.endedAt));
}

/** Distance from the personal-tolerance window (15-69 on the new scale):
 * 0 inside it. Used to decide, without judging, whether a value moved
 * TOWARD the window — works for both directions (calming down from
 * hyperarousal AND coming up out of hypoarousal). */
export function distanceFromWindow(v: number): number {
  if (v > 69) return v - 69;
  if (v < 15) return 15 - v;
  return 0;
}

export type SkillOutcome = 'moved-toward' | 'same' | 'moved-away' | 'unknown';

export function skillOutcome(u: Pick<SkillUse, 'tensionBefore' | 'tensionAfter'>): SkillOutcome {
  if (u.tensionBefore == null || u.tensionAfter == null) return 'unknown';
  const before = distanceFromWindow(u.tensionBefore);
  const after = distanceFromWindow(u.tensionAfter);
  if (after < before) return 'moved-toward';
  if (after === before) return 'same';
  return 'moved-away';
}

/** How many times a skill run ended closer to the window than it began
 * — the positive "swung back" count shown in the reviews. */
export function countSwungBack(uses: SkillUse[]): number {
  return uses.filter((u) => !u.practice && skillOutcome(u) === 'moved-toward').length;
}
