import type { Resource } from '../data/types';

/**
 * "Zustandsgerechtes Filtern: in Zone 5 und 6 nur Koerper-Skills, kognitive
 * (Fakten-Check, Problemloesung ...) erst ab Zone 4 abwaerts."
 * In hoher Anspannung (Zone 5) und im Rueckzug (Zone 6) sind Lesen, Abwaegen
 * und Planen schwer oder gesperrt — dort hilft nur, was ueber Koerper und
 * Sinne laeuft. Every skill therefore needs to be either 'koerper' or
 * 'kognitiv': an explicit choice in the form wins; otherwise the starter
 * skills are classified below; anything else follows its module
 * (Stresstoleranz = body-led, the other modules = thinking-led).
 */
export type SkillModality = 'koerper' | 'kognitiv';

/** Starter skills in "Stresstoleranz" that work through thinking / attention. */
const COGNITIVE_IDS = new Set(['res_skill_radikale_akzeptanz', 'res_skill_accepts', 'res_skill_improve', 'res_skill_willingness', 'res_skill_grounding_54321']);
/** Starter skills outside "Stresstoleranz" that work through body and senses. */
const BODY_IDS = new Set(['res_atemzitat', 'res_waldspaziergang']);

export function skillModality(r: Pick<Resource, 'id' | 'category' | 'skillDetails'>): SkillModality {
  const explicit = r.skillDetails?.modality;
  if (explicit) return explicit;
  if (COGNITIVE_IDS.has(r.id)) return 'kognitiv';
  if (BODY_IDS.has(r.id)) return 'koerper';
  return r.category === 'stresstoleranz' ? 'koerper' : 'kognitiv';
}

/** zone5 (Hyperarousal) and zone6 (Hypoarousal) only get body-led items. */
export function isCrisisZone(zoneId: string | null | undefined): boolean {
  return zoneId === 'zone5' || zoneId === 'zone6';
}
