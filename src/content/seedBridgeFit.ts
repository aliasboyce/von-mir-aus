import type { EnergyLevel } from './energyLevels';
import type { EffortLevel } from './fitCriteria';
import type { AccessChannel, Bridge, Resource } from '../data/types';

/**
 * "Aufwand, Zugangskanäle, Energie und Zeit müssen überall etabliert sein":
 * starting markings for the demo Brücken (per step) and the starter Aktivitäten,
 * so the "Was geht gerade?" filter works from the first minute — same idea as
 * seedSkillFit.ts. Only ever written into fields that are still empty.
 */
interface StepFit { e: EnergyLevel; m: number; a: EffortLevel; c: AccessChannel[] }
interface BridgeFit { c: AccessChannel[]; steps: StepFit[] }

export const SEED_BRIDGE_FIT: Record<string, BridgeFit> = {
  bridge_natur: {
    c: ['sinne', 'ort_zeit', 'bewegung'],
    steps: [
      { e: 1, m: 1, a: 1, c: ['sinne'] },
      { e: 1, m: 1, a: 1, c: ['sinne', 'ort_zeit'] },
      { e: 2, m: 10, a: 2, c: ['bewegung', 'sinne', 'ort_zeit'] },
      { e: 3, m: 30, a: 2, c: ['bewegung', 'sinne', 'ort_zeit', 'aufmerksamkeit'] },
    ],
  },
  bridge_atem: {
    c: ['koerper_innen', 'aufmerksamkeit'],
    steps: [
      { e: 1, m: 1, a: 1, c: ['koerper_innen'] },
      { e: 1, m: 1, a: 1, c: ['koerper_innen'] },
      { e: 2, m: 5, a: 1, c: ['koerper_innen', 'aufmerksamkeit', 'denken'] },
      { e: 2, m: 10, a: 1, c: ['koerper_innen', 'aufmerksamkeit'] },
    ],
  },
  bridge_kontakt: {
    c: ['beziehung', 'fuehlen'],
    steps: [
      { e: 1, m: 1, a: 1, c: ['beziehung', 'ausfuehren'] },
      { e: 2, m: 5, a: 2, c: ['beziehung', 'ausfuehren'] },
      { e: 3, m: 10, a: 2, c: ['beziehung', 'fuehlen', 'denken'] },
      { e: 4, m: 60, a: 3, c: ['beziehung', 'ort_zeit', 'ausfuehren'] },
    ],
  },
  bridge_musik: {
    c: ['sinne', 'koerper_innen'],
    steps: [
      { e: 1, m: 5, a: 1, c: ['sinne'] },
      { e: 1, m: 5, a: 1, c: ['sinne', 'aufmerksamkeit'] },
      { e: 2, m: 5, a: 1, c: ['sinne', 'bewegung', 'koerper_innen'] },
      { e: 3, m: 20, a: 2, c: ['denken', 'ausfuehren', 'sinne'] },
    ],
  },
  bridge_notiz: {
    c: ['denken', 'fuehlen'],
    steps: [
      { e: 1, m: 1, a: 1, c: ['denken', 'ausfuehren'] },
      { e: 2, m: 5, a: 1, c: ['denken', 'fuehlen'] },
      { e: 2, m: 10, a: 2, c: ['fuehlen', 'erinnerung', 'denken'] },
      { e: 3, m: 20, a: 2, c: ['fuehlen', 'denken', 'ausfuehren'] },
    ],
  },
  bridge_salamander_blick: { c: ['sinne', 'koerper_innen'], steps: [{ e: 1, m: 1, a: 1, c: ['sinne', 'koerper_innen'] }] },
  bridge_schulterkreisen: { c: ['bewegung', 'koerper_innen'], steps: [{ e: 1, m: 1, a: 1, c: ['bewegung', 'koerper_innen'] }] },
  bridge_isometrischer_zug: { c: ['bewegung', 'koerper_innen'], steps: [{ e: 1, m: 1, a: 1, c: ['bewegung', 'koerper_innen'] }] },
};

export const SEED_AKTIVITAET_CHANNELS: Record<string, AccessChannel[]> = {
  res_akt_spazieren: ['bewegung', 'sinne', 'ort_zeit'],
  res_akt_tee: ['sinne', 'koerper_innen', 'ausfuehren'],
  res_akt_malen: ['sinne', 'ausfuehren', 'fuehlen'],
  res_akt_aufraeumen: ['ausfuehren', 'bewegung', 'ort_zeit'],
  res_akt_telefonieren: ['beziehung', 'ausfuehren', 'fuehlen'],
  res_akt_aufschreiben: ['ausfuehren', 'fuehlen', 'denken'],
  res_akt_musik_tanzen: ['sinne', 'bewegung', 'koerper_innen'],
};

/** Fills only what is still empty; never overwrites. Returns the same object when nothing changed. */
export function withSeedBridgeFit(b: Bridge): Bridge {
  const seed = SEED_BRIDGE_FIT[b.id];
  if (!seed) return b;
  let changed = false;
  const accessChannels = b.accessChannels && b.accessChannels.length > 0 ? b.accessChannels : (changed = true, seed.c);
  const levels = b.levels.map((l, i) => {
    const s = seed.steps[i];
    if (!s) return l;
    const next = {
      ...l,
      energyLevel: l.energyLevel ?? s.e,
      accessChannels: l.accessChannels && l.accessChannels.length > 0 ? l.accessChannels : s.c,
      fit: l.fit ?? { minutes: s.m, effort: s.a },
    };
    if (next.energyLevel !== l.energyLevel || next.accessChannels !== l.accessChannels || next.fit !== l.fit) changed = true;
    return next;
  });
  return changed ? { ...b, accessChannels, levels } : b;
}

export function withSeedAktivitaetChannels(r: Resource): Resource {
  const c = SEED_AKTIVITAET_CHANNELS[r.id];
  if (!c || (r.accessChannels && r.accessChannels.length > 0)) return r;
  return { ...r, accessChannels: c };
}
