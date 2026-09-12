import type { NeedDirection } from '../../data/types';

/**
 * "Gesamtpruefung"-Auftrag — real gap found and closed: bridges tagged
 * via the newer, granular linkedNeeds field (GFK vocabulary, e.g.
 * "Ruhe", "Schutz") never surfaced on the Bedürfniskompass page, which
 * only matched bridges by a coarser category field
 * (NEED_TO_BRIDGE_CATEGORY). A bridge explicitly linked to "Ruhe" by
 * its own creator was invisible here unless its category also
 * happened to line up — the connection the person had actually made
 * was silently dropped. This mapping is intentionally many-to-one in
 * places (several GFK words can express one broad direction) rather
 * than a strict 1:1 translation.
 */
export const NEED_DIRECTION_TO_GFK: Record<NeedDirection, string[]> = {
  verbindung: [
    'Wertschätzung', 'Nähe', 'Zugehörigkeit', 'Liebe', 'Intimität', 'Unterstützung', 'Ehrlichkeit', 'Gemeinschaft',
    'Geborgenheit', 'Respekt', 'Kontakt', 'Akzeptanz', 'Austausch', 'Offenheit', 'Vertrauen', 'Anerkennung',
    'Freundschaft', 'Achtsamkeit', 'Aufmerksamkeit', 'Toleranz', 'Zusammenarbeit',
  ],
  zugehoerigkeit: ['Zugehörigkeit', 'Gemeinschaft', 'Akzeptanz', 'Freundschaft'],
  autonomie: ['Freiheit', 'Selbstbestimmung'],
  sicherheit: ['Schutz', 'Übersicht', 'Klarheit', 'Abgrenzung', 'Privatsphäre', 'Struktur'],
  ruhe: ['Erholung', 'Ausruhen', 'Ruhe', 'Leichtigkeit'],
  orientierung: ['Übersicht', 'Klarheit', 'Struktur', 'Ordnung'],
  bewegung: ['Bewegung', 'Kraft'],
  ausdruck: ['Kreativität', 'Authentizität', 'Individualität'],
  wertschaetzung: ['Wertschätzung', 'Anerkennung', 'Respekt'],
  freude: ['Freude', 'Glück', 'Spiel', 'Humor'],
  sinn: ['Sinn', 'Bedeutung', 'Beitrag'],
  selbstwirksamkeit: ['Kompetenz', 'Wirksamkeit', 'Effektivität', 'Erfolg'],
  koerperliche_unversehrtheit: ['Gesundheit', 'Heilung', 'Schutz', 'Sicherheit'],
  koerperliche_versorgung: ['Luft', 'Wasser', 'Nahrung', 'Wärme', 'Gesundheit', 'Heilung', 'Lebenserhaltung'],
  schlaf: ['Schlaf'],
};
