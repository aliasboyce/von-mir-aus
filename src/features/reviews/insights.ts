import { polyvagalRepo } from '../polyvagal/polyvagalRepo';
import { bandForValue } from '../polyvagal/arousalBands';
import { skillUsesRepo, distanceFromWindow, skillOutcome } from '../resources/skillUsesRepo';
import { routineRunsRepo } from '../routines/routinesRepo';
import { activityRepo } from '../../services/activityLog';
import { dayKeyOf } from './reviewData';
import { valueOf } from './reviewChartLayout';

/**
 * Automatically computed highlights for the reviews (7 / 30 / 90 days):
 * the day with the most strain, the calmest day, the hardest moments
 * and what the person used most. Reads only, never writes. Everything
 * is phrased by the UI as something the person did ("du hast ...") —
 * never as a score or a failure.
 */
export interface CurveDay {
  day: string;
  avg: number | null;
  count: number;
  color: string;
}
export interface DayHighlight {
  day: string;
  avg: number;
  peak: number;
  count: number;
  inWindowCount: number;
}
export interface HardMoment {
  at: string;
  value: number;
  bandId: string;
  /** minutes until the next check-in back inside the window (within 24 h) */
  backAfterMin?: number;
  /** title of a skill run in between that moved toward the window */
  helpedBy?: string;
}
export interface TopItem {
  label: string;
  count: number;
  helped: number;
}
export interface ReviewInsights {
  days: number;
  from: string;
  to: string;
  curve: CurveDay[];
  checkInCount: number;
  activeDays: number;
  skillRuns: number;
  routineRuns: number;
  stressDay?: DayHighlight;
  calmDay?: DayHighlight;
  hardMoments: HardMoment[];
  topSkills: TopItem[];
  topHelpers: TopItem[];
  topRoutines: TopItem[];
  topActivities: TopItem[];
}

const HARD_DISTANCE = 8;

function top(map: Map<string, TopItem>, n = 3): TopItem[] {
  return Array.from(map.values())
    .sort((a, b) => b.count - a.count || b.helped - a.helped || a.label.localeCompare(b.label))
    .slice(0, n);
}
function bump(map: Map<string, TopItem>, label: string, helped = false) {
  const key = label.trim();
  if (!key) return;
  const cur = map.get(key) ?? { label: key, count: 0, helped: 0 };
  cur.count += 1;
  if (helped) cur.helped += 1;
  map.set(key, cur);
}

