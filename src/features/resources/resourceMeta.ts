import type { ResourceCategory } from '../../data/types';
import type { TranslationDictionary } from '../../i18n/de';

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
