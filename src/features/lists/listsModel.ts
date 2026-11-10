import { createRepository, createId } from '../../services/storage/repository';
import { createKeyValueStore } from '../../services/storage/keyValueStore';

/** „Meine Listen“: einfache Listen zum Abhaken oder Aufzählen. */
export type ListKind = 'check' | 'bullets';

export interface SubItem { id: string; text: string; done: boolean }
export interface ListItem {
  id: string;
  text: string;
  done: boolean;
  /** freie Notiz zum Punkt */
  note?: string;
  /** „Nicht dabei“ – durchgestrichen (z. B. beim Notfallrucksack) */
  skipped?: boolean;
  sub: SubItem[];
}
export interface UserList {
  id: string;
  title: string;
  emoji: string;
  color: string;
  /** Foto (liegt nur auf diesem Gerät) */
  photo?: string;
  kind: ListKind;
  /** Kategorie (eigene, frei anlegbar) */
  categoryId?: string;
  /** besondere Liste: der Notfallrucksack beim Sicherheitsplan */
  role?: 'rucksack';
  pinned?: boolean;
  archived?: boolean;
  /** Notiz zur ganzen Liste */
  note?: string;
  /** Erledigtes ausblenden */
  hideDone?: boolean;
  items: ListItem[];
  createdAt: string;
  updatedAt: string;
}

export const listsRepo = createRepository<UserList>('user-lists');
export const LISTS_CHANGED = 'innerpath:lists-changed';
export const LIST_COLORS = ['#7fb069', '#6aa8c9', '#d9778a', '#e8a83d', '#9a7bc4', '#f08a5d', '#4a8f9e', '#8a8f98'];
export const LIST_EMOJIS = ['🛒', '🎒', '💡', '📚', '🎬', '🍳', '🎁', '🧳', '🏠', '🌿', '💊', '✅', '⭐', '🧺', '🎵', '✈️', '🐾', '🧸', '🪴', '📝'];

export const nowIso = () => new Date().toISOString();
export const listId = () => createId('list');
export const itemId = () => createId('li');

export function newList(partial: Partial<UserList> & { title: string }): UserList {
  const t = nowIso();
  return { id: listId(), emoji: '📝', color: LIST_COLORS[1], kind: 'check', items: [], createdAt: t, updatedAt: t, ...partial };
}

export function saveList(l: UserList): UserList {
  const saved = { ...l, updatedAt: nowIso() };
  listsRepo.save(saved);
  window.dispatchEvent(new Event(LISTS_CHANGED));
  return saved;
}

export function removeList(l: UserList): void {
  listsRepo.remove(l.id);
  listLinksStore.set(listLinksStore.get().filter((x) => x.listId !== l.id));
  window.dispatchEvent(new Event(LISTS_CHANGED));
}

export function newItem(text: string, extra?: Partial<ListItem>): ListItem {
  return { id: itemId(), text: text.trim(), done: false, sub: [], ...extra };
}

export const progress = (l: UserList): { done: number; total: number } => ({ done: l.items.filter((i) => i.done).length, total: l.items.length });

/** Sortierung auf der Übersicht: angeheftet zuerst, dann zuletzt benutzt */
export const byPinThenNewest = (a: UserList, b: UserList) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt.localeCompare(a.updatedAt);

export type CopyResult = 'added' | 'reopened' | 'exists';

/**
 * Punkt in eine andere Liste übernehmen – er bleibt in der ersten Liste (außer beim Verschieben).
 * Steht er dort schon (gleicher Text) und ist abgehakt, wird er wieder geöffnet; ist er offen, passiert nichts doppelt.
 */
