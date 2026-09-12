import { createKeyValueStore } from '../../services/storage/keyValueStore';
import type { DiaryFont } from './diaryFonts';

export interface DiaryCategoryStyle {
  font?: DiaryFont;
  color?: string;
}

const store = createKeyValueStore<Record<string, DiaryCategoryStyle>>('diary-category-styles', {});

/**
 * Keyed by category id (including the fixed "Allgemeines" id, which
 * isn't part of the dynamic category store but can still have its own
 * style here) — deliberately its own small store rather than adding
 * font/color fields to the shared SimpleCustomCategory shape used by
 * bridges/resources/network/etc., so this stays entirely scoped to the
 * diary and never touches those other features' data.
 */
export function getCategoryStyle(categoryId: string): DiaryCategoryStyle {
  return (store.get() ?? {})[categoryId] ?? {};
}

export function setCategoryStyle(categoryId: string, style: DiaryCategoryStyle): void {
  const current = store.get() ?? {};
  store.set({ ...current, [categoryId]: style });
}