export function computeInsights(days: number, now = new Date()): ReviewInsights {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const from = dayKeyOf(start);
  const to = dayKeyOf(now);
  const inRange = (iso: string) => {
    const k = dayKeyOf(new Date(iso));
    return k >= from && k <= to;
  };

  const checkIns = polyvagalRepo
    .getAll()
    .filter((c) => inRange(c.createdAt))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const uses = skillUsesRepo.getAll().filter((u) => inRange(u.endedAt));
  const realUses = uses.filter((u) => !u.practice);
  const runs = routineRunsRepo.getAll().filter((r) => inRange(r.endedAt));
  const acts = activityRepo.getAll().filter((a) => inRange(a.createdAt));

  const byDay = new Map<string, number[]>();
  checkIns.forEach((c) => {
    const k = dayKeyOf(new Date(c.createdAt));
    byDay.set(k, [...(byDay.get(k) ?? []), valueOf(c)]);
  });

  const curve: CurveDay[] = [];
  const highlights: DayHighlight[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dayKeyOf(d);
    const vals = byDay.get(key);
    if (!vals || vals.length === 0) {
      curve.push({ day: key, avg: null, count: 0, color: 'transparent' });
      continue;
    }
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    curve.push({ day: key, avg, count: vals.length, color: bandForValue(Math.round(avg)).color });
    highlights.push({
      day: key,
      avg,
      peak: vals.reduce((m, v) => (distanceFromWindow(v) > distanceFromWindow(m) ? v : m), vals[0]),
      count: vals.length,
      inWindowCount: vals.filter((v) => distanceFromWindow(v) === 0).length,
    });
  }

  // strain per day = how far the readings sat from the window, on average
  const strain = (h: DayHighlight) => {
    const vals = byDay.get(h.day) ?? [];
    return vals.reduce((s, v) => s + distanceFromWindow(v), 0) / Math.max(1, vals.length);
  };
  let stressDay: DayHighlight | undefined;
  let calmDay: DayHighlight | undefined;
  if (highlights.length > 0) {
    const sortedStrain = [...highlights].sort((a, b) => strain(b) - strain(a) || b.count - a.count);
    const sortedCalm = [...highlights].sort((a, b) => strain(a) - strain(b) || b.inWindowCount - a.inWindowCount || b.count - a.count);
    calmDay = sortedCalm[0];
    stressDay = sortedStrain[0];
    if (strain(stressDay) <= 0 || (calmDay && stressDay.day === calmDay.day)) stressDay = undefined;
  }

  const hard: HardMoment[] = checkIns
    .map((c) => ({ c, v: valueOf(c) }))
    .filter(({ v }) => distanceFromWindow(v) >= HARD_DISTANCE)
    .sort((a, b) => distanceFromWindow(b.v) - distanceFromWindow(a.v))
    .slice(0, 3)
    .map(({ c, v }) => {
      const t0 = new Date(c.createdAt).getTime();
      const next = checkIns.find((x) => {
        const tx = new Date(x.createdAt).getTime();
        return tx > t0 && tx - t0 <= 24 * 3600 * 1000 && distanceFromWindow(valueOf(x)) === 0;
      });
      const backAfterMin = next ? Math.round((new Date(next.createdAt).getTime() - t0) / 60000) : undefined;
      const helper = realUses.find((u) => {
        const ts = new Date(u.startedAt).getTime();
        const te = new Date(u.endedAt).getTime();
        return ts >= t0 - 30 * 60000 && te <= (next ? new Date(next.createdAt).getTime() : t0 + 3 * 3600 * 1000) + 5 * 60000 && skillOutcome(u) === 'moved-toward';
      });
      return { at: c.createdAt, value: v, bandId: bandForValue(Math.round(v)).id, backAfterMin, helpedBy: helper?.skillTitle };
    });

  const skills = new Map<string, TopItem>();
  realUses.forEach((u) => bump(skills, u.skillTitle, skillOutcome(u) === 'moved-toward' || u.helped === 'ja'));
  const helpers = new Map<string, TopItem>();
  acts.filter((a) => a.type === 'resource' || a.type === 'bridge').forEach((a) => bump(helpers, a.label, a.helpfulness === 'ja'));
  const routines = new Map<string, TopItem>();
  runs.forEach((r) => bump(routines, r.title, r.cards.some((c) => c.done)));
  const activities = new Map<string, TopItem>();
  acts.filter((a) => a.type === 'contact' || a.type === 'grounding').forEach((a) => bump(activities, a.label, a.helpfulness === 'ja'));

  const active = new Set<string>();
  byDay.forEach((_, k) => active.add(k));
  [...uses.map((u) => u.endedAt), ...runs.map((r) => r.endedAt), ...acts.map((a) => a.createdAt)].forEach((iso) => active.add(dayKeyOf(new Date(iso))));

  return {
    days,
    from,
    to,
    curve,
    checkInCount: checkIns.length,
    activeDays: active.size,
    skillRuns: realUses.length,
    routineRuns: runs.length,
    stressDay,
    calmDay,
    hardMoments: hard,
    topSkills: top(skills),
    topHelpers: top(helpers),
    topRoutines: top(routines),
    topActivities: top(activities),
  };
}

export function insightsEmpty(i: ReviewInsights): boolean {
  return i.checkInCount === 0 && i.skillRuns === 0 && i.routineRuns === 0 && i.topHelpers.length === 0 && i.topActivities.length === 0;
}
