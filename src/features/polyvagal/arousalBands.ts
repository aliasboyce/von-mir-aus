import type { PolyvagalZone, ZugangSurvivalState } from '../../data/types';

/**
 * "6-Zonen-Modell nach Yerkes-Dodson + Stresstoleranzfenster"-Auftrag
 * — the precise 6-band model from the person's detailed clinical
 * brief, replacing the earlier 3-band ladder. Scale runs 0% (top,
 * calmest) to 100% (bottom, deepest shutdown) — HIGHER percentage
 * means MORE activation/dysregulation, matching the person's explicit
 * spec ("höhere Prozentzahlen bedeuten chronologisch mehr
 * Stressbelastung"). Each band still maps down to one of the three
 * underlying PolyvagalZone values so every existing zone-based
 * feature (charts, daily review, etc.) keeps working unchanged — this
 * is a richer LAYER on top of that data, not a replacement for it.
 *
 * Sources for the band boundaries and clinical framing (also see
 * their entries in sourcesLibrary.ts):
 * - Yerkes-Dodson law (optimal arousal for performance)
 * - Dr. Dan Siegel — window of tolerance
 * - Suzette Boon et al. — arousal worksheet or trauma-related
 *   dissociation (the "Fake-Ruhe" / functional-dissociation framing)
 * - welltory.com, positivepsychology.com, durhamtherapy.ca,
 *   treehousecounselingoregon.com — accessible clinical explainers
 *   used to cross-check the exact band boundaries and terminology
 */
export interface ArousalBand {
  id: 'zone1' | 'zone2' | 'zone3' | 'zone4' | 'zone5' | 'zone6';
  min: number;
  max: number;
  color: string;
  labelKey: string;
  polyvagalZone: PolyvagalZone;
  states: ZugangSurvivalState[];
  inWindow: boolean;
  /** "Sofort-Hilfe-Uebungen nach Stufen"-Auftrag — each zone's matching
   * pre-built bridge (see bridges.seed.ts), offered as a gentle,
   * confirm-before-navigating suggestion once someone lands in that
   * zone. */
  /** "3 Uebungen pro Zone"-Auftrag — each zone now offers a choice of
   * three pre-built bridges instead of a single fixed suggestion. */
  exercises: { bridgeId: string; exerciseName: string }[];
}

export const AROUSAL_BANDS: ArousalBand[] = [
  {
    id: 'zone1',
    min: 0,
    max: 15,
    color: '#3d8b52',
    labelKey: 'zone1',
    polyvagalZone: 'ventral',
    states: ['fine', 'friend'],
    inWindow: true,
    exercises: [
      { bridgeId: 'bridge_478_atmung', exerciseName: '4-7-8 Atmung' },
      { bridgeId: 'bridge_36_bauchatmung', exerciseName: '3-zu-6 Bauchatmung' },
      { bridgeId: 'bridge_gaehn_impuls', exerciseName: 'Sanfter Gähn-Impuls' },
    ],
  },
  {
    id: 'zone2',
    min: 16,
    max: 35,
    color: '#8fae3d',
    labelKey: 'zone2',
    polyvagalZone: 'ventral',
    states: ['fokus', 'praesent'],
    inWindow: true,
    exercises: [
      { bridgeId: 'bridge_grounding_54321', exerciseName: 'Kognitives Grounding' },
      { bridgeId: 'bridge_peripheres_sehen', exerciseName: 'Peripheres Sehen' },
      { bridgeId: 'bridge_box_atmung', exerciseName: 'Box-Atmung (Taktisch)' },
    ],
  },
  {
    id: 'zone3',
    min: 36,
    max: 55,
    color: '#e0a83b',
    labelKey: 'zone3',
    polyvagalZone: 'ventral',
    states: ['flood', 'unruhe'],
    inWindow: true,
    exercises: [
      { bridgeId: 'bridge_voo_atem', exerciseName: 'Orientierung & Voo-Atem' },
      { bridgeId: 'bridge_gewichtswahrnehmung', exerciseName: 'Gewichtswahrnehmung' },
      { bridgeId: 'bridge_auditives_verankern', exerciseName: 'Auditives Verankern' },
    ],
  },
  {
    id: 'zone4',
    min: 56,
    max: 75,
    color: '#c9522f',
    labelKey: 'zone4',
    polyvagalZone: 'sympathetic',
    states: ['flucht', 'kampf', 'angepasst'],
    inWindow: false,
    exercises: [
      { bridgeId: 'bridge_physio_seufzer', exerciseName: 'Physiologischer Seufzer' },
      { bridgeId: 'bridge_shaking', exerciseName: 'Shaking (Neurogenes Zittern)' },
      { bridgeId: 'bridge_carotis_druck', exerciseName: 'Carotis-Sanftdruck' },
    ],
  },
  {
    id: 'zone5',
    min: 76,
    max: 85,
    color: '#7d5a95',
    labelKey: 'zone5',
    polyvagalZone: 'dorsal',
    states: ['erstarren', 'blockiert'],
    inWindow: false,
    exercises: [
      { bridgeId: 'bridge_salamander_blick', exerciseName: 'Der Salamander-Blick' },
      { bridgeId: 'bridge_schulterkreisen', exerciseName: 'Schulterkreisen (Fixierter Blick)' },
      { bridgeId: 'bridge_isometrischer_zug', exerciseName: 'Isometrischer Hand-Zug' },
    ],
  },
  {
    id: 'zone6',
    min: 86,
    max: 100,
    color: '#4a6fa5',
    labelKey: 'zone6',
    polyvagalZone: 'dorsal',
    states: ['kollaps', 'fakeRuhe'],
    inWindow: false,
    exercises: [
      { bridgeId: 'bridge_schmetterling_klopf', exerciseName: 'Schmetterlings-Klopfen' },
      { bridgeId: 'bridge_oculocardiac', exerciseName: 'Oculocardiac-Reflex (Augendruck)' },
      { bridgeId: 'bridge_self_holding', exerciseName: 'Self-Holding Umarmung' },
    ],
  },
];

export function bandForValue(v: number): ArousalBand {
  return AROUSAL_BANDS.find((b) => v >= b.min && v <= b.max) ?? AROUSAL_BANDS[0];
}

// Smooth 6-stop rainbow, green(top/0%) through blue(bottom/100%) —
// matches each band's own representative color above for a coherent
// gradient-to-band relationship rather than an arbitrary separate palette.
export const AROUSAL_GRADIENT_STOPS = AROUSAL_BANDS.map((b, i) => `${b.color} ${(i / (AROUSAL_BANDS.length - 1)) * 100}%`).join(', ');
