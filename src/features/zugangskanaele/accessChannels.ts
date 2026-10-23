import type { TranslationDictionary } from '../../i18n/de';
import type { AccessChannel } from '../../data/types';
import { Brain, Album, Heart, HeartPulse, Eye, Focus, PersonStanding, Play, Users, Compass } from 'lucide-react';

/**
 * "Zugangskanäle & Zugänglichkeit, Schritt 1"-Auftrag — the shared
 * vocabulary this whole next phase is built on. See
 * FACHLICHE_GRUNDLAGEN.md §1 for the full professional grounding and
 * sources behind each channel; this file only carries what the app
 * itself needs (warm label, hint, icon, whether it still works in a
 * crisis). The AccessChannel type itself lives in data/types.ts,
 * alongside every other domain type — see it for why.
 *
 * Ten channels, not four: the smaller "crisis" set is a VIEW over
 * this same list (crisisReady: true), never a separate, second
 * vocabulary to keep in sync by hand.
 */

export const ACCESS_CHANNEL_META: Record<
  AccessChannel,
  { label: (t: TranslationDictionary) => string; hint: (t: TranslationDictionary) => string; icon: typeof Heart; crisisReady: boolean }
> = {
  denken: { label: (t) => t.zugangskanaele.channels.denken, hint: (t) => t.zugangskanaele.hints.denken, icon: Brain, crisisReady: false },
  erinnerung: { label: (t) => t.zugangskanaele.channels.erinnerung, hint: (t) => t.zugangskanaele.hints.erinnerung, icon: Album, crisisReady: false },
  fuehlen: { label: (t) => t.zugangskanaele.channels.fuehlen, hint: (t) => t.zugangskanaele.hints.fuehlen, icon: Heart, crisisReady: false },
  koerper_innen: { label: (t) => t.zugangskanaele.channels.koerper_innen, hint: (t) => t.zugangskanaele.hints.koerper_innen, icon: HeartPulse, crisisReady: true },
  sinne: { label: (t) => t.zugangskanaele.channels.sinne, hint: (t) => t.zugangskanaele.hints.sinne, icon: Eye, crisisReady: true },
  aufmerksamkeit: { label: (t) => t.zugangskanaele.channels.aufmerksamkeit, hint: (t) => t.zugangskanaele.hints.aufmerksamkeit, icon: Focus, crisisReady: true },
  bewegung: { label: (t) => t.zugangskanaele.channels.bewegung, hint: (t) => t.zugangskanaele.hints.bewegung, icon: PersonStanding, crisisReady: true },
  ausfuehren: { label: (t) => t.zugangskanaele.channels.ausfuehren, hint: (t) => t.zugangskanaele.hints.ausfuehren, icon: Play, crisisReady: false },
  beziehung: { label: (t) => t.zugangskanaele.channels.beziehung, hint: (t) => t.zugangskanaele.hints.beziehung, icon: Users, crisisReady: true },
  ort_zeit: { label: (t) => t.zugangskanaele.channels.ort_zeit, hint: (t) => t.zugangskanaele.hints.ort_zeit, icon: Compass, crisisReady: false },
};

export const ACCESS_CHANNEL_ORDER: AccessChannel[] = [
  'denken',
  'erinnerung',
  'fuehlen',
  'koerper_innen',
  'sinne',
  'aufmerksamkeit',
  'bewegung',
  'ausfuehren',
  'beziehung',
  'ort_zeit',
];

/** The crisis-ready subset, in the same order — a view, not a second list. */
export const CRISIS_READY_CHANNELS: AccessChannel[] = ACCESS_CHANNEL_ORDER.filter((c) => ACCESS_CHANNEL_META[c].crisisReady);

/** Old sensoryModalities id -> new AccessChannel id. The old, narrower
 * list only ever covered senses plus movement plus "gedanklich" — every
 * old value has an exact or closest-fit new home, so nothing tagged
 * before this change is silently lost. */
const LEGACY_MODALITY_MIGRATION: Record<string, AccessChannel> = {
  bewegung: 'bewegung',
  beruehrung: 'sinne',
  hoeren: 'sinne',
  sehen: 'sinne',
  riechen: 'sinne',
  schmecken: 'sinne',
  gedanklich: 'denken',
};

/** Maps a list of stored tag values (old modality ids, new channel ids,
 * or a mix) to valid, deduplicated AccessChannel ids. Safe to call on
 * already-migrated data — unrecognised values are dropped rather than
 * left in an invalid state. */
export function migrateAccessChannelValues(values: string[] | undefined): AccessChannel[] {
  if (!values || values.length === 0) return [];
  const isChannel = (v: string): v is AccessChannel => (ACCESS_CHANNEL_ORDER as string[]).includes(v);
  const mapped = values.map((v) => (isChannel(v) ? v : LEGACY_MODALITY_MIGRATION[v])).filter((v): v is AccessChannel => !!v);
  return Array.from(new Set(mapped));
}
