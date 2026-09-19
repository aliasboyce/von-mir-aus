import { AROUSAL_BANDS } from '../polyvagal/arousalBands';

/**
 * "Farbige Einfaerbung nach Zone"-Auftrag — every body-sensation term
 * (from BODY_SENSATIONS_DE / BODY_REGION_SENSATIONS) mapped to the one
 * of the six arousal zones it most plausibly belongs to, purely so it
 * can be rendered in that zone's own color wherever it's shown
 * (Zugang's body-sensation step, the Körperwahrnehmung reference
 * page) — no functional change to how the terms are picked or
 * grouped otherwise.
 */
const SENSATION_ZONE: Record<string, 1 | 2 | 3 | 4 | 5 | 6> = {
  // Zone 1 — Regeneration & Pause
  'schwere Augen': 1,
  benommen: 1,
  warm: 1,
  ruhig: 1,
  entspannt: 1,
  leicht: 1,
  'angenehm wach': 1,
  weich: 1,
  'ruhig atmend': 1,
  gelöst: 1,
  stabil: 1,
  'angenehm schwer': 1,
  Magenknurren: 1,
  // Zone 2 — Fokus & Flow
  energiegeladen: 2,
  wach: 2,
  'gleichmäßige Atmung': 2,
  'ruhiger Puls': 2,
  'aufrechte Grundspannung': 2,
  'klarer Blick': 2,
  'entspannte Stirn': 2,
  'klarer Kopf': 2,
  // Zone 3 — Grenzzone
  'innere Unruhe': 3,
  Druck: 3,
  'flache Atmung': 3,
  'Atmung im Brustkorb': 3,
  'Puls im Hals spürbar': 3,
  'Verspannung im Nacken': 3,
  'hochgezogene Schultern': 3,
  'hektischer Blick': 3,
  Kieferpresse: 3,
  'feuchte Hände': 3,
  Hitzewallungen: 3,
  'Flauen im Magen': 3,
  'zusammengezogener Magen': 3,
  // Zone 4 — Hyperarousal
  Herzklopfen: 4,
  angespannt: 4,
  Zittern: 4,
  Kribbeln: 4,
  Übelkeit: 4,
  heiß: 4,
  'kalte Hände': 4,
  'wackelige Beine': 4,
  'trockener Mund': 4,
  'angespannter Kiefer': 4,
  'zugeschnürte Kehle': 4,
  'rasender Puls': 4,
  'Fäuste ballen': 4,
  Tunnelblick: 4,
  'kalter Schweiß': 4,
  'Stechen im Magen': 4,
  Schwindel: 4,
  // Zone 5 — Mischzustand / Freeze
  'Kloß im Hals': 5,
  'Enge im Brustkorb': 5,
  'Atem anhalten': 5,
  'wie eingemauert': 5,
  'eingefrorene Mimik': 5,
  Schluckbeschwerden: 5,
  'Druck im Kopf': 5,
  // Zone 6 — Shutdown
  leer: 6,
  'taube Hände/Füße': 6,
  'schwere Glieder': 6,
  frieren: 6,
  'sehr flache Atmung': 6,
  'Blutdruck sackt ab': 6,
  'schlaffe Muskeln': 6,
  'wie durch Watte': 6,
  'Watte im Kopf': 6,
  'aus dem Körper schweben': 6,
  sprachlos: 6,
  'glanzloser Blick': 6,
};

/** Returns the sensation's zone color, or undefined for anything not
 * in the map (e.g. a person's own custom addition) — callers should
 * fall back to the neutral, uncolored style in that case. */
export function colorForSensation(term: string): string | undefined {
  const zone = SENSATION_ZONE[term];
  return zone ? AROUSAL_BANDS[zone - 1].color : undefined;
}

/** "Kurze Beschreibung + Emotionen/Beduerfnisse beim Anklicken"-Auftrag
 * — the full band for a sensation (not just its color), reusing the
 * SAME hint text and F-states the arousal ladder itself already
 * carries, rather than writing a second, separate description for
 * every sensation term. Undefined for anything not in the map. */
export function bandForSensation(term: string) {
  const zone = SENSATION_ZONE[term];
  return zone ? AROUSAL_BANDS[zone - 1] : undefined;
}
