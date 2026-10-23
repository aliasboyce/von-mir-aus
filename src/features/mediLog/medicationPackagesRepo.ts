import { createRepository } from '../../services/storage/repository';
import type { MedicationPackage } from '../../data/types';

export const medicationPackagesRepo = createRepository<MedicationPackage>('medication-packages');
