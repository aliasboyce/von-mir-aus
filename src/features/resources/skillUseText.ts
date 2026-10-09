import type { SkillUse } from '../../data/types';
import type { TranslationDictionary } from '../../i18n/de';
import { skillOutcome } from './skillUsesRepo';

/** "Skill X genutzt bei Anspannung Y -> danach Z" as one readable line,
 * shared by the day/week/month reviews and the PDFs so they always
 * word it the same way. */
export function skillUseLine(u: SkillUse, t: TranslationDictionary): string {
  const r = t.skillRun;
  if (u.practice && !u.skillTitle.endsWith(r.practiceTag)) return skillUseLine({ ...u, skillTitle: `${u.skillTitle}${r.practiceTag}`, practice: false }, t);
  if (u.kind === 'chain' && u.chainSteps && u.chainSteps.length > 0) {
    // chains: the line carries the skills worked through, in order
    const base = { ...u, kind: 'skill' as const, chainSteps: undefined };
    return `${skillUseLine(base, t)} (${u.chainSteps.join(' → ')})`;
  }
  if (u.tensionBefore != null && u.tensionAfter != null) {
    return r.usedLine.replace('{title}', u.skillTitle).replace('{before}', String(u.tensionBefore)).replace('{after}', String(u.tensionAfter));
  }
  if (u.tensionAfter != null) return r.usedLineOnlyAfter.replace('{title}', u.skillTitle).replace('{after}', String(u.tensionAfter));
  return r.usedLineNoValues.replace('{title}', u.skillTitle);
}

export function skillUseTime(u: SkillUse, locale: string): string {
  return new Date(u.endedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

/** A short, only-ever-positive tag for a run that ended closer to the
 * tolerance window than it started. */
export function skillUseIsSuccess(u: SkillUse): boolean {
  return !u.practice && skillOutcome(u) === 'moved-toward';
}