export function copyItemTo(item: ListItem, target: UserList): { list: UserList; result: CopyResult } {
  const same = target.items.find((i) => i.text.trim().toLowerCase() === item.text.trim().toLowerCase());
  if (same) {
    if (same.done) return { list: { ...target, items: target.items.map((i) => (i.id === same.id ? { ...i, done: false, sub: i.sub.map((s) => ({ ...s, done: false })) } : i)) }, result: 'reopened' };
    return { list: target, result: 'exists' };
  }
  const copy: ListItem = { id: itemId(), text: item.text, done: false, note: item.note, sub: item.sub.map((s) => ({ id: itemId(), text: s.text, done: false })) };
  return { list: { ...target, items: [...target.items, copy] }, result: 'added' };
}


// ---- Kategorien für Listen (frei anlegbar, nichts Fest-Vorgegebenes) ----
export interface ListCategory { id: string; name: string; emoji: string }
export const listCategoriesStore = createKeyValueStore<ListCategory[]>('list-categories', []);
export const CATEGORY_SUGGESTIONS: { de: string; en: string; emoji: string }[] = [
  { de: 'Einkaufen', en: 'Shopping', emoji: '🛒' },
  { de: 'Zuhause', en: 'Home', emoji: '🏠' },
  { de: 'Unterwegs', en: 'On the go', emoji: '🧳' },
  { de: 'Gesundheit', en: 'Health', emoji: '🌿' },
  { de: 'Ideen & Freizeit', en: 'Ideas & leisure', emoji: '💡' },
  { de: 'Arbeit & Termine', en: 'Work & appointments', emoji: '📅' },
];
export function addListCategory(name: string, emoji = '🗂️'): ListCategory {
  const c: ListCategory = { id: createId('lcat'), name: name.trim(), emoji };
  listCategoriesStore.set([...listCategoriesStore.get(), c]);
  window.dispatchEvent(new Event(LISTS_CHANGED));
  return c;
}
export function removeListCategory(id: string): void {
  listCategoriesStore.set(listCategoriesStore.get().filter((c) => c.id !== id));
  listsRepo.getAll().filter((l) => l.categoryId === id).forEach((l) => listsRepo.save({ ...l, categoryId: undefined }));
  window.dispatchEvent(new Event(LISTS_CHANGED));
}
export function renameListCategory(id: string, name: string, emoji?: string): void {
  listCategoriesStore.set(listCategoriesStore.get().map((c) => (c.id === id ? { ...c, name: name.trim() || c.name, emoji: emoji ?? c.emoji } : c)));
  window.dispatchEvent(new Event(LISTS_CHANGED));
}

// ---- Verknüpfungen: eine Liste kann an Brücken, Ressourcen, Routinen, Projekte, Kontakte … hängen ----
export type ListLinkKind = 'bridge' | 'resource' | 'routine' | 'project' | 'contact' | 'plan';
export interface ListLink { listId: string; kind: ListLinkKind; refId: string }
export const listLinksStore = createKeyValueStore<ListLink[]>('list-links', []);
export const linksFor = (kind: ListLinkKind, refId: string): ListLink[] => listLinksStore.get().filter((x) => x.kind === kind && x.refId === refId);
export const linksOfList = (listId: string): ListLink[] => listLinksStore.get().filter((x) => x.listId === listId);
export function attachList(listId: string, kind: ListLinkKind, refId: string): void {
  const all = listLinksStore.get();
  if (all.some((x) => x.listId === listId && x.kind === kind && x.refId === refId)) return;
  listLinksStore.set([...all, { listId, kind, refId }]);
  window.dispatchEvent(new Event(LISTS_CHANGED));
}
export function detachList(listId: string, kind: ListLinkKind, refId: string): void {
  listLinksStore.set(listLinksStore.get().filter((x) => !(x.listId === listId && x.kind === kind && x.refId === refId)));
  window.dispatchEvent(new Event(LISTS_CHANGED));
}

export const LINK_KIND_LABEL: Record<ListLinkKind, [string, string]> = {
  bridge: ['Brücke', 'Bridge'], resource: ['Ressource', 'Resource'], routine: ['Routine', 'Routine'],
  project: ['Projekt', 'Project'], contact: ['Kontakt', 'Contact'], plan: ['Sicherheitsplan', 'Safety plan'],
};
