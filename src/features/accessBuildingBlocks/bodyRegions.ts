/**
 * Priority 6 of the "Verknüpfung, Inhalt & visuelle Ausbaustufe" brief —
 * an interactive way to explore body sensations, region by region,
 * instead of just one flat list. Maps the *existing* BODY_SENSATIONS_DE
 * items (from zugangContent.ts) onto rough body regions — no new
 * sensation vocabulary invented, no second source of truth. A given
 * sensation is only shown under the region(s) it's most plausibly
 * associated with; several genuinely whole-body ones (e.g. "angespannt")
 * live under "Ganzer Körper" rather than being force-fit into one spot.
 */
export type BodyRegion = 'kopf' | 'brust' | 'bauch' | 'arme' | 'beine' | 'ganzerKoerper';

export const BODY_REGION_ORDER: BodyRegion[] = ['kopf', 'brust', 'bauch', 'arme', 'beine', 'ganzerKoerper'];

export const BODY_REGION_SENSATIONS: Record<BodyRegion, string[]> = {
  kopf: ['schwere Augen', 'benommen', 'Watte im Kopf', 'Schwindel', 'angespannter Kiefer', 'trockener Mund'],
  brust: ['Kloß im Hals', 'Enge im Brustkorb', 'Herzklopfen', 'flache Atmung', 'ruhig atmend'],
  bauch: ['Übelkeit', 'zusammengezogener Magen', 'innere Unruhe', 'leer'],
  arme: ['Kribbeln', 'taube Hände/Füße', 'kalte Hände', 'Zittern'],
  beine: ['wackelige Beine', 'schwere Glieder', 'taube Hände/Füße'],
  ganzerKoerper: ['angespannt', 'frieren', 'heiß', 'Druck', 'warm', 'ruhig', 'entspannt', 'leicht', 'angenehm wach', 'weich', 'gelöst', 'stabil', 'angenehm schwer', 'energiegeladen', 'wach'],
};
