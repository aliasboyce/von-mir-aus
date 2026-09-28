import type { ResourceCategory, ResourceCategoryGroup } from '../../data/types';
import type { TranslationDictionary } from '../../i18n/de';
import { Sparkles, Wrench, MapPin, Activity } from 'lucide-react';

export const RESOURCE_CATEGORY_ORDER: ResourceCategory[] = [
  'musik',
  'natur',
  'wissen',
  'videos',
  'texte',
  'apps',
  'buecher',
  'orte',
  'uebungen',
  'menschen',
  'sonstiges',
];

export function resourceCategoryLabel(t: TranslationDictionary, category: ResourceCategory): string {
  return (t.resources.categories as Record<string, string>)[category] ?? category;
}

/**
 * "Ressourcen in Unterkategorien aufteilen"-Auftrag — see
 * data/types.ts ResourceCategoryGroup for why this is a layer ABOVE
 * the existing categories, not a replacement, and why there's no
 * "Beziehungen" group (people stay in das Netzwerk). Mapping is
 * editorial: 'uebungen' is the one built-in category that's genuinely
 * a practiced skill, so it's the sole occupant of Fähigkeiten;
 * 'wissen' sits under Hilfsmittel (something drawn on, like the media
 * categories) rather than under Fähigkeiten, since it's knowledge
 * reached for, not a practiced ability. 'sonstiges' and 'menschen' are
 * deliberately ungrouped — both stay in their own section rather than
 * being forced into one of the four.
 */
export const RESOURCE_CATEGORY_GROUP_META: Record<ResourceCategoryGroup, { label: (t: TranslationDictionary) => string; icon: typeof Sparkles }> = {
  faehigkeiten: { label: (t) => t.resources.categoryGroups.faehigkeiten, icon: Sparkles },
  hilfsmittel: { label: (t) => t.resources.categoryGroups.hilfsmittel, icon: Wrench },
  orte_gruppe: { label: (t) => t.resources.categoryGroups.orte_gruppe, icon: MapPin },
  aktivitaeten: { label: (t) => t.resources.categoryGroups.aktivitaeten, icon: Activity },
};

export const RESOURCE_CATEGORY_GROUP_ORDER: ResourceCategoryGroup[] = ['faehigkeiten', 'hilfsmittel', 'orte_gruppe', 'aktivitaeten'];

/** Built-in category → group. Categories not listed here ('sonstiges'
 * and 'menschen' — see doc comment above) have no group and stay in
 * their own section. */
export const RESOURCE_CATEGORY_TO_GROUP: Partial<Record<ResourceCategory, ResourceCategoryGroup>> = {
  uebungen: 'faehigkeiten',
  musik: 'hilfsmittel',
  videos: 'hilfsmittel',
  texte: 'hilfsmittel',
  buecher: 'hilfsmittel',
  apps: 'hilfsmittel',
  wissen: 'hilfsmittel',
  orte: 'orte_gruppe',
  natur: 'orte_gruppe',
};
