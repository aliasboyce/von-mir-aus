import { createKeyValueStore } from './storage/keyValueStore';

export interface CompanionOffset {
  x: number;
  y: number;
}

const DEFAULT_OFFSET: CompanionOffset = { x: 0, y: 0 };

const store = createKeyValueStore<CompanionOffset>('companion-position', DEFAULT_OFFSET);

export function getCompanionOffset(): CompanionOffset {
  return store.get();
}

export function setCompanionOffset(offset: CompanionOffset): void {
  store.set(offset);
}
