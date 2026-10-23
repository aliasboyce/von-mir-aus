import type { HelpsWith, NetworkCategoryConfig } from '../../data/types';
import type { TranslationDictionary } from '../../i18n/de';
import { BUILT_IN_CATEGORY_IDS } from './networkCategories';

export const HELPS_WITH_ORDER: HelpsWith[] = ['alltag', 'krise', 'vorbeugung', 'entscheidung'];

export function helpsWithLabel(t: TranslationDictionary, value: HelpsWith): string {
  return (t.network.helpsWith as Record<string, string>)[value] ?? value;
}

/** Built-in categories are translated; custom ones use the label the person gave them. */
export function categoryLabel(t: TranslationDictionary, category: NetworkCategoryConfig): string {
  if ((BUILT_IN_CATEGORY_IDS as readonly string[]).includes(category.id)) {
    return t.network.categories[category.id as keyof typeof t.network.categories];
  }
  return category.label;
}
