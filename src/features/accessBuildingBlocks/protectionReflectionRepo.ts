import { createKeyValueStore } from '../../services/storage/keyValueStore';

export interface ProtectionReflection {
  strategy: string;
  protectedFrom?: string;
  costsToday?: string;
  alternative?: string;
  /** "Hilft mir heute noch" / "Kostet mich heute eher etwas" / "Mal so, mal so" */
  valence?: string;
  /** New protection strategies */
  whatFor?: string;
  whenTry?: string;
  needed?: string;
  /** Erkennen: how do I notice it kicks in */
  notice?: string;
  /** Auslöser */
  trigger?: string;
  /** replace the old routine by a new one */
  replaceRoutine?: string;
  /** own rewards */
  reward?: string;
  /** support for setbacks */
  setbackSupport?: string;
  /** avoiding temptations */
  avoid?: string;
  /** keeping going */
  keepGoing?: string;
  updatedAt: string;
}

const store = createKeyValueStore<ProtectionReflection[]>('protection-reflections', []);

/** New strategies share the store, prefixed so names never clash with old ones. */
export const NEW_PREFIX = 'neu::';

export function allProtectionReflections(): ProtectionReflection[] {
  return store.get() ?? [];
}

export function protectionReflectionFor(strategy: string): ProtectionReflection | undefined {
  return allProtectionReflections().find((r) => r.strategy === strategy);
}

export function newProtectionReflectionFor(strategy: string): ProtectionReflection | undefined {
  return protectionReflectionFor(NEW_PREFIX + strategy);
}

export function saveProtectionReflection(strategy: string, fields: Partial<Omit<ProtectionReflection, 'strategy' | 'updatedAt'>>): void {
  const rest = allProtectionReflections().filter((r) => r.strategy !== strategy);
  const existing = protectionReflectionFor(strategy);
  store.set([...rest, { strategy, ...existing, ...fields, updatedAt: new Date().toISOString() }]);
}

/** True when any text/valence has actually been written. */
export function hasContent(r: ProtectionReflection | undefined): boolean {
  return !!r && !![r.protectedFrom, r.costsToday, r.alternative, r.valence, r.whatFor, r.whenTry, r.needed, r.notice, r.trigger, r.replaceRoutine, r.reward, r.setbackSupport, r.avoid, r.keepGoing].some((v) => v && v.trim());
}

// ---- Hindernisse ----
export interface ObstacleReflection {
  obstacle: string;
  how?: string;
  when?: string;
  small?: string;
  updatedAt: string;
}
const obstacleStore = createKeyValueStore<ObstacleReflection[]>('obstacle-reflections', []);
export function obstacleReflectionFor(obstacle: string): ObstacleReflection | undefined {
  return (obstacleStore.get() ?? []).find((r) => r.obstacle === obstacle);
}
export function saveObstacleReflection(obstacle: string, fields: Partial<Omit<ObstacleReflection, 'obstacle' | 'updatedAt'>>): void {
  const all = obstacleStore.get() ?? [];
  const existing = all.find((r) => r.obstacle === obstacle);
  obstacleStore.set([...all.filter((r) => r.obstacle !== obstacle), { obstacle, ...existing, ...fields, updatedAt: new Date().toISOString() }]);
}
