import { createRepository } from '../../services/storage/repository';
import type { ZugangEntry, ZugangSurvivalState, PolyvagalZone } from '../../data/types';

export const zugangRepo = createRepository<ZugangEntry>('zugang-entries');

/**
 * Point 2's explicit grouping — reused, not reinvented, to actually
 * save the Überlebenszustand step into the SAME polyvagal check-in
 * data the Tageskurve already reads (see PolyvagalPage.tsx /
 * gardenGrowth.ts consumers): no second, parallel "what state am I in"
 * system living only inside Zugang.
 */
export const SURVIVAL_TO_POLYVAGAL_ZONE: Record<ZugangSurvivalState, PolyvagalZone> = {
  verbunden: 'ventral',
  mobilisiert: 'sympathetic',
  flucht: 'sympathetic',
  kampf: 'sympathetic',
  // Fawn sits at 12-15% on the ladder (Hypoarousal edge) — see content/fStates.ts
  angepasst: 'dorsal',
  erstarren: 'dorsal',
  kollaps: 'dorsal',
  // "Fine/Flood/Friend gehoeren ins Toleranzfenster"-Korrektur — all
  // three belong to the ventral zone (see zugangContent.ts for the
  // full reasoning), not scattered into sympathetic/dorsal.
  fine: 'ventral',
  flood: 'ventral',
  friend: 'ventral',
  fakeRuhe: 'dorsal',
  fokus: 'ventral',
  praesent: 'ventral',
  unruhe: 'ventral',
  // 'Blockiert' = Freeze unter Hochspannung (85-95%), i.e. still sympathetic
  blockiert: 'sympathetic',
};
