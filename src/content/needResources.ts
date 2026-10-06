import type { NeedDirection, Resource } from '../data/types';
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
  bewegung: { hilfsmittel: ['motorisch'], skills: [] },
  sicherheit: { hilfsmittel: ['komfort', 'haptisch', 'olfaktorisch'], skills: ['stresstoleranz'] },
  verbindung: { hilfsmittel: ['orte'], skills: ['zwischenmenschlich'] },
  zugehoerigkeit: { hilfsmittel: ['orte'], skills: ['zwischenmenschlich'] },
  autonomie: { hilfsmittel: ['strukturell'], skills: ['zwischenmenschlich', 'mittelweg'] },
  orientierung: { hilfsmittel: ['strukturell', 'kognitiv', 'visuell'], skills: ['achtsamkeit'] },
  ruhe: { hilfsmittel: ['auditiv', 'olfaktorisch', 'komfort', 'haptisch'], skills: ['achtsamkeit', 'stresstoleranz'] },
  ausdruck: { hilfsmittel: ['kognitiv', 'motorisch', 'auditiv'], skills: ['emotionsregulation'] },
  wertschaetzung: { hilfsmittel: ['kognitiv'], skills: ['zwischenmenschlich'] },
  freude: { hilfsmittel: ['auditiv', 'gustatorisch', 'visuell', 'motorisch'], skills: ['emotionsregulation'] },
  sinn: { hilfsmittel: ['kognitiv', 'orte'], skills: ['mittelweg', 'achtsamkeit'] },
  selbstwirksamkeit: { hilfsmittel: ['strukturell', 'motorisch'], skills: ['emotionsregulation'] },
  koerperliche_unversehrtheit: { hilfsmittel: ['komfort', 'haptisch'], skills: ['stresstoleranz'] },
};

export function resourceFitsNeed(r: Resource, need: NeedDirection): boolean {
  if (r.linkedNeeds && r.linkedNeeds.length > 0) return r.linkedNeeds.includes(need);
  const isSkill = RESOURCE_CATEGORY_TO_GROUP[r.category] === 'faehigkeiten';
  const defaults = NEED_DEFAULT_CATEGORIES[need];
  return (isSkill ? defaults.skills : defaults.hilfsmittel).includes(r.category);
}
