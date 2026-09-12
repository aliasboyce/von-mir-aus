import { createKeyValueStore } from '../../services/storage/keyValueStore';

export interface ProtectionReflection {
  strategy: string;
  protectedFrom?: string;
  costsToday?: string;
  alternative?: string;
  updatedAt: string;
}

const store = createKeyValueStore<ProtectionReflection[]>('protection-reflections', []);

export function allProtectionReflections(): ProtectionReflection[] {
  return store.get() ?? [];
}

export function protectionReflectionFor(strategy: string): ProtectionReflection | undefined {
  return allProtectionReflections().find((r) => r.strategy === strategy);
}

export function saveProtectionReflection(strategy: string, fields: Partial<Omit<ProtectionReflection, 'strategy' | 'updatedAt'>>): void {
  const rest = allProtectionReflections().filter((r) => r.strategy !== strategy);
  const existing = protectionReflectionFor(strategy);
  store.set([...rest, { strategy, ...existing, ...fields, updatedAt: new Date().toISOString() }]);
}
