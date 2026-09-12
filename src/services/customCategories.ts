import { createRepository, createId } from '../services/storage/repository';

export interface SimpleCustomCategory {
  id: string;
  label: string;
}

export function createCustomCategoryStore(storageKey: string, defaultLabels: string[] = []) {
  const repo = createRepository<SimpleCustomCategory>(storageKey);

  if (defaultLabels.length > 0) {
    repo.seedIfEmpty(defaultLabels.map((label) => ({ id: createId('cat'), label })));
  }

  return {
    getAll(): SimpleCustomCategory[] {
      return repo.getAll();
    },
    add(label: string): SimpleCustomCategory {
      const category: SimpleCustomCategory = { id: createId('cat'), label };
      repo.save(category);
      return category;
    },
    rename(id: string, label: string): void {
      const existing = repo.getById(id);
      if (existing) repo.save({ ...existing, label });
    },
    remove(id: string): void {
      repo.remove(id);
    },
  };
}
