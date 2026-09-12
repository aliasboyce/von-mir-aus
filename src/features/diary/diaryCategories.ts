import { createCustomCategoryStore } from '../../services/customCategories';

/** Fixed default category — not part of the dynamic store, so it can never
 * be accidentally deleted or renamed. Entries without a categoryId (older
 * data, or entries created before categories existed) belong here too. */
export const DIARY_DEFAULT_CATEGORY_ID = 'allgemeines';
export const DIARY_DEFAULT_CATEGORY_LABEL = 'Allgemeines';

export const diaryCategoriesStore = createCustomCategoryStore('diary-custom-categories');

export function effectiveDiaryCategory(categoryId: string | undefined): string {
  return categoryId ?? DIARY_DEFAULT_CATEGORY_ID;
}
