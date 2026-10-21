import { createRepository } from '../../services/storage/repository';
import { createId } from '../../services/storage/repository';
import type { GardenEntry } from '../../data/types';

export const gardenRepo = createRepository<GardenEntry>('garden-entries');

/** One-time migration from the previous two-system setup (separate
 * "change-counters" and "habit-goals" stores from an earlier version)
 * into the unified garden-entries store — runs once, is a no-op after
 * that, and never touches data if there's nothing old to migrate.
 * Nothing gets deleted from the old keys, just copied forward, so this
 * is safe to run repeatedly. */
export function migrateLegacyGardenData(): void {
  const migrationFlagKey = 'garden-migration-v2-done';
  if (localStorage.getItem(migrationFlagKey)) return;

  try {
    const oldCounters = JSON.parse(localStorage.getItem('change-counters') ?? '[]') as Array<{
      id: string;
      name: string;
      startedAt: string;
      createdAt: string;
      status: 'active' | 'paused' | 'ended';
      pausedAt?: string;
      history: GardenEntry['history'];
    }>;
    const oldHabits = JSON.parse(localStorage.getItem('habit-goals') ?? '[]') as Array<{
      id: string;
      name: string;
      frequency: 'daily' | 'weekly';
      targetPerWeek?: number;
      createdAt: string;
      checkIns: string[];
    }>;

    const existing = gardenRepo.getAll();
    const existingIds = new Set(existing.map((e) => e.id));
    const plantStyles: GardenEntry['plantStyle'][] = ['bluete_rose', 'strauch', 'ranke', 'sukkulente'];

    oldCounters.forEach((c, i) => {
      if (existingIds.has(c.id)) return;
      gardenRepo.save({
        id: c.id,
        name: c.name,
        kind: 'veraenderung',
        createdAt: c.createdAt,
        status: c.status,
        plantStyle: plantStyles[i % plantStyles.length],
        startedAt: c.startedAt,
        pausedAt: c.pausedAt,
        history: c.history,
      });
    });

    oldHabits.forEach((h, i) => {
      if (existingIds.has(h.id)) return;
      gardenRepo.save({
        id: h.id,
        name: h.name,
        kind: 'aufbau',
        createdAt: h.createdAt,
        status: 'active',
        plantStyle: plantStyles[(i + 1) % plantStyles.length],
        frequency: h.frequency,
        targetPerWeek: h.targetPerWeek,
        checkIns: h.checkIns,
      });
    });
  } catch {
    // malformed old data — nothing to migrate, don't block the app over it
  } finally {
    localStorage.setItem(migrationFlagKey, 'true');
  }
}

export { createId };
