import { useEffect, useState } from 'react';
import { CHANGELOG, type ChangelogEntry } from './changelog';
import { createKeyValueStore } from './storage/keyValueStore';

const lastSeenStore = createKeyValueStore<string>('changelog-last-seen', '');

/**
 * "Was ist neu-Hinweis beim Update"-Auftrag — shows the newest
 * changelog entry once to a RETURNING person after they update, never
 * to someone opening the app for the very first time (they have
 * nothing to compare "new" against — everything is new to them, and
 * the intro flow already covers that).
 *
 * "Update-Nachricht kam wieder nicht"-Auftrag — this used to gate on
 * settings.introSeen, a flag from an entirely separate system. If
 * that ever read as false for a returning person on a given load (any
 * timing hiccup on that specific read), this would silently mark the
 * entry as seen forever without ever showing it — a single bad read,
 * permanently lost. Gating on whether this store itself has ever been
 * written to (lastSeen === '') ties the "is this a brand new install"
 * question directly to this system's own persisted state instead of
 * borrowing a flag from a different one.
 */
export function useWhatsNew(): { entry: ChangelogEntry | null; dismiss: () => void } {
  const [entry, setEntry] = useState<ChangelogEntry | null>(null);

  useEffect(() => {
    const latest = CHANGELOG[0];
    if (!latest) return;
    const lastSeen = lastSeenStore.get();
    if (!lastSeen) {
      // Brand new install (this store has never been written to
      // before) — nothing to announce as "new" yet.
      lastSeenStore.set(latest.id);
      return;
    }
    if (lastSeen !== latest.id) {
      setEntry(latest);
    }
  }, []);

  function dismiss() {
    if (entry) lastSeenStore.set(entry.id);
    setEntry(null);
  }

  return { entry, dismiss };
}
