import { createKeyValueStore } from './storage/keyValueStore';
import { OVERVIEW_GROUPS } from '../features/home/appOverviewData';
import { projectsRepo, emojiOf } from '../features/projects/projectModel';
import { mindmapRepo } from '../features/mindmap/mindmapModel';
import { listsRepo } from '../features/lists/listsModel';

/** „Weiterbearbeiten“: die zuletzt geöffneten Seiten / Funktionen (auf der Startseite stehen immer nur drei). */
export interface RecentPage { path: string; key: string; at: string }
export interface RecentView { path: string; key: string; emoji: string; label: string }

const store = createKeyValueStore<RecentPage[]>('recent-pages', []);
export const RECENT_CHANGED = 'innerpath:recent-changed';
const KEEP = 14;

/** Seiten, die hier nicht auftauchen sollen: akute/sensible Bereiche, Einstellungen, Suche, die Startseite selbst */
const SKIP = ['/sicherheit', '/krisenmodus', '/nur-jetzt', '/zugang', '/einstellungen', '/suche', '/helfermodus', '/inneres-wetter', '/tag-beginnen', '/tag-abschliessen', '/system-karte', '/wochenrueckblick', '/quellen', '/brief', '/entdecken/brief-an-mich'];
const ENTRIES = OVERVIEW_GROUPS.flatMap((g) => g.entries).filter((e) => e.to);

function classify(path: string): { key: string } | null {
  const p = path.split('?')[0].split('#')[0];
  if (p === '/' || p === '/entdecken') return null;
  if (SKIP.some((s) => p === s || p.startsWith(`${s}/`))) return null;
  const prj = /^\/entdecken\/projekte\/([^/]+)/.exec(p);
  if (prj) return { key: `prj:${prj[1]}` };
  const ls = /^\/listen\/([^/]+)$/.exec(p);
  if (ls) return { key: `lst:${ls[1]}` };
  const mm = /^\/entdecken\/mindmap\/([^/]+)$/.exec(p);
  if (mm && mm[1] !== 'importieren') return { key: `mm:${mm[1]}` };
  if (p.includes('/importieren') || p.includes('/neu')) return null;
  let best: (typeof ENTRIES)[number] | null = null;
  for (const e of ENTRIES) {
    const to = e.to as string;
    if ((p === to || p.startsWith(`${to}/`)) && (!best || to.length > (best.to as string).length)) best = e;
  }
  return best ? { key: `e:${best.id}` } : null;
}

export function recordVisit(path: string): void {
  const c = classify(path);
  if (!c) return;
  const now = new Date().toISOString();
  const rest = store.get().filter((r) => r.key !== c.key);
  store.set([{ path, key: c.key, at: now }, ...rest].slice(0, KEEP));
  window.dispatchEvent(new Event(RECENT_CHANGED));
}

export function dismissRecent(key: string): void {
  store.set(store.get().filter((r) => r.key !== key));
  window.dispatchEvent(new Event(RECENT_CHANGED));
}

function describe(r: RecentPage, lang: 'de' | 'en'): RecentView | null {
  if (r.key.startsWith('prj:')) {
    const p = projectsRepo.getById(r.key.slice(4));
    if (!p) return null;
    return { path: r.path, key: r.key, emoji: emojiOf(p), label: p.title || (lang === 'en' ? 'Project' : 'Projekt') };
  }
  if (r.key.startsWith('lst:')) {
    const l = listsRepo.getById(r.key.slice(4));
    if (!l) return null;
    return { path: r.path, key: r.key, emoji: l.emoji, label: l.title };
  }
  if (r.key.startsWith('mm:')) {
    const m = mindmapRepo.getById(r.key.slice(3));
    if (!m) return null;
    return { path: r.path, key: r.key, emoji: '🕸️', label: m.title || (lang === 'en' ? 'Mind map' : 'Mindmap') };
  }
  const e = ENTRIES.find((x) => `e:${x.id}` === r.key);
  if (!e) return null;
  return { path: r.path, key: r.key, emoji: e.emoji, label: (lang === 'en' ? e.en : e.de).title };
}

/** Die letzten drei (die es noch gibt) */
export function recentViews(lang: 'de' | 'en', max = 3): RecentView[] {
  const out: RecentView[] = [];
  for (const r of store.get()) {
    const v = describe(r, lang);
    if (v) out.push(v);
    if (out.length >= max) break;
  }
  return out;
}
