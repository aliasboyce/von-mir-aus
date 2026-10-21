import type { Bridge, BridgeCategory, NeedDirection, Resource } from '../../data/types';
import { NEED_CATEGORY_GROUPS } from '../zugang/zugangContent';
import { NEED_DIRECTION_TO_GFK } from '../accessWheel/needDirectionToGfk';
import { resourceFitsNeed } from '../../content/needResources';
import { RESOURCE_CATEGORY_TO_GROUP } from '../resources/resourceMeta';

/**
 * "Brücken: wieder mehr Verbindung zu einem Wert/Lebensbereich herstellen …
 * zu Werten und Bedürfnissen … welche Ressourcen erfüllen welche Bedürfnisse,
 * also können wir Ressource xy in einer Brücke aufnehmen, die Bedürfnis xy
 * erfüllt."
 *
 * The chain that ties it together, with the vocabularies the app already has:
 *   Wert / Lebensrichtung (Wertekompass, CONNECTION_ITEMS_DE)
 *     → Bedürfnisse (the same Bedürfnis words as in Zugang)
 *       → Bedürfnis-Richtung (the 15 coarse directions Ressourcen are tagged with)
 *         → Ressourcen that fit (resourceFitsNeed).
 * Nothing here is a new list of its own: it only links the existing ones.
 */
export const VALUE_NEEDS: Record<string, string[]> = {
  Kreativität: ['Kreativität', 'Ausdruck', 'Inspiration', 'Spiel'],
  Produktivität: ['Effektivität', 'Gelingen', 'Erfolg', 'Kompetenz spüren'],
  'soziale Verbindung': ['Kontakt', 'Zugehörigkeit', 'Austausch', 'Gemeinschaft'],
  'emotionale Verbindung': ['Nähe', 'Vertrauen', 'Offenheit', 'Wahrgenommen werden', 'Verständigung'],
  Verantwortung: ['Verbindlichkeit', 'Beitrag', 'Struktur'],
  Dankbarkeit: ['Dankbarkeit', 'Wertschätzung', 'Anerkennung'],
  Familie: ['Geborgenheit', 'Zugehörigkeit', 'Nähe', 'Fürsorge'],
  Partnerschaft: ['Liebe', 'Intimität', 'Nähe', 'Vertrauen'],
  Freundschaft: ['Freundschaft', 'Unterstützung', 'Verständigung'],
  Gemeinschaft: ['Gemeinschaft', 'Zusammenarbeit', 'Einbezogen sein', 'Zugehörigkeit'],
  Identität: ['Identität', 'Authentizität', 'Individualität', 'Eigenen Platz haben'],
  Tageslicht: ['Wärme', 'Gesundheit', 'Leichtigkeit'],
  Rhythmus: ['Struktur', 'Beständigkeit', 'Orientierung', 'Ordnung'],
  Natur: ['Ruhe', 'Frieden', 'Ästhetik', 'Erholung'],
  Tiere: ['Nähe', 'Fürsorge', 'Geborgenheit'],
  Schlaf: ['Schlaf', 'Erholung', 'Ruhe'],
  Erholung: ['Erholung', 'Ausruhen', 'Ruhe', 'Gelassenheit'],
  'Wasser/Nahrung': ['Wasser', 'Nahrung', 'Gesundheit'],
  Bewegung: ['Bewegung', 'Kraft', 'Gesundheit'],
  Integrität: ['Übereinstimmung mit eigenen Werten', 'Einklang', 'Authentizität'],
  Ehrlichkeit: ['Ehrlichkeit', 'Offenheit', 'Authentizität'],
  Spiritualität: ['innerer Friede', 'Bedeutung geben', 'Stille'],
  Sinn: ['Bedeutung geben', 'Werte leben', 'das Leben verstehen', 'einen roten Faden erkennen'],
  Humor: ['Humor', 'Leichtigkeit', 'Freude'],
  Lachen: ['Freude', 'Glück', 'Leichtigkeit'],
  Neugier: ['Abenteuer', 'Vielfalt', 'Lernen'],
  Lernen: ['Lernen', 'Wachstum', 'Bildung', 'Kompetenz spüren'],
};

/** Needs that belong to the chosen values (without duplicates). */
export function needsForValues(values: string[] | undefined): string[] {
  return Array.from(new Set((values ?? []).flatMap((v) => VALUE_NEEDS[v] ?? [])));
}

/** Everything a bridge stands for: the needs the person ticked plus those that belong to its values. */
export function bridgeNeeds(b: Pick<Bridge, 'linkedNeeds' | 'connectionTags'>): string[] {
  return Array.from(new Set([...(b.linkedNeeds ?? []), ...needsForValues(b.connectionTags)]));
}

export function bridgeMatchesValue(b: Pick<Bridge, 'connectionTags'>, value: string): boolean {
  return (b.connectionTags ?? []).includes(value);
}
export function bridgeMatchesNeed(b: Pick<Bridge, 'linkedNeeds' | 'connectionTags'>, need: string): boolean {
  return bridgeNeeds(b).includes(need);
}

/** Group the Bedürfnis word belongs to (for the folded need list). */
export function needGroupOf(word: string): string | undefined {
  return NEED_CATEGORY_GROUPS.find((g) => g.items.includes(word))?.id;
}

