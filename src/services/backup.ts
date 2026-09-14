/**
 * "Echtes Daten-Backup/Export"-Auftrag — the settings page already
 * told people "an export is the simplest way" to back up before
 * switching devices or clearing the browser, but the only export that
 * existed was a per-item PDF (diary entry, resource, bridge) that
 * can't be re-imported. This is the real thing: every single key this
 * app has ever written to localStorage, in one file, that can be
 * fully restored later — on this device or a new one.
 *
 * Deliberately reads/writes the RAW stored string directly (not via
 * storageAdapter's getItem/setItem, which parse/stringify JSON) so a
 * round-trip export->import is byte-for-byte the same as what was
 * there before, with zero risk of a subtle serialization mismatch.
 */
const NAMESPACE = 'innerpath';

interface BackupFile {
  app: 'von-mir-aus';
  exportedAt: string;
  data: Record<string, string>;
}

export function exportAllDataAsJson(): string {
  const data: Record<string, string> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(`${NAMESPACE}:`)) continue;
    const value = window.localStorage.getItem(key);
    if (value !== null) data[key] = value;
  }
  const backup: BackupFile = { app: 'von-mir-aus', exportedAt: new Date().toISOString(), data };
  return JSON.stringify(backup, null, 2);
}

export function downloadBackup() {
  const json = exportAllDataAsJson();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `von-mir-aus-sicherung-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type ImportResult = { ok: true; keyCount: number } | { ok: false; error: 'invalid-file' | 'wrong-app' };

/** Validates the file structure before touching anything — a
 * malformed or unrelated JSON file must never partially overwrite
 * real data or crash the app. */
export function parseBackupFile(raw: string): BackupFile | null {
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.app === 'von-mir-aus' &&
      parsed.data &&
      typeof parsed.data === 'object'
    ) {
      return parsed as BackupFile;
    }
    return null;
  } catch {
    return null;
  }
}

export function importBackup(raw: string): ImportResult {
  const backup = parseBackupFile(raw);
  if (!backup) return { ok: false, error: 'invalid-file' };
  const entries = Object.entries(backup.data).filter(([key]) => key.startsWith(`${NAMESPACE}:`));
  if (entries.length === 0) return { ok: false, error: 'invalid-file' };
  for (const [key, value] of entries) {
    if (typeof value === 'string') window.localStorage.setItem(key, value);
  }
  return { ok: true, keyCount: entries.length };
}
