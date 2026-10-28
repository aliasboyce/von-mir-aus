import { createRepository, createId } from '../../services/storage/repository';

/** „Meine Listen“: einfache Listen zum Abhaken oder Aufzählen. */
export type ListKind = 'check' | 'bullets';

export interface SubItem { id: string; text: string; done: boolean }
export interface ListItem {
  id: string;
  text: string;
  done: boolean;
  /** freie Notiz zum Punkt */
  note?: string;
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
