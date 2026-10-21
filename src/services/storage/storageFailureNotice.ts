/**
 * Addresses a real silent-data-loss gap: repository.save() (the method
 * used by the vast majority of call sites — diary entries, garden
 * entries, letters, custom Glaubenssätze notes, resources, bridges...)
 * discards the boolean success/failure that StorageAdapter.setItem
 * already computes. If localStorage ever hits its quota (a genuine
 * possibility after years of heavy use), a save currently fails
 * completely silently — the person sees no error and has no way to
 * know their entry wasn't actually kept.
 *
 * Rather than touching every save() call site across the app (a much
 * larger, riskier change), this is a minimal listener StorageAdapter
 * can notify on failure; a single small UI piece (see StorageErrorBanner
 * in AppShell.tsx) subscribes once and shows a calm, honest message.
 */
type Listener = () => void;
const listeners = new Set<Listener>();

export function notifyStorageWriteFailed(): void {
  listeners.forEach((l) => l());
}

export function onStorageWriteFailed(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
