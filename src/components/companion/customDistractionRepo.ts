import { createRepository } from '../../services/storage/repository';
import type { CustomDistractionCategory, CustomDistractionItem } from '../../data/types';

export const customDistractionCategoriesRepo = createRepository<CustomDistractionCategory>('custom-distraction-categories');
export const customDistractionItemsRepo = createRepository<CustomDistractionItem>('custom-distraction-items');

export function itemsForCategory(categoryId: string): CustomDistractionItem[] {
  return customDistractionItemsRepo.getAll().filter((i) => i.categoryId === categoryId);
}

/** Point 7 — a person's own additions to a *built-in* category (Rätsel,
 * Wortspiele, ...), as opposed to a fully custom category of their own.
 * Reuses the exact same CustomDistractionItem shape and repo — the only
 * difference is the categoryId convention "builtin:<category>" instead
 * of a real custom-category id, so no second data structure is needed
 * for what is functionally the same thing (a person's own text +
 * optional answer + source). */
export function builtinCategoryKey(category: string): string {
  return `builtin:${category}`;
}

export function ownItemsForBuiltinCategory(category: string): CustomDistractionItem[] {
  return itemsForCategory(builtinCategoryKey(category));
}
