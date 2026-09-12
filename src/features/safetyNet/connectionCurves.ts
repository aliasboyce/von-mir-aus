import { createKeyValueStore } from '../../services/storage/keyValueStore';

export interface CurveOffset {
  /** perpendicular offset from the straight midpoint, in the same 0–1 graph units as node positions */
  amount: number;
}

const store = createKeyValueStore<Record<string, CurveOffset>>('network-connection-curves', {});

export function pairKey(idA: string, idB: string): string {
  return [idA, idB].sort().join('::');
}

export const connectionCurvesStore = {
  getAll(): Record<string, CurveOffset> {
    return store.get();
  },
  get(idA: string, idB: string): CurveOffset {
    const all = store.get();
    return all[pairKey(idA, idB)] ?? { amount: 0.05 };
  },
  set(idA: string, idB: string, offset: CurveOffset): void {
    const all = store.get();
    store.set({ ...all, [pairKey(idA, idB)]: offset });
  },
};
