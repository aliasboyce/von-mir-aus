const NAMESPACE = 'innerpath:';

export interface StorageCategoryUsage {
  label: string;
  bytes: number;
}

export interface StorageUsage {
  totalBytes: number;
  categories: StorageCategoryUsage[];
  /** A rough browser-typical quota to compare against — localStorage
   * limits vary, but 5MB per origin is the most common default across
   * browsers, so it's a reasonable, honestly-labeled reference point
   * rather than a precise number this app can actually know. */
  approxQuotaBytes: number;
}

/** Maps a raw storage key to a short, human category label. Grouped by
 * meaning rather than showing 40+ raw technical key names — someone
 * checking this wants "how much is my diary" not "what is
 * diary-entries vs diary-custom-categories". */
function categoryLabelFor(key: string): string {
  if (key.startsWith('diary')) return 'Tagebuch & Vorlagen';
  if (key.startsWith('resource')) return 'Ressourcen';
  if (key.startsWith('bridge')) return 'Brücken';
  if (key.startsWith('zugang')) return 'Zugang';
  if (key.startsWith('access-wheel') || key.startsWith('wertekompass')) return 'Wertekompass';
  if (key.startsWith('polyvagal') || key.startsWith('weather') || key.startsWith('tension')) return 'Check-in-Verläufe';
  if (key.startsWith('garden')) return 'Garten';
  if (key.startsWith('network') || key.startsWith('safety-plan')) return 'Sicherheitsnetz';
  if (key.startsWith('medi-log') || key.startsWith('recurring-medications') || key.startsWith('saved-medications')) return 'Medi-Log';
  if (key.startsWith('glaubenssaetze')) return 'Denkmaschine';
  if (key.startsWith('sorgenfresser-worries')) return 'Loslassen';
  if (key.startsWith('letters-to-self')) return 'Briefe an mich';
  if (key.startsWith('protection-reflections')) return 'Schutzstrategien-Notizen';
  if (key.startsWith('custom-distraction') || key.startsWith('distraction') || key.startsWith('vocab')) return 'Wesen & Ablenkung';
  if (key.startsWith('custom-lichtwesen') || key.startsWith('companion') || key.startsWith('custom-theme')) return 'Wesen & Aussehen';
  if (key.startsWith('bookmarks')) return 'Lesezeichen';
  if (key.startsWith('section-order')) return 'Sortierungen';
  if (key === 'settings') return 'Einstellungen';
  return 'Sonstiges';
}

export function computeStorageUsage(): StorageUsage {
  const byCategory = new Map<string, number>();
  let totalBytes = 0;

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const fullKey = window.localStorage.key(i);
      if (!fullKey || !fullKey.startsWith(NAMESPACE)) continue;
      const key = fullKey.slice(NAMESPACE.length);
      const value = window.localStorage.getItem(fullKey) ?? '';
      const bytes = new Blob([value]).size;
      totalBytes += bytes;
      const label = categoryLabelFor(key);
      byCategory.set(label, (byCategory.get(label) ?? 0) + bytes);
    }
  } catch {
    // localStorage inaccessible (private browsing edge cases etc.) —
    // an empty, honest zero is safer than pretending this failed silently.
  }

  const categories = Array.from(byCategory.entries())
    .map(([label, bytes]) => ({ label, bytes }))
    .sort((a, b) => b.bytes - a.bytes);

  return { totalBytes, categories, approxQuotaBytes: 5 * 1024 * 1024 };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