const GROUP_FALLBACK_DIRECTION: Record<string, NeedDirection> = {
  autonomie: 'autonomie',
  koerper: 'koerperliche_versorgung',
  koerperliche_unversehrtheit: 'koerperliche_unversehrtheit',
  integritaet: 'ausdruck',
  sicherheit: 'sicherheit',
  verbindung: 'verbindung',
  entspannung: 'ruhe',
  geistig: 'freude',
  sinn_kohaerenz: 'sinn',
  selbstwirksamkeit: 'selbstwirksamkeit',
  entwicklung: 'selbstwirksamkeit',
  einfuehlung: 'verbindung',
};

/** The coarse need directions a Bedürfnis word stands for (what Ressourcen are tagged with). */
export function directionsForNeedWord(word: string): NeedDirection[] {
  const dirs = (Object.keys(NEED_DIRECTION_TO_GFK) as NeedDirection[]).filter((d) => NEED_DIRECTION_TO_GFK[d].includes(word));
  if (dirs.length > 0) return dirs;
  const g = needGroupOf(word);
  return g && GROUP_FALLBACK_DIRECTION[g] ? [GROUP_FALLBACK_DIRECTION[g]] : [];
}

/**
 * Existing Ressourcen that fulfil at least one of the given needs — those a person can pick
 * for a step of a bridge toward a value with these needs. Most matching needs first, then
 * the ones that were tagged on purpose, skills and Hilfsmittel mixed.
 */
export function resourcesForNeeds(needWords: string[], all: Resource[]): { resource: Resource; kind: 'skill' | 'hilfsmittel' | 'ort' | 'aktivitaet'; score: number }[] {
  const dirs = Array.from(new Set(needWords.flatMap(directionsForNeedWord)));
  if (dirs.length === 0) return [];
  return all
    .map((r) => ({
      resource: r,
      kind: (RESOURCE_CATEGORY_TO_GROUP[r.category] === 'faehigkeiten' ? 'skill' : r.category === 'orte' ? 'ort' : r.category === 'aktivitaeten' ? 'aktivitaet' : 'hilfsmittel') as 'skill' | 'hilfsmittel' | 'ort' | 'aktivitaet',
      score: dirs.filter((d) => resourceFitsNeed(r, d)).length + (r.linkedNeeds && r.linkedNeeds.length > 0 ? 0.5 : 0),
    }))
    .filter((x) => x.score >= 1)
    .sort((a, b) => b.score - a.score);
}

/** Internal grouping category (kept on the stored record for older features); never shown. */
const VALUE_TO_CATEGORY: Record<string, BridgeCategory> = {
  Kreativität: 'gedanken_werte_intra',
  Produktivität: 'gedanken_werte_intra',
  'soziale Verbindung': 'menschen_inter',
  'emotionale Verbindung': 'menschen_inter',
  Verantwortung: 'gedanken_werte_intra',
  Dankbarkeit: 'gefuehle_intra',
  Familie: 'menschen_inter',
  Partnerschaft: 'menschen_inter',
  Freundschaft: 'menschen_inter',
  Gemeinschaft: 'gemeinschaft_inter',
  Identität: 'gedanken_werte_intra',
  Tageslicht: 'koerper_intra',
  Rhythmus: 'koerper_intra',
  Natur: 'natur_inter',
  Tiere: 'natur_inter',
  Schlaf: 'koerper_intra',
  Erholung: 'koerper_intra',
  'Wasser/Nahrung': 'koerper_intra',
  Bewegung: 'koerper_intra',
  Integrität: 'gedanken_werte_intra',
  Ehrlichkeit: 'gedanken_werte_intra',
  Spiritualität: 'transzendent',
  Sinn: 'gedanken_werte_intra',
  Humor: 'gefuehle_intra',
  Lachen: 'gefuehle_intra',
  Neugier: 'gedanken_werte_intra',
  Lernen: 'gedanken_werte_intra',
};
export function categoryForValues(values: string[] | undefined, fallback: BridgeCategory = 'gedanken_werte_intra'): BridgeCategory {
  const first = (values ?? []).find((v) => VALUE_TO_CATEGORY[v]);
  return first ? VALUE_TO_CATEGORY[first] : fallback;
}

/** Older bridges only know a category — which values it most likely stood for. */
const LEGACY_CATEGORY_VALUES: Record<string, string[]> = {
  koerper_intra: ['Erholung', 'Bewegung'],
  gefuehle_intra: ['emotionale Verbindung', 'Dankbarkeit'],
  gedanken_werte_intra: ['Sinn', 'Identität'],
  inneres_kind_intra: ['emotionale Verbindung', 'Erholung'],
  menschen_inter: ['soziale Verbindung', 'Freundschaft'],
  gemeinschaft_inter: ['Gemeinschaft'],
  natur_inter: ['Natur'],
  praesenz_inter: ['Erholung'],
  vergangenheit_temporal: ['Identität'],
  zukunft_temporal: ['Sinn'],
  transzendent: ['Spiritualität'],
};
export function valuesForLegacyCategory(cat: string): string[] {
  const v = LEGACY_CATEGORY_VALUES[cat];
  return v && v.length > 0 ? v : ['Identität'];
}
