import type { AccessChannel } from '../../data/types';
import type { ArousalBand } from '../polyvagal/arousalBands';

/**
 * "Zugangskanäle & Zugänglichkeit, Schritt 3"-Auftrag — the actual
 * content work: which of the ten channels tend to be more open vs.
 * more narrowed in each of the six existing arousal zones (see
 * ../polyvagal/arousalBands.ts — this reuses that exact 'zone1'..
 * 'zone6' id, not a new zone concept of its own).
 *
 * What's directly sourced (see FACHLICHE_GRUNDLAGEN.md §2, §6): the
 * general pattern that the cognitive/executive channels close first
 * under rising activation or shutdown, while sensory, motor,
 * interoceptive and social channels stay comparatively available —
 * the whole premise behind Scaffolding and channel-switching. The
 * specific per-zone split below is this app's own editorial synthesis
 * of that pattern together with the zone hint texts already written
 * for arousalZones (t.polyvagal.arousalZones), not a line-by-line
 * citation — flagged here plainly rather than dressed up as more
 * rigorous than it is.
 *
 * Deliberately two tiers, not a 1-10 score per channel: a finer
 * number would claim a precision this doesn't have and would be
 * harder to keep making sense of. Every channel appears in exactly
 * one tier per zone — nothing is silently left out.
 */
export interface ZoneAccessibility {
  open: AccessChannel[];
  narrowed: AccessChannel[];
}

export const ZONE_ACCESSIBILITY: Record<ArousalBand['id'], ZoneAccessibility> = {
  // "Regeneration & Pause" — safe rest, but can also show as tiredness.
  // Nothing closed, but focused thinking and getting started both cost
  // more than usual.
  zone1: {
    open: ['koerper_innen', 'sinne', 'aufmerksamkeit', 'bewegung', 'beziehung', 'fuehlen', 'erinnerung', 'ort_zeit'],
    narrowed: ['denken', 'ausfuehren'],
  },
  // "Fokus & Flow" — the sweet spot. Everything tends to be reachable.
  zone2: {
    open: ['denken', 'erinnerung', 'fuehlen', 'koerper_innen', 'sinne', 'aufmerksamkeit', 'bewegung', 'ausfuehren', 'beziehung', 'ort_zeit'],
    narrowed: [],
  },
  // "Grenzzone" — matches the zone's own hint text: concentration
  // starts costing more, before much else is affected.
  zone3: {
    open: ['koerper_innen', 'sinne', 'bewegung', 'beziehung', 'fuehlen', 'erinnerung', 'ort_zeit', 'aufmerksamkeit'],
    narrowed: ['denken', 'ausfuehren'],
  },
  // "Hyperarousal" — matches the zone's own hint text: clear, logical
  // thinking is harder to reach, reactions run more automatic.
  zone4: {
    open: ['sinne', 'bewegung', 'koerper_innen', 'beziehung', 'fuehlen', 'aufmerksamkeit'],
    narrowed: ['denken', 'erinnerung', 'ausfuehren', 'ort_zeit'],
  },
  // "Mischzustand / Freeze" — the classic case from the ergotherapy
  // material: wanting and knowing intact, execution blocked.
  // Bewegung stays listed as open deliberately (a gentle, tiny
  // movement invitation is a recognised way IN, even while larger
  // movement may feel far away) — not a claim that movement is easy
  // here, only that it's a more promising entry point than thinking.
  zone5: {
    open: ['sinne', 'koerper_innen', 'beziehung', 'aufmerksamkeit', 'bewegung'],
    narrowed: ['denken', 'erinnerung', 'fuehlen', 'ausfuehren', 'ort_zeit'],
  },
  // "Shutdown" — matches the zone's own hint text: only the most
  // basic keeps running. Narrowest set of all six zones.
  zone6: {
    open: ['koerper_innen', 'sinne', 'beziehung', 'bewegung'],
    narrowed: ['denken', 'erinnerung', 'fuehlen', 'aufmerksamkeit', 'ausfuehren', 'ort_zeit'],
  },
};

export function isChannelOpenInZone(channel: AccessChannel, zone: ArousalBand['id']): boolean {
  return ZONE_ACCESSIBILITY[zone].open.includes(channel);
}
