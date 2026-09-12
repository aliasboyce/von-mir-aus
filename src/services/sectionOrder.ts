import { createKeyValueStore } from './storage/keyValueStore';

export type OrderableSection =
  | 'entdecken'
  | 'sicherheit'
  | 'grounding'
  | 'entdecken-zugang'
  | 'entdecken-verbindung'
  | 'entdecken-aufbau'
  | 'entdecken-werkzeuge'
  | 'entdecken-persoenlich'
  | 'entdecken-erforschen'
  | 'entdecken-tun'
  | 'entdecken-koerper'
  | 'entdecken-gefuehle-bed'
  | 'entdecken-gedanken'
  | 'entdecken-werte'
  | 'entdecken-rueckblicke'
  | 'entdecken-zugang-finden'
  | 'entdecken-gedanken-aus'
  | 'entdecken-bruecken-bauen'
  | 'entdecken-alltag'
  | 'entdecken-schreiben'
  | 'entdecken-unterstuetzen';

const stores: Record<OrderableSection, ReturnType<typeof createKeyValueStore<string[]>>> = {
  entdecken: createKeyValueStore<string[]>('section-order-entdecken', []),
  sicherheit: createKeyValueStore<string[]>('section-order-sicherheit', []),
  grounding: createKeyValueStore<string[]>('section-order-grounding', []),
  'entdecken-zugang': createKeyValueStore<string[]>('section-order-entdecken-zugang', []),
  'entdecken-verbindung': createKeyValueStore<string[]>('section-order-entdecken-verbindung', []),
  'entdecken-aufbau': createKeyValueStore<string[]>('section-order-entdecken-aufbau', []),
  'entdecken-werkzeuge': createKeyValueStore<string[]>('section-order-entdecken-werkzeuge', []),
  'entdecken-persoenlich': createKeyValueStore<string[]>('section-order-entdecken-persoenlich', []),
  'entdecken-erforschen': createKeyValueStore<string[]>('section-order-entdecken-erforschen', []),
  'entdecken-tun': createKeyValueStore<string[]>('section-order-entdecken-tun', []),
  'entdecken-koerper': createKeyValueStore<string[]>('section-order-entdecken-koerper', []),
  'entdecken-gefuehle-bed': createKeyValueStore<string[]>('section-order-entdecken-gefuehle-bed', []),
  'entdecken-gedanken': createKeyValueStore<string[]>('section-order-entdecken-gedanken', []),
  'entdecken-werte': createKeyValueStore<string[]>('section-order-entdecken-werte', []),
  'entdecken-rueckblicke': createKeyValueStore<string[]>('section-order-entdecken-rueckblicke', []),
  'entdecken-zugang-finden': createKeyValueStore<string[]>('section-order-entdecken-zugang-finden', []),
  'entdecken-gedanken-aus': createKeyValueStore<string[]>('section-order-entdecken-gedanken-aus', []),
  'entdecken-bruecken-bauen': createKeyValueStore<string[]>('section-order-entdecken-bruecken-bauen', []),
  'entdecken-alltag': createKeyValueStore<string[]>('section-order-entdecken-alltag', []),
  'entdecken-schreiben': createKeyValueStore<string[]>('section-order-entdecken-schreiben', []),
  'entdecken-unterstuetzen': createKeyValueStore<string[]>('section-order-entdecken-unterstuetzen', []),
};

/** Returns `defaultKeys` reordered according to any saved custom order -
 * any key the person hasn't seen before (a newly added feature) simply
 * appends at the end in its default position, so the standard order is
 * always the fallback until the person actually changes something. */
export function getOrderedKeys(section: OrderableSection, defaultKeys: string[]): string[] {
  const saved = stores[section].get();
  if (!saved || saved.length === 0) return defaultKeys;
  const known = saved.filter((k) => defaultKeys.includes(k));
  const missing = defaultKeys.filter((k) => !known.includes(k));
  return [...known, ...missing];
}

export function setOrderedKeys(section: OrderableSection, keys: string[]): void {
  stores[section].set(keys);
}
