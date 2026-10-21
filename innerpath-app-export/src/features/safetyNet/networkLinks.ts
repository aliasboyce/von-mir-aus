import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { createRepository } from '../../services/storage/repository';

/** a reusable kind of connection – "befreundet", "am selben Platz" – with an optional colour of its own */
export interface LinkCategory {
  id: string;
  name: string;
  color: string;
}

export interface LinkMeta {
  /** free text on this one line; wins over the category name */
  label?: string;
  categoryId?: string;
  /** colour of this one line; wins over the category colour */
  color?: string;
}

export const linkCategoriesRepo = createRepository<LinkCategory>('network-link-categories');

const metaStore = createKeyValueStore<Record<string, LinkMeta>>('network-link-meta', {});

export function linkKey(a: string, b: string): string {
  return [a, b].sort().join('::');
}

export const linkMetaStore = {
  all: () => metaStore.get(),
  get(a: string, b: string): LinkMeta {
    return metaStore.get()[linkKey(a, b)] ?? {};
  },
  set(a: string, b: string, meta: LinkMeta) {
    const all = { ...metaStore.get() };
    if (!meta.label && !meta.categoryId && !meta.color) delete all[linkKey(a, b)];
    else all[linkKey(a, b)] = meta;
    metaStore.set(all);
  },
  remove(a: string, b: string) {
    const all = { ...metaStore.get() };
    delete all[linkKey(a, b)];
    metaStore.set(all);
  },
};

export const DEFAULT_LINK_COLOR = '#7f9c8d';

export function resolveLink(meta: LinkMeta, cats: LinkCategory[]): { label: string; color: string | null } {
  const cat = meta.categoryId ? cats.find((c) => c.id === meta.categoryId) : undefined;
  return { label: (meta.label ?? '').trim() || cat?.name || '', color: meta.color || cat?.color || null };
}

export const LINK_SUGGESTIONS = {
  de: ['befreundet', 'am selben Platz', 'Familie', 'arbeiten zusammen'],
  en: ['friends', 'same place', 'family', 'work together'],
};
