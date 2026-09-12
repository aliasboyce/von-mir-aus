import { createKeyValueStore } from './storage/keyValueStore';

const bridgeStore = createKeyValueStore<string[]>('adopted-bridge-impulses', []);
const resourceStore = createKeyValueStore<string[]>('adopted-resource-impulses', []);

export function getAdoptedBridgeImpulses(): string[] {
  return bridgeStore.get() ?? [];
}

export function markBridgeImpulseAdopted(impulseId: string): void {
  const current = getAdoptedBridgeImpulses();
  if (!current.includes(impulseId)) bridgeStore.set([...current, impulseId]);
}

export function getAdoptedResourceImpulses(): string[] {
  return resourceStore.get() ?? [];
}

export function markResourceImpulseAdopted(impulseId: string): void {
  const current = getAdoptedResourceImpulses();
  if (!current.includes(impulseId)) resourceStore.set([...current, impulseId]);
}
