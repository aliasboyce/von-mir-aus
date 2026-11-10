import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { listsRepo, newItem, newList, saveList, type UserList } from '../lists/listsModel';

/**
 * Notfallrucksack: eine ganz normale Liste (siehe „Meine Listen“), die zusätzlich beim Sicherheitsplan hängt,
 * zum Durchgehen gedacht ist und beim „Fertig gepackt“ ins PDF übernommen und danach zurückgesetzt wird.
 */
export interface RucksackPacked { at: string; packed: string[]; notPacked: string[] }
export interface RucksackState { enabled: boolean; listId?: string; lastPacked?: RucksackPacked }
export const rucksackStore = createKeyValueStore<RucksackState>('rucksack', { enabled: false });

export const RUCKSACK_COLOR = '#d9893d';

export const RUCKSACK_SUGGESTIONS: { de: string; en: string }[] = [
  { de: 'Ausweis / Versichertenkarte', en: 'ID / insurance card' },
  { de: 'Medikamente', en: 'Medication' },
  { de: 'Handy + Ladekabel', en: 'Phone + charger' },
  { de: 'Wechselkleidung', en: 'Change of clothes' },
  { de: 'Zahnbürste / Kulturbeutel', en: 'Toothbrush / wash bag' },
  { de: 'Etwas Beruhigendes (Kuscheltier, Stein, Tuch)', en: 'Something calming (soft toy, stone, cloth)' },
  { de: 'Kopfhörer + Musik', en: 'Headphones + music' },
  { de: 'Buch oder Heft zum Schreiben', en: 'Book or notebook' },
  { de: 'Etwas zu trinken / ein kleiner Snack', en: 'Something to drink / a small snack' },
  { de: 'Dieser Sicherheitsplan (ausgedruckt)', en: 'This safety plan (printed)' },
];

export function getRucksackList(): UserList | undefined {
  const st = rucksackStore.get();
  if (!st.enabled || !st.listId) return undefined;
  return listsRepo.getById(st.listId);
}

export function createRucksack(title: string): UserList {
  const l = saveList(newList({ title, emoji: '🎒', color: RUCKSACK_COLOR, kind: 'check', role: 'rucksack', pinned: false }));
  rucksackStore.set({ ...rucksackStore.get(), enabled: true, listId: l.id });
  return l;
}

/** aus dem Sicherheitsplan nehmen – die Liste selbst bleibt unter „Meine Listen“ (dann als normale Liste) */
export function detachRucksack(): void {
  const l = getRucksackList();
  if (l) saveList({ ...l, role: undefined });
  rucksackStore.set({ ...rucksackStore.get(), enabled: false });
}

export function addRucksackItem(text: string): void {
  const l = getRucksackList();
  if (!l || !text.trim()) return;
  if (l.items.some((i) => i.text.trim().toLowerCase() === text.trim().toLowerCase())) return;
  saveList({ ...l, items: [...l.items, newItem(text)] });
}

export function rucksackCounts(l: UserList): { packed: number; skipped: number; open: number; total: number } {
  const packed = l.items.filter((i) => i.done && !i.skipped).length;
  const skipped = l.items.filter((i) => i.skipped).length;
  return { packed, skipped, open: l.items.length - packed - skipped, total: l.items.length };
}

/** „Fertig gepackt“: Stand für das PDF merken, Haken und Durchgestrichenes zurücksetzen */
export function finishPacking(): RucksackPacked | null {
  const l = getRucksackList();
  if (!l) return null;
  const snap: RucksackPacked = {
    at: new Date().toISOString(),
    packed: l.items.filter((i) => i.done && !i.skipped).map((i) => i.text),
    notPacked: l.items.filter((i) => !i.done || i.skipped).map((i) => i.text),
  };
  saveList({ ...l, items: l.items.map((i) => ({ ...i, done: false, skipped: false, sub: i.sub.map((s) => ({ ...s, done: false })) })) });
  rucksackStore.set({ ...rucksackStore.get(), lastPacked: snap });
  return snap;
}
