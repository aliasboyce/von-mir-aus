import { useCallback, useState } from 'react';
import { networkCategoriesStore } from './networkCategories';
import type { NetworkCategoryConfig } from '../../data/types';

export function useNetworkCategories() {
  const [categories, setCategories] = useState<NetworkCategoryConfig[]>(() =>
    networkCategoriesStore.get(),
  );

  const persist = useCallback((next: NetworkCategoryConfig[]) => {
    networkCategoriesStore.set(next);
    setCategories(next);
  }, []);

  const updateCategory = useCallback(
    (id: string, patch: Partial<NetworkCategoryConfig>) => {
      persist(categories.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    },
    [categories, persist],
  );

  const addCategory = useCallback(
    (category: NetworkCategoryConfig) => {
      persist([...categories, category]);
    },
    [categories, persist],
  );

  const removeCategory = useCallback(
    (id: string) => {
      persist(categories.filter((c) => c.id !== id));
    },
    [categories, persist],
  );

  const getCategory = useCallback(
    (id: string) => categories.find((c) => c.id === id) ?? categories[0],
    [categories],
  );

  return { categories, persist, updateCategory, addCategory, removeCategory, getCategory };
}
