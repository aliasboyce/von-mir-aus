/**
 * Every key the app writes to localStorage, in one place. When a new
 * feature adds its own repository or key-value store, add its key here too
 * — otherwise "Von vorne beginnen" (full reset) would silently leave that
 * feature's data behind.
 */
export const ALL_STORAGE_KEYS: string[] = [
  'settings',
  'custom-lichtwesen',
  'custom-theme-palettes',
  'bridges',
  'bridge-custom-categories',
  'polyvagal-checkins',
  'polyvagal-daily-notes',
  'weather-checkins',
  'network-entries',
  'network-active-palette',
  'network-center-node',
  'network-custom-palettes',
  'network-connection-curves',
  'network-categories',
  'access-wheel',
  'resources',
  'resource-custom-categories',
  'medi-log-entries',
  'activity-events',
  'diary-entries',
  'diary-custom-categories',
  'safety-plan-tier-colors',
  'safety-plans',
  // Added while bringing this list back in sync with the actual code
  // (see the comment above — this had drifted out of date across
  // several earlier sessions; the dynamic namespace scan below already
  // protected against real data loss in the meantime, but keeping this
  // list accurate is still worth doing, per this file's own instruction).
  'bookmarks',
  'custom-distraction-categories',
  'custom-distraction-items',
  'diary-templates',
  'garden-entries',
  'glaubenssaetze',
  'letters-to-self',
  'recurring-medications',
  'saved-medications',
  'sorgenfresser-worries',
  'tension-entries',
  'vocab-cards',
  'vocab-collections',
  'zugang-entries',
  'zugang-draft',
  'wertekompass-priorities',
  'wertekompass-value-cards',
  'adopted-bridge-impulses',
  'adopted-resource-impulses',
  'companion-content-management',
  'companion-position',
  'companion-scale',
  'distraction-deactivated',
  'distraction-seen-per-category',
  'grounding-management',
  'section-order-entdecken',
  'section-order-entdecken-zugang',
  'section-order-entdecken-verbindung',
  'section-order-entdecken-aufbau',
  'section-order-entdecken-werkzeuge',
  'section-order-entdecken-persoenlich',
  'section-order-grounding',
  'section-order-sicherheit',
];

const NAMESPACE = 'innerpath';

/**
 * Wipes every piece of user data this app has ever written, returning the
 * app to a genuine first-launch state. Deliberately reads the actual
 * namespaced localStorage keys (not just the list above) as a safety net,
 * so it still fully resets even if a key was ever missed in the list.
 */
export function resetAllAppData(): void {
  const toRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(`${NAMESPACE}:`)) toRemove.push(key);
  }
  toRemove.forEach((key) => window.localStorage.removeItem(key));
  // Also remove by the known-key list directly, in case the namespacing
  // convention ever changes — belt and suspenders for a destructive action.
  ALL_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(`${NAMESPACE}:${key}`));
}
