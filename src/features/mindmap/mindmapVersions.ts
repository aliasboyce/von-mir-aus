import { createRepository, createId } from '../../services/storage/repository';
import { storageAdapter } from '../../services/storage/StorageAdapter';
import type { MindMap } from './mindmapModel';

/** Festgehaltene frühere Zustände einer Mindmap – eigener Speicher, damit die Karte selbst schlank bleibt. */
export interface MapVersion {
  id: string;
  mapId: string;
  at: string;
  name: string;
  /** "auto" = automatisch festgehalten, "manual" = von dir */
  kind: 'auto' | 'manual';
  map: Pick<MindMap, 'title' | 'bg' | 'nodes' | 'edges' | 'view'>;
}

export const versionRepo = createRepository<MapVersion>('mindmap-versions');
export const VERSION_MAX = 30;

export const versionsOf = (mapId: string) =>
  versionRepo.getAll().filter((v) => v.mapId === mapId).sort((a, b) => b.at.localeCompare(a.at));

const slim = (m: MindMap): MapVersion['map'] => ({ title: m.title, bg: m.bg, nodes: m.nodes, edges: m.edges, view: m.view });

export function saveVersion(map: MindMap, name: string, kind: MapVersion['kind'] = 'manual'): { ok: boolean; dropped: boolean; version: MapVersion } {
  const version: MapVersion = { id: createId('mv'), mapId: map.id, at: new Date().toISOString(), name, kind, map: JSON.parse(JSON.stringify(slim(map))) };
  const all = versionRepo.getAll();
  const mine = all.filter((v) => v.mapId === map.id).sort((a, b) => a.at.localeCompare(b.at));
  let dropped = false;
  let rest = all;
  if (mine.length >= VERSION_MAX) {
    // zuerst die ältesten automatischen weg, von dir festgehaltene bleiben möglichst lange
    const autos = mine.filter((v) => v.kind === 'auto');
    const gone = new Set((autos.length ? autos : mine).slice(0, mine.length - VERSION_MAX + 1).map((v) => v.id));
    rest = all.filter((v) => !gone.has(v.id));
    dropped = true;
  }
  const ok = storageAdapter.setItem('mindmap-versions', [...rest, version]);
  return { ok, dropped, version };
}
export const deleteVersion = (id: string) => versionRepo.remove(id);
export const deleteVersionsOf = (mapId: string) => {
  const all = versionRepo.getAll();
  if (all.some((v) => v.mapId === mapId)) versionRepo.replaceAll(all.filter((v) => v.mapId !== mapId));
};
