import { createRepository } from '../../services/storage/repository';
import type { AccessGapEntry } from '../../data/types';

export const accessGapRepo = createRepository<AccessGapEntry>('access-gap-entries');
