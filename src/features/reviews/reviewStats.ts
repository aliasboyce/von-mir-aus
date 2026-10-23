import { bandForValue } from '../polyvagal/arousalBands';
import { valueOf } from './reviewChartLayout';
import { skillOutcome } from '../resources/skillUsesRepo';
import type { PolyvagalCheckIn, SkillUse } from '../../data/types';
import type { TranslationDictionary } from '../../i18n/de';

/**
 * Only-positive summary numbers for the reviews ("Erfolge"): how often
 * a value that had left the tolerance window came back into it, and
 * how many Skill runs ended closer to the window than they began.
 * Never a count of "how long in which bad zone".
 */
export function countReturnsToWindow(checkIns: PolyvagalCheckIn[]): { returns: number; everOutside: boolean } {
  const sorted = [...checkIns].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  let returns = 0;
  let outside = false;
  let everOutside = false;
  for (const c of sorted) {
    const inWindow = bandForValue(valueOf(c)).inWindow;
    if (!inWindow) {
      outside = true;
      everOutside = true;
    } else if (outside) {
      returns += 1;
      outside = false;
    }
  }
  return { returns, everOutside };
}

export function skillsSwungBack(uses: SkillUse[]): number {
  // practice runs (done calm, on purpose) never count as swinging back
  return uses.filter((u) => !u.practice && skillOutcome(u) === 'moved-toward').length;
}

/** The short positive summary lines for a set of check-ins / skill runs. */
export function reviewSummaryLines(checkIns: PolyvagalCheckIn[], uses: SkillUse[], t: TranslationDictionary): string[] {
  const r = t.reviewSummary;
  const lines: string[] = [];
  if (checkIns.length === 1) lines.push(r.checkInOne);
  else if (checkIns.length > 1) lines.push(r.checkIns.replace('{n}', String(checkIns.length)));
  const { returns, everOutside } = countReturnsToWindow(checkIns);
  if (returns > 0) lines.push(r.returns.replace('{n}', String(returns)));
  else if (checkIns.length > 0 && !everOutside) lines.push(r.stayedInside);
  const real = uses.filter((u) => !u.practice);
  if (real.length > 0) {
    lines.push(r.skillsUsed.replace('{n}', String(real.length)));
    const swung = skillsSwungBack(real);
    if (swung > 0) lines.push(r.skillsSwung.replace('{n}', String(swung)));
  }
  return lines;
}
