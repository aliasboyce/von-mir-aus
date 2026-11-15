/**
 * Favoriten – EIN gemeinsamer Merkzettel für alles in der App.
 *
 * Was schon einen eigenen Stern hatte (Ressourcen, Brücken, wichtige Kontakte, Sammelkarten) bleibt dort
 * gespeichert – die Favoritenseite liest es von dort. Alles andere (Listen, Projekte, Mindmaps, Routinen,
 * Skillketten, Medikamente, Packungen, Briefe, Lesezeichen, Parkbox-Zettel und JEDE Seite / Funktion)
 * wird hier gemerkt: nur die Art + die Nummer des Eintrags, nie der Inhalt. Titel werden beim Anzeigen
 * live aus dem Eintrag geholt – wird er umbenannt oder gelöscht, stimmt die Liste trotzdem.
 *
 * Rückgängig machen/abschalten: Stern-Komponente (FavStar) aus TopBar entfernen, FavoritesPage zurücksetzen.
 */
import { useEffect, useState } from 'react';
import { createKeyValueStore } from './storage/keyValueStore';
import { OVERVIEW_GROUPS } from '../features/home/appOverviewData';
import { listsRepo } from '../features/lists/listsModel';
import { projectsRepo, emojiOf } from '../features/projects/projectModel';
import { mindmapRepo } from '../features/mindmap/mindmapModel';
import { routinesRepo } from '../features/routines/routinesRepo';
import { skillkettenRepo } from '../features/resources/skillkettenRepo';
import { lettersRepo } from '../features/briefAnMich/lettersRepo';
import { bookmarksRepo } from '../features/bookmarks/bookmarksRepo';
import { savedMedicationsRepo } from '../features/mediLog/savedMedicationsRepo';
import { medicationPackagesRepo } from '../features/mediLog/medicationPackagesRepo';
import { parkNotesRepo } from '../features/parkbox/parkboxRepo';

export type FavKind = 'page' | 'list' | 'project' | 'mindmap' | 'routine' | 'kette' | 'letter' | 'bookmark' | 'medication' | 'package' | 'park';

export interface FavEntry { kind: FavKind; id: string; path?: string; title?: string; at: string }
export interface FavView { key: string; kind: FavKind; emoji: string; title: string; to: string; at: string }

const store = createKeyValueStore<FavEntry[]>('favorites-items', []);
export const FAVORITES_CHANGED = 'innerpath:favorites-changed';

/** Reihenfolge und Namen der Abschnitte auf der Favoritenseite (die vier Alt-Arten stehen in FavoritesPage davor) */
export const FAV_KIND_ORDER: FavKind[] = ['kette', 'list', 'project', 'mindmap', 'routine', 'medication', 'package', 'letter', 'bookmark', 'park', 'page'];
export const FAV_KIND_LABEL: Record<FavKind, { de: string; en: string; emoji: string }> = {
  kette: { de: 'Skillketten', en: 'Skill chains', emoji: '⛓️' },
  list: { de: 'Listen', en: 'Lists', emoji: '📋' },
  project: { de: 'Projekte', en: 'Projects', emoji: '🗂️' },
  mindmap: { de: 'Mindmaps', en: 'Mind maps', emoji: '🕸️' },
  routine: { de: 'Routinen', en: 'Routines', emoji: '🌱' },
  medication: { de: 'Medikamente', en: 'Medications', emoji: '💊' },
  package: { de: 'Packungen', en: 'Packages', emoji: '📦' },
  letter: { de: 'Briefe an mich', en: 'Letters to myself', emoji: '✉️' },
  bookmark: { de: 'Lesezeichen', en: 'Bookmarks', emoji: '🔖' },
  park: { de: 'Parkbox-Zettel', en: 'Parkbox notes', emoji: '📝' },
  page: { de: 'Seiten & Funktionen', en: 'Pages & functions', emoji: '🧭' },
};

const ENTRIES = OVERVIEW_GROUPS.flatMap((g) => g.entries).filter((e) => e.to);
const keyOf = (kind: FavKind, id: string) => `${kind}:${id}`;
const changed = () => window.dispatchEvent(new Event(FAVORITES_CHANGED));

export function allFavoriteEntries(): FavEntry[] {
  return store.get();
}
export function isFavorite(kind: FavKind, id: string): boolean {
  return store.get().some((f) => f.kind === kind && f.id === id);
}
export function setFavorite(kind: FavKind, id: string, on: boolean, extra?: { path?: string; title?: string }): void {
  const rest = store.get().filter((f) => !(f.kind === kind && f.id === id));
  store.set(on ? [{ kind, id, at: new Date().toISOString(), ...extra }, ...rest] : rest);
  changed();
}
export function toggleFavorite(kind: FavKind, id: string, extra?: { path?: string; title?: string }): boolean {
  const on = !isFavorite(kind, id);
  setFavorite(kind, id, on, extra);
  return on;
}
export function useIsFavorite(kind: FavKind, id: string): boolean {
  const [v, setV] = useState(() => isFavorite(kind, id));
  useEffect(() => {
    setV(isFavorite(kind, id));
    const on = () => setV(isFavorite(kind, id));
    window.addEventListener(FAVORITES_CHANGED, on);
    return () => window.removeEventListener(FAVORITES_CHANGED, on);
  }, [kind, id]);
  return v;
}
export function useFavoriteEntries(): FavEntry[] {
  const [v, setV] = useState(allFavoriteEntries);
  useEffect(() => {
    const on = () => setV(allFavoriteEntries());
    window.addEventListener(FAVORITES_CHANGED, on);
    return () => window.removeEventListener(FAVORITES_CHANGED, on);
  }, []);
  return v;
}

