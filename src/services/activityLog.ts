import { createRepository, createId } from '../services/storage/repository';
import type { ActivityEvent, ActivityType } from '../data/types';

export const activityRepo = createRepository<ActivityEvent>('activity-events');

export function logActivity(type: ActivityType, label: string, refId?: string): string {
  const id = createId('activity');
  activityRepo.save({
    id,
    type,
    refId,
    label,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export function setActivityHelpfulness(id: string, helpfulness: ActivityEvent['helpfulness']): void {
  const existing = activityRepo.getById(id);
  if (existing) activityRepo.save({ ...existing, helpfulness });
}

/** Most recent distinct items (by refId) of a given type — powers "Zuletzt
 * genutzt" sections. Falls back to label when refId is missing so nothing
 * crashes on older/malformed data. */
export function recentActivity(type: ActivityType, limit = 5): ActivityEvent[] {
  const all = activityRepo
    .getAll()
    .filter((e) => e.type === type)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const seen = new Set<string>();
  const result: ActivityEvent[] = [];
  for (const event of all) {
    const key = event.refId ?? event.label;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(event);
    if (result.length >= limit) break;
  }
  return result;
}

/** All events within the last N days — powers Wochenrückblick. */
export function activityInLastDays(days: number): ActivityEvent[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return activityRepo.getAll().filter((e) => new Date(e.createdAt).getTime() >= cutoff);
}
