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
  exercises: { resourceId: string; exerciseName: string }[];
}

/**
 * "Die klassische DBT-Anspannungskurve auf den Kopf gestellt und auf
 * die polyvagale Leiter gepackt"-Auftrag — complete rebuild of the
 * band percentages/names per the person's detailed DBT+Polyvagal
 * brief. Two things changed from the version above; nothing else:
 *
 * 1) The scale direction flipped. It used to run 0% (top, calmest) to
 *    100% (bottom, most shutdown) as one continuous climb. Now it
 *    climbs 15% (top, Erholungsphase) down to 100% (Hyperarousal,
 *    second-to-last zone) — then wraps: the very bottom zone
 *    (Hypoarousal) uses 0–15%, sitting BELOW the 100% mark rather
 *    than continuing past it. This mirrors the person's own framing:
 *    the deepest shutdown is the RESULT of a prior stress explosion,
 *    so it visually sits underneath it, not further up the same climb.
 * 2) zone6 (Hypoarousal) only spans 15 percentage points but must
 *    still look "breit" (wide) on the ladder — its narrow % range
 *    doesn't reflect how little space it should get. See
 *    visualPositionForValue() below for how this wrapping + the
 *    deliberately generous bottom share are actually drawn.
 *
 * IDs, colors, polyvagalZone, states and exercises are all UNCHANGED
 * per zone slot — only labelKey text and min/max move, so every
 * feature keyed off zone id/color/exercises keeps working untouched.
 */
/*
 * "Was trifft am ehesten zu?"-Pruefung — the tags offered per zone, checked
 * against the F-states placement in content/fStates.ts (same text as the
 * rainbow explainer):
 *   Erholungsphase 15-29     Verbunden, Friend
 *   Konzentration/Alltag     Fine, Praesent
 *   Fokus & Flow 40-59       Fokus, Praesent          (Flood/Unruhe REMOVED: they
 *                                                      sit at the upper edge)
 *   Fruehwarnbereich 60-69   Flood, Unruhe, Mobilisiert
 *   Hyperarousal 70-100      Kampf, Flucht, Blockiert (= Freeze unter Hochspannung;
 *                                                      Fawn REMOVED: it sits at 12-15%)
 *   Hypoarousal 0-14         Angepasst (Fawn), Erstarren (Freeze), Kollaps (Flop/Faint),
 *                            Fake-Ruhe
 */
export const AROUSAL_BANDS: ArousalBand[] = [
  {
    id: 'zone1',
    min: 15,
    max: 29,
    color: '#3d8b52',
    labelKey: 'zone1',
    polyvagalZone: 'ventral',
    states: ['verbunden', 'friend'],
    inWindow: true,
    exercises: [
      { resourceId: 'res_skill_478_atmung', exerciseName: '4-7-8 Atmung' },
      { resourceId: 'res_skill_36_bauchatmung', exerciseName: '3-zu-6 Bauchatmung' },
      { resourceId: 'res_skill_gaehn_impuls', exerciseName: 'Sanfter Gähn-Impuls' },
    ],
  },
  {
    id: 'zone2',
    min: 30,
    max: 39,
    color: '#8fae3d',
    labelKey: 'zone2',
    polyvagalZone: 'ventral',
    states: ['fine', 'praesent'],
    inWindow: true,
    exercises: [
      { resourceId: 'res_skill_grounding_54321', exerciseName: 'Kognitives Grounding' },
      { resourceId: 'res_skill_peripheres_sehen', exerciseName: 'Peripheres Sehen' },
      { resourceId: 'res_skill_box_atmung', exerciseName: 'Box-Atmung (Taktisch)' },
    ],
  },
  {
    id: 'zone3',
    min: 40,
    max: 59,
    color: '#6fbf73',
    labelKey: 'zone3',
    polyvagalZone: 'ventral',
    states: ['fokus', 'praesent'],
    inWindow: true,
    exercises: [
      { resourceId: 'res_skill_voo_atem', exerciseName: 'Orientierung & Voo-Atem' },
      { resourceId: 'res_skill_gewichtswahrnehmung', exerciseName: 'Gewichtswahrnehmung' },
      { resourceId: 'res_skill_auditives_verankern', exerciseName: 'Auditives Verankern' },
    ],
  },
  {
    id: 'zone4',
    min: 60,
    max: 69,
    color: '#e8a83d',
    labelKey: 'zone4',
    polyvagalZone: 'ventral',
    states: ['flood', 'unruhe', 'mobilisiert'],
    inWindow: true,
    exercises: [
      { resourceId: 'res_skill_voo_atem', exerciseName: 'Orientierung & Voo-Atem' },
      { resourceId: 'res_skill_gewichtswahrnehmung', exerciseName: 'Gewichtswahrnehmung' },
      { resourceId: 'res_skill_auditives_verankern', exerciseName: 'Auditives Verankern' },
    ],
  },
  {
    id: 'zone5',
    min: 70,
    max: 100,
    color: '#c9522f',
    labelKey: 'zone5',
    polyvagalZone: 'sympathetic',
    states: ['kampf', 'flucht', 'blockiert'],
    inWindow: false,
    exercises: [
      { resourceId: 'res_skill_physio_seufzer', exerciseName: 'Physiologischer Seufzer' },
      { resourceId: 'res_skill_shaking', exerciseName: 'Shaking (Neurogenes Zittern)' },
      { resourceId: 'res_skill_carotis_druck', exerciseName: 'Carotis-Sanftdruck' },
    ],
  },
  {
    id: 'zone6',
    min: 0,
    max: 14,
    color: '#4a6fa5',
    labelKey: 'zone6',
    polyvagalZone: 'dorsal',
    states: ['angepasst', 'erstarren', 'kollaps', 'fakeRuhe'],
    inWindow: false,
    exercises: [
      { resourceId: 'res_skill_schmetterling_klopf', exerciseName: 'Schmetterlings-Klopfen' },
      { resourceId: 'res_skill_oculocardiac', exerciseName: 'Oculocardiac-Reflex (Augendruck)' },
      { resourceId: 'res_skill_self_holding', exerciseName: 'Self-Holding Umarmung' },
    ],
  },
];

