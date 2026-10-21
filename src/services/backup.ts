/**
 * Full backup: every key this app has written to localStorage plus the own photos / videos / sounds
 * (IndexedDB) in ONE file that can be restored later – on this device or a new one.
 *
 * Deliberately reads/writes the RAW stored string (not via storageAdapter, which parses/stringifies JSON), so a
 * round trip is byte-for-byte the same.
 *
 * NOT part of the file (on purpose): the app lock (PIN hash, security-question data). A backup file lying
 * in a download folder must not contain anything that helps guess a PIN, and the lock belongs to the device.
 */
import { markBackupDone } from './testSupport';
import { listAllOwnMedia, putOwnMediaWithId } from './mediaStore';

const NAMESPACE = 'innerpath';
/** keys that never go into a backup and are never overwritten by a restore */
const EXCLUDED = new Set([`${NAMESPACE}:app-lock`]);
/** own media larger than this in total is left out of the file (the person is told) – keeps the file usable on a phone */
export const BACKUP_MEDIA_BUDGET = 60 * 1024 * 1024;

interface BackupMedia {
  type: string;
  dataUrl: string;
}
interface BackupFile {
  app: 'von-mir-aus';
  version?: number;
  exportedAt: string;
  data: Record<string, string>;
  media?: Record<string, BackupMedia>;
}

export interface BackupSummary {
  keyCount: number;
  mediaCount: number;
  mediaSkipped: number;
}

function collectData(): Record<string, string> {
  const data: Record<string, string> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(`${NAMESPACE}:`) || EXCLUDED.has(key)) continue;
    const value = window.localStorage.getItem(key);
    if (value !== null) data[key] = value;
  }
  return data;
}

/** Data only (no own media) as text – kept for simple uses and tests. */
export function exportAllDataAsJson(): string {
  const backup: BackupFile = { app: 'von-mir-aus', version: 2, exportedAt: new Date().toISOString(), data: collectData() };
  return JSON.stringify(backup, null, 2);
}

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(b);
  });

/** Builds the backup file including own media (as far as the size budget allows). */
export async function buildBackupBlob(): Promise<{ blob: Blob; summary: BackupSummary }> {
  const data = collectData();
  const files = await listAllOwnMedia();
  files.sort((a, b) => a.blob.size - b.blob.size); // small ones first: more of them fit
  const parts: string[] = [];
  let used = 0;
  let mediaCount = 0;
  let mediaSkipped = 0;
  for (const f of files) {
    if (used + f.blob.size > BACKUP_MEDIA_BUDGET) {
      mediaSkipped++;
      continue;
    }
    try {
      const dataUrl = await blobToDataUrl(f.blob);
      parts.push(`${JSON.stringify(f.id)}:${JSON.stringify({ type: f.blob.type, dataUrl })}`);
      used += f.blob.size;
      mediaCount++;
    } catch {
      mediaSkipped++;
    }
  }
  const head = JSON.stringify({ app: 'von-mir-aus', version: 2, exportedAt: new Date().toISOString(), data });
  // splice the media object in before the closing brace – avoids one giant JSON.stringify of everything
  const json = `${head.slice(0, -1)},"media":{${parts.join(',')}}}`;
  return { blob: new Blob([json], { type: 'application/json' }), summary: { keyCount: Object.keys(data).length, mediaCount, mediaSkipped } };
}

export async function downloadBackup(): Promise<BackupSummary> {
  const { blob, summary } = await buildBackupBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `von-mir-aus-sicherung-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  markBackupDone();
  return summary;
}

export type ImportResult =
  | { ok: true; keyCount: number; mediaCount: number; skipped: number }
  | { ok: false; error: 'invalid-file' | 'wrong-app' | 'storage-full' };

/** Validates the file structure before touching anything – a malformed or unrelated JSON file must never
 * partially overwrite real data or crash the app. */
export function parseBackupFile(raw: string): BackupFile | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.app === 'von-mir-aus' && parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data)) {
      return parsed as BackupFile;
    }
    return null;
  } catch {
    return null;
  }
}

function dataUrlToBlob(dataUrl: string, fallbackType: string): Blob {
  const comma = dataUrl.indexOf(',');
  const meta = dataUrl.slice(5, comma);
  const bin = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: meta.split(';')[0] || fallbackType });
}

const isJson = (v: string) => {
  try {
    JSON.parse(v);
    return true;
  } catch {
    return false;
  }
};

/**
 * Restores a backup: afterwards the app holds exactly the state of the file (own app lock excluded). If anything
 * fails half way (e.g. storage full), the previous state is put back – nothing is lost.
 */
export async function importBackup(raw: string): Promise<ImportResult> {
  const backup = parseBackupFile(raw);
  if (!backup) return { ok: false, error: 'invalid-file' };
  let skipped = 0;
  const entries = Object.entries(backup.data).filter(([key, value]) => {
    if (!key.startsWith(`${NAMESPACE}:`) || EXCLUDED.has(key)) return false;
    if (typeof value !== 'string' || !isJson(value)) {
      skipped++;
      return false;
    }
    return true;
  });
  if (entries.length === 0) return { ok: false, error: 'invalid-file' };

  // safety copy of what is there now
  const before = collectData();
  try {
    for (const key of Object.keys(before)) window.localStorage.removeItem(key);
    for (const [key, value] of entries) window.localStorage.setItem(key, value);
  } catch {
    // put the previous state back – key by key, so one stubborn key can never block the rest
    for (const key of Object.keys(collectData())) window.localStorage.removeItem(key);
    for (const [key, value] of Object.entries(before)) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // continue with the others
      }
    }
    return { ok: false, error: 'storage-full' };
  }

  let mediaCount = 0;
  for (const [id, m] of Object.entries(backup.media ?? {})) {
    try {
      if (!m || typeof m.dataUrl !== 'string' || !m.dataUrl.startsWith('data:')) continue;
      if (await putOwnMediaWithId(id, dataUrlToBlob(m.dataUrl, m.type))) mediaCount++;
      else skipped++;
    } catch {
      skipped++;
    }
  }
  return { ok: true, keyCount: entries.length, mediaCount, skipped };
}
