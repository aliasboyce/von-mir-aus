import { createRepository } from '../../services/storage/repository';
import type { MediLogEntry } from '../../data/types';

export const mediLogRepo = createRepository<MediLogEntry>('medi-log-entries');
