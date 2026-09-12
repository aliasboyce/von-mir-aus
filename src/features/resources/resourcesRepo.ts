import { createRepository } from '../../services/storage/repository';
import type { Resource } from '../../data/types';
import { DEMO_RESOURCES } from '../../data/seed/resources.seed';

export const resourcesRepo = createRepository<Resource>('resources');

export function seedResourcesIfEmpty() {
  resourcesRepo.seedIfEmpty(DEMO_RESOURCES);
}
