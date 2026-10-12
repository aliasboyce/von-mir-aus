import type { Bookmark, NeedDirection, Resource } from '../data/types';
import { RESOURCE_CATEGORY_TO_GROUP } from '../features/resources/resourceMeta';

/**
 * "Nach dem Check-in soll nach Auswahl des Beduerfnisses an die
 * Ressourcen weitergeleitet werden, die zu diesem Beduerfnis passen"-
 * Auftrag. A resource fits a need when the person tagged it for that need
 * (Resource.linkedNeeds, set in the Hilfsmittel / Skill form). Until
 * someone tags an item, a sensible default by category applies, so the
 * built-in content is useful from the first check-in on: e.g. Ruhe ->
 * hearing, smell, comfort and touch tools plus mindfulness / distress
 * skills; Bewegung -> motor tools; Verbindung -> places and interpersonal
 * skills. Editorial mapping, deliberately broad.
 */
export const NEED_DEFAULT_CATEGORIES: Record<NeedDirection, { hilfsmittel: string[]; skills: string[] }> = {
  koerperliche_versorgung: { hilfsmittel: ['gustatorisch', 'komfort', 'strukturell'], skills: [] },
  schlaf: { hilfsmittel: ['komfort', 'olfaktorisch', 'auditiv'], skills: ['achtsamkeit'] },
  bewegung: { hilfsmittel: ['motorisch', 'aktivitaeten'], skills: [] },
  sicherheit: { hilfsmittel: ['komfort', 'haptisch', 'olfaktorisch'], skills: ['stresstoleranz'] },
  verbindung: { hilfsmittel: ['orte', 'aktivitaeten'], skills: ['zwischenmenschlich'] },
  zugehoerigkeit: { hilfsmittel: ['orte'], skills: ['zwischenmenschlich'] },
  autonomie: { hilfsmittel: ['strukturell'], skills: ['zwischenmenschlich', 'mittelweg'] },
  orientierung: { hilfsmittel: ['strukturell', 'kognitiv', 'visuell'], skills: ['achtsamkeit'] },
  ruhe: { hilfsmittel: ['auditiv', 'olfaktorisch', 'komfort', 'haptisch', 'orte'], skills: ['achtsamkeit', 'stresstoleranz'] },
  ausdruck: { hilfsmittel: ['kognitiv', 'motorisch', 'auditiv', 'aktivitaeten'], skills: ['emotionsregulation'] },
  wertschaetzung: { hilfsmittel: ['kognitiv'], skills: ['zwischenmenschlich'] },
  freude: { hilfsmittel: ['auditiv', 'gustatorisch', 'visuell', 'motorisch', 'aktivitaeten'], skills: ['emotionsregulation'] },
  sinn: { hilfsmittel: ['kognitiv', 'orte'], skills: ['mittelweg', 'achtsamkeit'] },
  selbstwirksamkeit: { hilfsmittel: ['strukturell', 'motorisch', 'aktivitaeten'], skills: ['emotionsregulation'] },
  koerperliche_unversehrtheit: { hilfsmittel: ['komfort', 'haptisch'], skills: ['stresstoleranz'] },
};

export function resourceFitsNeed(r: Resource, need: NeedDirection): boolean {
  if (r.linkedNeeds && r.linkedNeeds.length > 0) return r.linkedNeeds.includes(need);
  const isSkill = RESOURCE_CATEGORY_TO_GROUP[r.category] === 'faehigkeiten';
  const defaults = NEED_DEFAULT_CATEGORIES[need];
  return (isSkill ? defaults.skills : defaults.hilfsmittel).includes(r.category);
}

/** Rough default for sources the person has not tagged themselves, by the category's name. */
const BOOKMARK_NEED_DEFAULTS: { match: RegExp; needs: NeedDirection[] }[] = [
  { match: /anlaufstell|hilfsangebot|krise/i, needs: ['sicherheit', 'koerperliche_unversehrtheit', 'verbindung', 'zugehoerigkeit'] },
  { match: /fachlich|wissen|verstehen/i, needs: ['orientierung', 'sinn', 'autonomie', 'selbstwirksamkeit'] },
  { match: /übung|uebung/i, needs: ['ruhe', 'schlaf', 'bewegung', 'ausdruck'] },
  { match: /inspiration/i, needs: ['freude', 'sinn', 'wertschaetzung', 'ausdruck'] },
];

/** A source fits a need when tagged for it; untagged ones fall back to their category's name. */
export function bookmarkFitsNeed(b: Bookmark, need: NeedDirection, categoryLabel: string): boolean {
  if (b.linkedNeeds && b.linkedNeeds.length > 0) return b.linkedNeeds.includes(need);
  return BOOKMARK_NEED_DEFAULTS.some((d) => d.match.test(categoryLabel) && d.needs.includes(need));
}