/**
 * "Auch breit sein, auch wenn man da nicht mehr Prozent hat"-Auftrag
 * — the bottom Hypoarousal zone (0–14%, only 15 points wide) gets a
 * fixed, generous share of the ladder's visual height regardless of
 * its narrow percentage span — set here once so every place that
 * draws the ladder (slider, chart Y-axis, gradient) agrees.
 */
export const HYPOAROUSAL_VISUAL_SHARE = 0.22;

/**
 * Converts a raw 0–100 tension value into a 0–100 VISUAL position on
 * the ladder (0 = very top of the track, 100 = very bottom) — needed
 * because the percentage scale itself is no longer a simple straight
 * line top-to-bottom. Values 15–100 climb through the top
 * (1-HYPOAROUSAL_VISUAL_SHARE) share of the track; values 0–14 (the
 * wrap-around Hypoarousal zone) occupy the remaining bottom share,
 * deliberately wider than their 15-point range would normally earn.
 * wrapAt is the value where the wrap happens (14 by default, i.e. the
 * top edge of Hypoarousal) — kept as a parameter so a future
 * calibrated Hypoarousal range can reuse this without duplicating the
 * math.
 */
export function visualPositionForValue(value: number, wrapAt: number = AROUSAL_BANDS[5].max): number {
  const v = Math.max(0, Math.min(100, value));
  const mainShare = (1 - HYPOAROUSAL_VISUAL_SHARE) * 100;
  if (v > wrapAt) {
    return ((v - (wrapAt + 1)) / (100 - (wrapAt + 1))) * mainShare;
  }
  return mainShare + ((wrapAt - v) / wrapAt) * (HYPOAROUSAL_VISUAL_SHARE * 100);
}

/**
 * Inverse of visualPositionForValue — given a visual track position
 * (0 = top, 100 = bottom), returns the raw 0–100 tension value there.
 * Needed for turning a drag/click position on the ladder back into a
 * value; must stay the exact mathematical inverse of
 * visualPositionForValue or dragging and display would disagree.
 */
export function valueForVisualPosition(pos: number, wrapAt: number = AROUSAL_BANDS[5].max): number {
  const p = Math.max(0, Math.min(100, pos));
  const mainShare = (1 - HYPOAROUSAL_VISUAL_SHARE) * 100;
  if (p <= mainShare) {
    return (wrapAt + 1) + (p / mainShare) * (100 - (wrapAt + 1));
  }
  return wrapAt - ((p - mainShare) / (HYPOAROUSAL_VISUAL_SHARE * 100)) * wrapAt;
}

/** Visual top/height (both 0–100, track-relative) for one band's
 * min–max, via visualPositionForValue — for drawing its background
 * stripe or label at the right place and size. Works the same way
 * for every band including the wrap-around zone6: visualPositionForValue
 * already returns a smaller number for band.max and a larger one for
 * band.min there (since deeper shutdown/lower value sits further
 * down), so min(a,b)/abs(a-b) is all that's needed either way. */
export function visualExtentForBand(band: ArousalBand, wrapAt?: number): { top: number; height: number } {
  const a = visualPositionForValue(band.max, wrapAt);
  const b = visualPositionForValue(band.min, wrapAt);
  return { top: Math.min(a, b), height: Math.abs(b - a) };
}

