import { createKeyValueStore } from '../../services/storage/keyValueStore';

const seenStageStore = createKeyValueStore<Record<string, number>>('garden-seen-stages', {});

/**
 * Compares each entry's current stage against what was last recorded,
 * returns the ids that grew since the garden was last opened, and
 * updates the stored stages to match. Called once per GardenPage mount
 * — never mid-session — so re-renders from unrelated state changes
 * don't keep re-triggering the same growth animation.
 */
export function detectAndRecordGrowth(entries: { id: string; stage: number }[]): Set<string> {
  const stored = seenStageStore.get() ?? {};
  const grew = new Set<string>();
  const next: Record<string, number> = { ...stored };

  entries.forEach(({ id, stage }) => {
    const lastSeen = stored[id];
    if (lastSeen !== undefined && stage > lastSeen) {
      grew.add(id);
    }
    next[id] = stage;
  });

  seenStageStore.set(next);
  return grew;
}
