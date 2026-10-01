import type { ResourceCategory, ResourceCategoryGroup } from '../../data/types';
import type { TranslationDictionary } from '../../i18n/de';
import { Sparkles, Wrench, MapPin, Activity } from 'lucide-react';
import { AROUSAL_BANDS } from '../polyvagal/arousalBands';

/**
 * "Die 4 klassischen Basis-Module"-Auftrag — 'uebungen' (a generic,
 * unused placeholder — no demo resource ever used it) replaced by the
 * four actual DBT modules as the Skills sub-categories: Innere
 * Achtsamkeit, Stresstoleranz, Emotionsregulation, Zwischenmenschliche
 * Fertigkeiten. All four map to the same 'faehigkeiten' group below,
 * so they appear exactly where 'uebungen' used to on the existing
 * category-chip UI — no new UI concept needed, just richer content
 * under the one that was already there.
 */
export const RESOURCE_CATEGORY_ORDER: ResourceCategory[] = [
  'musik',
  'natur',
  'wissen',
  'videos',
  'texte',
  'apps',
  'buecher',
  'orte',
  'achtsamkeit',
  'stresstoleranz',
  'emotionsregulation',
  'zwischenmenschlich',
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
/**
 * "Jede Unterkategorie in der Farbe aus dem Zustandsbereich, wo diese
 * Skills angewendet werden"-Auftrag — each of the four DBT modules
 * tinted with the arousal-zone color where it's actually used, per
 * the person's own text: Stresstoleranz explicitly for the
 * "Hochstressbereich" (Hyperarousal, red); Emotionsregulation for
 * catching things "bevor die Anspannung in den kritischen
 * Krisenbereich rutscht" (Frühwarnbereich, yellow/orange, the exact
 * zone already described that way in the big explainer text);
 * Zwischenmenschliche Fertigkeiten from its own DEAR MAN example,
 * placed in the "Niedriger Bereich/Alltag" (Konzentration & Alltag,
 * olive — functioning/engaged, not deep rest); Innere Achtsamkeit as
 * "die Basis" maps to Fokus & Flow (light green), the optimal-presence
 * zone mindfulness itself aims to cultivate. Reads AROUSAL_BANDS
 * directly rather than hardcoding hex values a second time, so this
 * stays in sync if the zone colors ever change again.
 */
export const SKILL_CATEGORY_ZONE_COLOR: Partial<Record<ResourceCategory, string>> = {
  achtsamkeit: AROUSAL_BANDS[2].color,
  zwischenmenschlich: AROUSAL_BANDS[1].color,
  emotionsregulation: AROUSAL_BANDS[3].color,
  stresstoleranz: AROUSAL_BANDS[4].color,
};

export const RESOURCE_CATEGORY_TO_GROUP: Partial<Record<ResourceCategory, ResourceCategoryGroup>> = {
  achtsamkeit: 'faehigkeiten',
  stresstoleranz: 'faehigkeiten',
  emotionsregulation: 'faehigkeiten',
  zwischenmenschlich: 'faehigkeiten',
  musik: 'hilfsmittel',
  videos: 'hilfsmittel',
  texte: 'hilfsmittel',
  buecher: 'hilfsmittel',
  apps: 'hilfsmittel',
  wissen: 'hilfsmittel',
  orte: 'orte_gruppe',
  natur: 'orte_gruppe',
};
