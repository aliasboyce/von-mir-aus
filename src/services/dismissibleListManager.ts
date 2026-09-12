import { createKeyValueStore } from './storage/keyValueStore';

export interface CustomListItem {
  id: string;
  text: string;
  createdAt: string;
}

interface DismissibleListState {
  dismissed: string[];
  custom: CustomListItem[];
}

const EMPTY: DismissibleListState = { dismissed: [], custom: [] };

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Points 5 + 6 of the "Weiterentwicklung" brief — both Schutzstrategien
 * and Hindernisse need the same three things: mark a built-in example
 * as "trifft auf mich nicht zu" (hidden from then on, not deleted from
 * the reference list itself), add fully custom entries, and edit/delete
 * those custom entries. One shared store keyed by list name instead of
 * building this twice.
 */
export function createDismissibleListManager(listKey: string) {
  const store = createKeyValueStore<DismissibleListState>(`dismissible-list-${listKey}`, EMPTY);

  function read(): DismissibleListState {
    return store.get() ?? EMPTY;
  }

  return {
    visibleBuiltins(allBuiltins: string[]): string[] {
      const { dismissed } = read();
      return allBuiltins.filter((b) => !dismissed.includes(b));
    },
    isDismissed(item: string): boolean {
      return read().dismissed.includes(item);
    },
    dismiss(item: string): void {
      const state = read();
      if (state.dismissed.includes(item)) return;
      store.set({ ...state, dismissed: [...state.dismissed, item] });
    },
    restore(item: string): void {
      const state = read();
      store.set({ ...state, dismissed: state.dismissed.filter((d) => d !== item) });
    },
    dismissedItems(): string[] {
      return read().dismissed;
    },
    customItems(): CustomListItem[] {
      return read().custom;
    },
    addCustom(text: string): void {
      const state = read();
      store.set({ ...state, custom: [...state.custom, { id: createId('custom'), text, createdAt: new Date().toISOString() }] });
    },
    editCustom(id: string, text: string): void {
      const state = read();
      store.set({ ...state, custom: state.custom.map((c) => (c.id === id ? { ...c, text } : c)) });
    },
    deleteCustom(id: string): void {
      const state = read();
      store.set({ ...state, custom: state.custom.filter((c) => c.id !== id) });
    },
  };
}
