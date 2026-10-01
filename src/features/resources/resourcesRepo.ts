import { createRepository } from '../../services/storage/repository';
import type { Resource } from '../../data/types';
import { DEMO_RESOURCES, DBT_SKILL_RESOURCES } from '../../data/seed/resources.seed';
import { migrateAccessChannelValues } from '../zugangskanaele/accessChannels';

export const resourcesRepo = createRepository<Resource>('resources');

export function seedResourcesIfEmpty() {
  resourcesRepo.seedIfEmpty(DEMO_RESOURCES);
}

/**
 * "Die 4 klassischen Basis-Module"-Auftrag — seedResourcesIfEmpty()
 * only ever runs on a completely empty store, so it alone wouldn't
 * reach anyone who already has resources saved (which, after this
 * many sessions, is everyone). Same addMissingDemoBridges() pattern
 * from bridgesRepo.ts: adds each new DBT skill by its fixed id only
 * if not already present, safe to call on every app start, and never
 * touches anything the person customised or deleted themselves — if
 * someone deliberately removes one of these, it was theirs to remove.
 */
export function addMissingDbtSkills() {
  const existingIds = new Set(resourcesRepo.getAll().map((r) => r.id));
  DBT_SKILL_RESOURCES.filter((r) => !existingIds.has(r.id)).forEach((r) => resourcesRepo.save(r));
}

/**
 * "Zugangskanäle & Zugänglichkeit, Schritt 2"-Fund — same gap as
 * migrateBridgeAccessChannelsIfNeeded in bridgesRepo.ts: a resource
 * tagged under the old, narrower sensoryModalities field would have
 * its tags silently stop showing once the app only reads
 * accessChannels, unless this runs once to carry them over.
 */
export function migrateResourceAccessChannelsIfNeeded() {
  const all = resourcesRepo.getAll();
  all.forEach((resource) => {
    const raw = resource as unknown as { sensoryModalities?: string[] };
    if (raw.sensoryModalities && raw.sensoryModalities.length > 0 && (!resource.accessChannels || resource.accessChannels.length === 0)) {
      const { sensoryModalities: _old, ...rest } = raw as { sensoryModalities?: string[] } & Resource;
      void _old;
      resourcesRepo.save({ ...rest, accessChannels: migrateAccessChannelValues(raw.sensoryModalities) });
    }
  });
}
