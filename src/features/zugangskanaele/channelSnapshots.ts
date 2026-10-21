import { createRepository, createId } from '../../services/storage/repository';
import type { ChannelLevels } from '../../content/fitCriteria';
import { bandForValue } from '../polyvagal/arousalBands';
import { polyvagalRepo } from '../polyvagal/polyvagalRepo';

/**
 * "Zustandsaufnahme": how present each Zugangskanal was at one moment.
 * Deliberately a snapshot, not a score — it is saved only when the person
 * chooses to, and it can be reused as the current "Was ist gerade
 * vorhanden?" or compared with how the net looked another time.
 */
export interface ChannelSnapshot {
  id: string;
  createdAt: string;
  levels: ChannelLevels;
  /** the arousal zone the person was in around then, if they had checked in */
  zoneId?: string;
  note?: string;
}

export const channelSnapshotsRepo = createRepository<ChannelSnapshot>('channel-snapshots');

export function newSnapshot(levels: ChannelLevels, note?: string): ChannelSnapshot {
  const tension = recentTension();
  return {
    id: createId('snap'),
    createdAt: new Date().toISOString(),
    levels: { ...levels },
    zoneId: tension === null ? undefined : bandForValue(tension).id,
    note: note?.trim() ? note.trim() : undefined,
  };
}

/** Latest tension value (0–100) from a check-in in the last 3 hours, if any. */
export function recentTension(): number | null {
  const since = Date.now() - 3 * 3600 * 1000;
  const latest = polyvagalRepo
    .getAll()
    .filter((c) => c.tensionValue != null && new Date(c.createdAt).getTime() >= since)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return latest?.tensionValue ?? null;
}
