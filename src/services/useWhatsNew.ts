import { useEffect, useState } from 'react';
import { CHANGELOG, type ChangelogEntry } from './changelog';
import { createKeyValueStore } from './storage/keyValueStore';
import { useSettings } from '../state/SettingsContext';

const lastSeenStore = createKeyValueStore<string>('changelog-last-seen', '');

/**
 * "Was ist neu-Hinweis beim Update"-Auftrag — shows the newest
 * changelog entry once to a RETURNING person after they update, never
 * to someone opening the app for the very first time (they have
 * nothing to compare "new" against — everything is new to them, and
 * the intro flow already covers that). Uses `introSeen` as the
 * dividing line: if the intro hasn't been seen yet, this is a brand
 * new install, so the current latest entry is marked seen immediately
 * without ever displaying it.
 */
export function useWhatsNew(): { entry: ChangelogEntry | null; dismiss: () => void } {
  const { settings } = useSettings();
  const [entry, setEntry] = useState<ChangelogEntry | null>(null);

  useEffect(() => {
    const latest = CHANGELOG[0];
    if (!latest) return;
    const lastSeen = lastSeenStore.get();
    if (!settings.introSeen) {
      // Brand new install — nothing to announce as "new" yet.
      lastSeenStore.set(latest.id);
      return;
    }
    if (lastSeen !== latest.id) {
      setEntry(latest);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    if (entry) lastSeenStore.set(entry.id);
    setEntry(null);
  }

  return { entry, dismiss };
}
