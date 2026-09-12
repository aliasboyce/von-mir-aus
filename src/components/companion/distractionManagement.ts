import { createKeyValueStore } from '../../services/storage/keyValueStore';

// DistractionItem has no stable id field (unlike CompanionLine), so the
// German text itself is used as the key — unique enough in practice
// across ~80 items, and avoids a large mechanical migration adding ids
// to every existing entry just for this.
const store = createKeyValueStore<string[]>('distraction-deactivated', []);

export function getDeactivatedDistractionTexts(): Set<string> {
  return new Set(store.get() ?? []);
}

export function setDistractionActive(text: string, active: boolean): void {
  const current = store.get() ?? [];
  const next = active ? current.filter((t) => t !== text) : [...new Set([...current, text])];
  store.set(next);
}
