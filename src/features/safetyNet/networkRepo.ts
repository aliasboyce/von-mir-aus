import { createRepository } from '../../services/storage/repository';
import type { NetworkEntry } from '../../data/types';
import { DEMO_NETWORK } from '../../data/seed/network.seed';

export const networkRepo = createRepository<NetworkEntry>('network-entries');

export function seedNetworkIfEmpty() {
  networkRepo.seedIfEmpty(DEMO_NETWORK);
}
