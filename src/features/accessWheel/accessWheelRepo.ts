import { createRepository, createId } from '../../services/storage/repository';
import type { AccessWheelEntry } from '../../data/types';
import { ACCESS_WHEEL_DOMAIN_ORDER } from '../../data/types';

export const accessWheelRepo = createRepository<AccessWheelEntry>('access-wheel');

function defaultLabel(domain: string): string {
  const labels: Record<string, string> = {
    wissen: 'Mein Wissen',
    faehigkeiten: 'Meine Fähigkeiten',
    ressourcen: 'Meine Ressourcen',
    menschen: 'Menschen um mich',
    orte: 'Sichere Orte',
    handlung: 'Eigenständige Handlung',
    strategien: 'Meine Strategien',
  };
  return labels[domain] ?? domain;
}

/** Seeds one entry per domain at a neutral mid-point (50) so the wheel has
 * something to show and adjust, rather than starting completely empty. */
export function seedAccessWheelIfEmpty() {
  accessWheelRepo.seedIfEmpty(
    ACCESS_WHEEL_DOMAIN_ORDER.map((domain) => ({
      id: createId('wheel'),
      domain,
      label: defaultLabel(domain),
      accessibility: 50,
      linkedResourceIds: [],
      linkedBridgeIds: [],
      linkedContactIds: [],
      updatedAt: new Date().toISOString(),
    })),
  );
}

/** Guards against wheel entries saved before the linked-items fields
 * existed — old data should never crash. */
export function normalizeWheelEntry(entry: AccessWheelEntry): AccessWheelEntry {
  return {
    ...entry,
    linkedResourceIds: entry.linkedResourceIds ?? [],
    linkedBridgeIds: entry.linkedBridgeIds ?? [],
    linkedContactIds: entry.linkedContactIds ?? [],
  };
}