/**
 * "Einheitlichkeit pruefen"-Fund — a check-in stores tensionValue
 * (the precise 0–100 reading) only when the person answered the
 * precise slider; check-ins that only have the coarse 'zone'
 * (ventral/sympathetic/dorsal) fall back to a representative value
 * from here. These five occurrences across ChartPrintView,
 * MeineEntwicklungPage, PolyvagalDayChart (twice) and ReflectionModal
 * all duplicated the SAME literal {ventral:83, sympathetic:50,
 * dorsal:17} — values from the old, since-reversed scale direction,
 * so a dorsal (shutdown) check-in was falling back into what the new
 * scale calls Fokus & Flow, and a calm ventral one into Hyperarousal.
 * Centralised here and corrected to the new scale: ventral→25
 * (Erholungsphase/Konzentration & Alltag), sympathetic→80
 * (solidly Hyperarousal), dorsal→8 (solidly Hypoarousal).
 */
export const FALLBACK_TENSION_BY_ZONE: Record<PolyvagalZone, number> = { ventral: 25, sympathetic: 80, dorsal: 8 };

export function bandForValue(v: number): ArousalBand {
  return AROUSAL_BANDS.find((b) => v >= b.min && v <= b.max) ?? AROUSAL_BANDS[0];
}

/** The original, fixed boundaries — also the fallback whenever no
 * personal calibration is set. */
export const DEFAULT_ZONE_BOUNDARIES: [number, number, number, number, number] = [15, 35, 55, 75, 85];

/**
 * "Zonen selbst kalibrieren"-Auftrag — builds a full six-band set from
 * five personal boundaries, keeping every color/label/state/exercise
 * exactly as in AROUSAL_BANDS and only recomputing min/max. Boundaries
 * are clamped and sorted so a person can't accidentally create an
 * invalid (zero-width or reversed) zone by entering them out of order.
 */
export function bandsForBoundaries(boundaries: [number, number, number, number, number]): ArousalBand[] {
  const sorted = [...boundaries].map((b) => Math.max(0, Math.min(100, Math.round(b)))).sort((a, b) => a - b);
  const edges = [0, sorted[0], sorted[1], sorted[2], sorted[3], sorted[4], 100];
  return AROUSAL_BANDS.map((band, i) => ({
    ...band,
    min: i === 0 ? 0 : edges[i] + 1,
    max: edges[i + 1],
  }));
}

/** Like bandForValue, but honours a personal calibration when given. */
export function bandForValueCalibrated(v: number, boundaries?: [number, number, number, number, number]): ArousalBand {
  const bands = boundaries ? bandsForBoundaries(boundaries) : AROUSAL_BANDS;
  return bands.find((b) => v >= b.min && v <= b.max) ?? bands[0];
}

/**
 * "Die zugeordneten Farben bleiben genau gleich, aber der Bereich
 * wird breiter oder fängt früher an"-Auftrag — gradient stops for a
 * given set of bands (default or calibrated), each zone keeping its
 * own fixed color, just at its own (possibly personal) position. This
 * is the direct replacement for the old two-value dynamicGradientStops
 * (which collapsed all six colors into a single uniform "comfort"
 * color) — six distinct colors stay visible either way, calibrated or
 * not, only their widths/positions move.
 */
/**
 * "Der coole Verlauf soll nicht weggehen"-Fund — the very first version
 * of gradientStopsForBands placed two stops per band at its exact
 * min/max, which is a hard, flat-edged block with no blend at all —
 * "starr" is exactly right. This restores the soft, blended rainbow
 * look (each color melting into the next, like AROUSAL_GRADIENT_STOPS
 * always had) while still letting a wider calibrated zone actually
 * look wider: each band gets its own two stops set slightly inside its
 * min/max (a margin proportional to the band's own width, capped so a
 * narrow calibrated zone never gets a margin bigger than itself) —
 * the vivid, solid part of a band still scales with its calibrated
 * width, but the boundary between neighbours is a smooth blend again,
 * not a cut.
 */
/**
 * Same soft-blend approach as gradientStopsForBands below, but stops
 * are placed using each band's VISUAL position (visualExtentForBand)
 * rather than its raw min/max percentage — needed now that the scale
 * wraps (Hypoarousal's 0–14% sits at the visual bottom, not where a
 * plain 0–14% would put it). Use this one for anything drawn on the
 * new wrapping ladder; gradientStopsForBands stays for print/legacy
 * contexts that still think in plain percentages.
 */
/** Dark red/purple used only as a transitional stop between the red
 * Hyperarousal zone and the blue Hypoarousal one — see
 * gradientStopsForBandsVisual's zone5 special case below. Not a band
 * color of its own; nothing else references this. */
const HYPERAROUSAL_TO_HYPOAROUSAL_TRANSITION_COLOR = '#6b3a4a';

