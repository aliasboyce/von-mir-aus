import { skillUsesRepo, distanceFromWindow } from './skillUsesRepo';
import { AROUSAL_BANDS } from '../polyvagal/arousalBands';

/**
 * "Persoenlicher Zonen-Fahrplan": from the person's OWN finished skill and
 * chain runs (value before / after), take the runs that started at a
 * similar tension (+-15 points) and show the two or three that helped
 * most. It is worded as a reminder ("hat dir schon geholfen"), never as an
 * instruction. With fewer than two runs in that range there is nothing
 * reliable to say, so no roadmap is returned and the normal list stays.
 * Practice runs ('Uebung') are left out — they were done calm, on purpose,
 * and say nothing about what helps at this tension.
 */
export interface RoadmapItem {
  key: string;
  title: string;
  to: string;
  before: number;
  after: number;
  runs: number;
}

const RANGE = 15;

export const ZONE_MIDPOINT: Record<string, number> = { zone1: 22, zone2: 35, zone3: 50, zone4: 65, zone5: 85, zone6: 7 };

export function valueForRoadmap(zoneId: string | null, explicit: number | null): number | null {
  if (explicit != null && Number.isFinite(explicit)) return explicit;
  if (!zoneId || !AROUSAL_BANDS.some((b) => b.id === zoneId)) return null;
  return ZONE_MIDPOINT[zoneId] ?? null;
}

function linkFor(skillId: string): string {
  return skillId.startsWith('chain:') ? `/entdecken/ressourcen/skillketten/${skillId.slice(6)}/start` : `/entdecken/ressourcen/skill-start/${skillId}`;
}

export function buildRoadmap(value: number): RoadmapItem[] {
  const runs = skillUsesRepo
    .getAll()
    .filter((u) => !u.practice && u.tensionBefore != null && u.tensionAfter != null && Math.abs((u.tensionBefore as number) - value) <= RANGE);
  if (runs.length < 2) return [];
  const byId = new Map<string, typeof runs>();
  runs.forEach((u) => byId.set(u.skillId, [...(byId.get(u.skillId) ?? []), u]));
  const items: (RoadmapItem & { gain: number })[] = [];
  byId.forEach((list, skillId) => {
    const gains = list.map((u) => distanceFromWindow(u.tensionBefore as number) - distanceFromWindow(u.tensionAfter as number));
    const avg = gains.reduce((a, b) => a + b, 0) / gains.length;
    if (avg <= 0) return;
    const best = list[gains.indexOf(Math.max(...gains))];
    items.push({ key: skillId, title: best.skillTitle, to: linkFor(skillId), before: best.tensionBefore as number, after: best.tensionAfter as number, runs: list.length, gain: avg });
  });
  return items.sort((a, b) => b.gain - a.gain).slice(0, 3);
}

/**
 * The one skill (or chain) that has helped the person most overall — used
 * to suggest a short practice run while tension is only slightly up. It
 * needs at least two real runs with an average improvement; practice runs
 * do not count. Returns the link to the run page with the practice flag.
 */
export function bestSkillForPractice(): { skillId: string; title: string; to: string } | null {
  const runs = skillUsesRepo.getAll().filter((u) => !u.practice && u.tensionBefore != null && u.tensionAfter != null);
  const byId = new Map<string, typeof runs>();
  runs.forEach((u) => byId.set(u.skillId, [...(byId.get(u.skillId) ?? []), u]));
  let best: { skillId: string; title: string; gain: number } | null = null;
  byId.forEach((list, skillId) => {
    if (list.length < 2) return;
    const avg = list.reduce((a, u) => a + distanceFromWindow(u.tensionBefore as number) - distanceFromWindow(u.tensionAfter as number), 0) / list.length;
    if (avg > 0 && (!best || avg > best.gain)) best = { skillId, title: list[list.length - 1].skillTitle, gain: avg };
  });
  if (!best) return null;
  const b = best as { skillId: string; title: string; gain: number };
  return { skillId: b.skillId, title: b.title, to: `${linkFor(b.skillId)}?practice=1` };
}
