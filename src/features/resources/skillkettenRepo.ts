import { createRepository } from '../../services/storage/repository';
import type { Skillkette } from '../../data/types';

/**
 * "Fuer die Skillketten folgendes bauen"-Auftrag — its own repository,
 * same createRepository() pattern as resourcesRepo.ts/bridgesRepo.ts,
 * since a Skillkette is its own type (see data/types.ts for why it
 * isn't a Bridge). No demo seed data — a Skillkette is deeply
 * personal (the person's own notfall-trigger, their own stages built
 * from their own saved Skills), so there's nothing generic worth
 * pre-filling the way a default Bridge or Resource can be.
 */
export const skillkettenRepo = createRepository<Skillkette>('skillketten');