/**
 * "Der Uebergang von Hyperarousal ins Hypo, die letzten 85-100%, soll
 * dunkelrot/lila dann blau werden, fliessend, wie wir das vorher
 * hatten"-Fund — zone5 (Hyperarousal, red) no longer stays one flat
 * color for its whole 70–100% span. Its second half fades from red
 * toward a dark red/purple right before the wrap into zone6's blue,
 * exactly where the person specifically asked for it — every other
 * transition (green→olive→amber→orange→red) keeps the same small,
 * ordinary blend margin as before.
 */
export function gradientStopsForBandsVisual(bands: ArousalBand[], wrapAt?: number): string {
  const stops: string[] = [];
  bands.forEach((b) => {
    const { top, height } = visualExtentForBand(b, wrapAt);
    // "Noch weicher, wirklich wieder dieser Regenbogenverlauf"-Fund —
    // the first attempt at a soft version still capped the blend at a
    // small 3-point margin, leaving each color a mostly flat band with
    // only a thin seam of blending — not the continuous, flowing
    // rainbow look from before. Margin now scales to over a third of
    // each band's own height, so colors spend most of their space
    // actively melting into their neighbours rather than sitting flat.
    const margin = height * 0.38;
    if (b.id === 'zone5') {
      // Value 85 is the described midpoint of this fade — its own
      // visual position marks where the darkening begins.
      const fadeStartVisual = visualPositionForValue(85, wrapAt);
      stops.push(`${b.color} ${top + margin}%`, `${b.color} ${fadeStartVisual}%`, `${HYPERAROUSAL_TO_HYPOAROUSAL_TRANSITION_COLOR} ${top + height}%`);
    } else {
      stops.push(`${b.color} ${top + margin}%`, `${b.color} ${top + height - margin}%`);
    }
  });
  return stops.join(', ');
}

export function gradientStopsForBands(bands: ArousalBand[]): string {
  const stops: string[] = [];
  bands.forEach((b, i) => {
    const width = b.max - b.min;
    const margin = Math.min(3, width * 0.2);
    const innerMin = i === 0 ? b.min : b.min + margin;
    const innerMax = i === bands.length - 1 ? b.max : b.max - margin;
    stops.push(`${b.color} ${innerMin}%`, `${b.color} ${Math.max(innerMin, innerMax)}%`);
  });
  return stops.join(', ');
}

// Smooth 6-stop rainbow, green(top/0%) through blue(bottom/100%) —
// matches each band's own representative color above for a coherent
// gradient-to-band relationship rather than an arbitrary separate palette.
export const AROUSAL_GRADIENT_STOPS = AROUSAL_BANDS.map((b, i) => `${b.color} ${(i / (AROUSAL_BANDS.length - 1)) * 100}%`).join(', ');

/**
 * "Dynamisch einfaerbender Regler (Erweiterter Modus)"-Auftrag — the
 * biological rainbow color a given raw 0-100 value would naturally
 * have, used to build the gradient stops OUTSIDE someone's
 * calibrated window (the "further into real danger" direction keeps
 * escalating normally; it's only the calibrated window itself that
 * gets overridden to a uniform comfort color).
 */
function biologicalColorAt(v: number): string {
  const idx = (v / 100) * (AROUSAL_BANDS.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, AROUSAL_BANDS.length - 1);
  const t = idx - lo;
  return mixHex(AROUSAL_BANDS[lo].color, AROUSAL_BANDS[hi].color, t);
}

function mixHex(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const mixed = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${mixed.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export const COMFORT_ZONE_COLOR = '#6fae5a';

/**
 * Builds the gradient-bar CSS stops for Erweiterter Modus: a uniform
 * comfort color across the person's own calibrated [start,end]
 * window, a gray "currently unfamiliar/unreachable" zone toward the
 * biologically calmer side, and the normal escalating biological
 * colors continuing beyond the window toward the more extreme side —
 * regardless of which direction their window happens to sit in.
 */
export function dynamicGradientStops(windowStart: number, windowEnd: number): string {
  const stops: string[] = [];
  if (windowStart > 0) {
    stops.push(`#9a9a9a 0%`, `#9a9a9a ${windowStart}%`);
  }
  stops.push(`${COMFORT_ZONE_COLOR} ${windowStart}%`, `${COMFORT_ZONE_COLOR} ${windowEnd}%`);
  if (windowEnd < 100) {
    stops.push(`${biologicalColorAt(windowEnd)} ${windowEnd}%`, `${biologicalColorAt(100)} 100%`);
  }
  return stops.join(', ');
}

/** The three broad polyvagal states a ladder value belongs to — what a
 * PolyvagalCheckIn.zone stores. Frühwarnbereich and Hyperarousal count
 * as sympathetic, Hypoarousal as dorsal, everything inside the
 * tolerance window as ventral. */
export function polyvagalZoneForValue(v: number): PolyvagalZone {
  if (v < 15) return 'dorsal';
  if (v >= 60) return 'sympathetic';
  return 'ventral';
}
