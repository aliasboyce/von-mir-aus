import type { EnergyLevel } from './energyLevels';
import type { EffortLevel, FitProfile } from './fitCriteria';
import type { AccessChannel } from '../data/types';

/**
 * "Was geht gerade?" — sensible starting markings for the starter skills, so
 * the filter works from the first minute. They describe what the skill NEEDS
 * (not how someone feels) and through which Zugangskanäle it can be reached: the
 * breathing exercises through body and attention, problem solving through
 * thinking, memory and starting.
 * Applied once per skill by migrateSeedSkillFit() and only into fields that
 * are still empty — anything the person set or cleared themselves stays.
 * They are starting points, not verdicts: every one can be edited in the skill.
 */
interface SeedFit {
  e: EnergyLevel;
  m: number;
  a: EffortLevel;
  c: AccessChannel[];
}

export const SEED_SKILL_FIT: Record<string, SeedFit> = {
  // Körper & Atmung — wenig nötig, auch im Liegen möglich
  res_skill_478_atmung: { e: 1, m: 5, a: 1, c: ['koerper_innen', 'aufmerksamkeit'] },
  res_skill_36_bauchatmung: { e: 1, m: 5, a: 1, c: ['koerper_innen', 'aufmerksamkeit'] },
  res_skill_box_atmung: { e: 1, m: 5, a: 1, c: ['koerper_innen', 'aufmerksamkeit'] },
  res_skill_physio_seufzer: { e: 1, m: 1, a: 1, c: ['koerper_innen'] },
  res_skill_gaehn_impuls: { e: 1, m: 1, a: 1, c: ['koerper_innen'] },
  res_skill_carotis_druck: { e: 1, m: 1, a: 1, c: ['koerper_innen', 'sinne'] },
  res_skill_oculocardiac: { e: 1, m: 1, a: 1, c: ['sinne', 'koerper_innen'] },
  res_skill_peripheres_sehen: { e: 1, m: 5, a: 1, c: ['sinne', 'aufmerksamkeit'] },
  res_skill_gewichtswahrnehmung: { e: 1, m: 5, a: 1, c: ['koerper_innen', 'sinne'] },
  res_skill_auditives_verankern: { e: 1, m: 5, a: 1, c: ['sinne', 'aufmerksamkeit'] },
  res_skill_schmetterling_klopf: { e: 1, m: 5, a: 1, c: ['sinne', 'bewegung', 'koerper_innen'] },
  res_skill_self_holding: { e: 1, m: 5, a: 1, c: ['sinne', 'koerper_innen'] },
  res_skill_voo_atem: { e: 2, m: 5, a: 1, c: ['koerper_innen', 'sinne', 'aufmerksamkeit'] },
  res_skill_shaking: { e: 3, m: 5, a: 2, c: ['bewegung', 'koerper_innen'] },
  res_skill_gewichtsdecke: { e: 1, m: 10, a: 1, c: ['koerper_innen', 'sinne'] },
  res_skill_eiskaltes_wasser: { e: 2, m: 1, a: 1, c: ['koerper_innen', 'sinne'] },
  res_skill_bilaterale_stimulation: { e: 1, m: 5, a: 1, c: ['bewegung', 'koerper_innen', 'sinne'] },
  res_skill_tipp: { e: 3, m: 5, a: 2, c: ['sinne', 'bewegung', 'koerper_innen'] },
  // Orientierung & Erdung
  res_skill_54321: { e: 2, m: 5, a: 1, c: ['sinne', 'aufmerksamkeit'] },
  res_skill_grounding_54321: { e: 2, m: 5, a: 1, c: ['sinne', 'aufmerksamkeit', 'denken'] },
  res_skill_halbes_laecheln: { e: 2, m: 5, a: 1, c: ['koerper_innen', 'fuehlen'] },
  // Achtsamkeit & Gefühle
  res_skill_wahrnehmen_beschreiben: { e: 2, m: 10, a: 2, c: ['aufmerksamkeit', 'sinne', 'fuehlen'] },
  res_skill_was_fertigkeiten: { e: 3, m: 10, a: 2, c: ['aufmerksamkeit', 'denken'] },
  res_skill_wie_fertigkeiten: { e: 3, m: 10, a: 2, c: ['aufmerksamkeit', 'denken'] },
  res_skill_wise_mind: { e: 3, m: 10, a: 2, c: ['fuehlen', 'denken', 'erinnerung'] },
  res_skill_gefuehle_verstehen: { e: 3, m: 10, a: 2, c: ['fuehlen', 'denken'] },
  res_skill_willingness: { e: 3, m: 5, a: 2, c: ['fuehlen', 'denken'] },
  res_skill_radikale_akzeptanz: { e: 3, m: 10, a: 3, c: ['denken', 'fuehlen'] },
  res_skill_opposite_action: { e: 3, m: 10, a: 3, c: ['fuehlen', 'ausfuehren', 'denken'] },
  res_skill_check_the_facts: { e: 3, m: 10, a: 2, c: ['denken'] },
  res_skill_dialektik: { e: 3, m: 10, a: 2, c: ['denken'] },
  res_skill_validierung: { e: 3, m: 10, a: 2, c: ['fuehlen', 'denken', 'beziehung'] },
  // Ablenken & Verbessern
  res_skill_accepts: { e: 2, m: 10, a: 2, c: ['aufmerksamkeit', 'bewegung', 'sinne'] },
  res_skill_improve: { e: 3, m: 10, a: 2, c: ['denken', 'fuehlen', 'sinne'] },
  res_skill_positive_emotionen: { e: 3, m: 20, a: 2, c: ['fuehlen', 'ausfuehren', 'ort_zeit'] },
  // Alltag & Vorsorge
  res_skill_please: { e: 2, m: 10, a: 2, c: ['denken', 'ausfuehren'] },
  res_skill_verhaltensaenderung: { e: 3, m: 10, a: 2, c: ['denken', 'ausfuehren'] },
  res_skill_build_mastery: { e: 4, m: 20, a: 3, c: ['ausfuehren', 'denken'] },
  res_skill_cope_ahead: { e: 4, m: 20, a: 3, c: ['denken', 'erinnerung', 'ausfuehren'] },
  res_skill_problem_solving: { e: 4, m: 30, a: 3, c: ['denken', 'erinnerung', 'ausfuehren'] },
  // Beziehung
  res_skill_give: { e: 4, m: 20, a: 3, c: ['beziehung', 'denken', 'ausfuehren'] },
  res_skill_fast: { e: 4, m: 20, a: 3, c: ['beziehung', 'denken', 'ausfuehren'] },
  res_skill_dear_man: { e: 4, m: 20, a: 3, c: ['beziehung', 'denken', 'ausfuehren'] },
  // die vier ersten Beispiele
  res_waldspaziergang: { e: 3, m: 20, a: 2, c: ['bewegung', 'sinne', 'ort_zeit'] },
  res_klavier: { e: 1, m: 5, a: 1, c: ['sinne'] },
  res_atemzitat: { e: 1, m: 1, a: 1, c: ['sinne', 'denken'] },
  res_waermequelle: { e: 1, m: 5, a: 1, c: ['sinne', 'koerper_innen'] },
};

export function seedFitFor(id: string): { energyLevel: EnergyLevel; fit: FitProfile; accessChannels: AccessChannel[] } | undefined {
  const s = SEED_SKILL_FIT[id];
  return s ? { energyLevel: s.e, fit: { minutes: s.m, effort: s.a }, accessChannels: s.c } : undefined;
}