/** Welche Seite ist gerade „ein Ding“? Detailseiten werden dem Ding zugeordnet, alles andere ist eine Seite/Funktion. */
export function classifyPath(pathname: string): { kind: FavKind; id: string } | 'native' | 'none' {
  const p = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  if (['/', '/suche', '/favoriten', '/krisenmodus', '/lock'].includes(p)) return 'none';
  if (/\/(neu|importieren)$/.test(p) || p.endsWith('/bearbeiten')) return 'none';
  if (/^\/bruecken\/[^/]+$/.test(p)) return 'native';
  let m: RegExpExecArray | null;
  if ((m = /^\/listen\/([^/]+)$/.exec(p))) return { kind: 'list', id: m[1] };
  if ((m = /^\/entdecken\/projekte\/([^/]+)/.exec(p))) return { kind: 'project', id: m[1] };
  if ((m = /^\/entdecken\/mindmap\/([^/]+)$/.exec(p))) return { kind: 'mindmap', id: m[1] };
  if ((m = /^\/entdecken\/routinen\/([^/]+)\/start$/.exec(p))) return { kind: 'routine', id: m[1] };
  if ((m = /^\/entdecken\/ressourcen\/skillketten\/([^/]+)(\/start)?$/.exec(p))) return { kind: 'kette', id: m[1] };
  return { kind: 'page', id: p };
}

/** Eintrag → Anzeige. null = gibt es nicht mehr (wird nicht gezeigt). */
export function describeFavorite(f: FavEntry, lang: 'de' | 'en'): FavView | null {
  const key = keyOf(f.kind, f.id);
  const en = lang === 'en';
  const base = { key, kind: f.kind, at: f.at };
  switch (f.kind) {
    case 'list': {
      const x = listsRepo.getById(f.id);
      return x ? { ...base, emoji: x.emoji || '📋', title: x.title || (en ? 'List' : 'Liste'), to: `/listen/${x.id}` } : null;
    }
    case 'project': {
      const x = projectsRepo.getById(f.id);
      return x ? { ...base, emoji: emojiOf(x) || '🗂️', title: x.title || (en ? 'Project' : 'Projekt'), to: `/entdecken/projekte/${x.id}` } : null;
    }
    case 'mindmap': {
      const x = mindmapRepo.getById(f.id);
      return x ? { ...base, emoji: '🕸️', title: x.title || (en ? 'Mind map' : 'Mindmap'), to: `/entdecken/mindmap/${x.id}` } : null;
    }
    case 'routine': {
      const x = routinesRepo.getById(f.id);
      return x ? { ...base, emoji: x.emoji || '🌱', title: x.title || (en ? 'Routine' : 'Routine'), to: `/entdecken/routinen/${x.id}/start` } : null;
    }
    case 'kette': {
      const x = skillkettenRepo.getById(f.id);
      return x ? { ...base, emoji: '⛓️', title: x.title, to: `/entdecken/ressourcen/skillketten/${x.id}` } : null;
    }
    case 'letter': {
      const x = lettersRepo.getById(f.id);
      if (!x) return null;
      const d = new Date(x.createdAt).toLocaleDateString(en ? 'en-GB' : 'de-DE');
      return { ...base, emoji: '✉️', title: en ? `Letter from ${d}` : `Brief vom ${d}`, to: '/entdecken/brief-an-mich' };
    }
    case 'bookmark': {
      const x = bookmarksRepo.getById(f.id);
      return x ? { ...base, emoji: '🔖', title: x.title || x.url, to: '/entdecken/lesezeichen' } : null;
    }
    case 'medication': {
      const x = savedMedicationsRepo.getById(f.id);
      return x ? { ...base, emoji: '💊', title: x.name, to: '/entdecken/medi-log' } : null;
    }
    case 'package': {
      const x = medicationPackagesRepo.getById(f.id);
      if (!x) return null;
      const med = savedMedicationsRepo.getById(x.medicationId);
      const d = new Date(x.openedAt).toLocaleDateString(en ? 'en-GB' : 'de-DE');
      return { ...base, emoji: '📦', title: `${med?.name ?? (en ? 'Package' : 'Packung')} · ${d}`, to: '/entdecken/medi-log/packungen' };
    }
    case 'park': {
      const x = parkNotesRepo.getById(f.id);
      return x ? { ...base, emoji: '📝', title: x.text.replace(/\s+/g, ' ').slice(0, 60) || (en ? 'Note' : 'Zettel'), to: '/parkbox' } : null;
    }
    case 'page': {
      const path = f.id;
      let best: (typeof ENTRIES)[number] | null = null;
      for (const e of ENTRIES) {
        const to = e.to as string;
        if ((path === to || path.startsWith(`${to}/`)) && (!best || to.length > (best.to as string).length)) best = e;
      }
      const exact = best && best.to === path ? best : null;
      const title = f.title || (exact ? (en ? exact.en : exact.de).title : (best ? (en ? best.en : best.de).title : path));
      return { ...base, emoji: (exact ?? best)?.emoji ?? '🧭', title, to: f.path || path };
    }
  }
}
