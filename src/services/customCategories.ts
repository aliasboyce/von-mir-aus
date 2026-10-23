import { createRepository, createId } from '../services/storage/repository';

export interface SimpleCustomCategory {
  id: string;
  label: string;
  /** "Ressourcen in Unterkategorien aufteilen"-Auftrag — optional, only
   * ever set by the Resources feature. Bridges, Bookmarks and Diary
   * (the other three callers of createCustomCategoryStore) never set
   * or read this field, so they're completely unaffected by its
   * existence. Value is a ResourceCategoryGroup id, kept as a plain
   * string here since this store is generic across domains. */
  group?: string;
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
    add(label: string, group?: string): SimpleCustomCategory {
      const category: SimpleCustomCategory = { id: createId('cat'), label, group };
      repo.save(category);
      return category;
    },
    rename(id: string, label: string): void {
      const existing = repo.getById(id);
      if (existing) repo.save({ ...existing, label });
    },
    setGroup(id: string, group: string | undefined): void {
      const existing = repo.getById(id);
      if (existing) repo.save({ ...existing, group });
    },
    remove(id: string): void {
      repo.remove(id);
    },
  };
}
