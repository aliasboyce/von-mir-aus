import { createRepository, createId } from '../../services/storage/repository';
import { storageAdapter } from '../../services/storage/StorageAdapter';
import { slimSpace, type Space3D, type Version3D } from './space3dModel';

/** Festgehaltene Stände der 3D-Mindmaps – eigener Speicher, damit die Karte selbst schlank bleibt. */
export const versionRepo = createRepository<Version3D>('mindmap3d-versions');
export const VERSION_MAX = 30;

export const versionsOf = (mapId: string) =>
  versionRepo.getAll().filter((v) => v.mapId === mapId).sort((a, b) => b.at.localeCompare(a.at));

export function saveVersion(mapId: string, name: string, space: Space3D, thumb?: string): { ok: boolean; dropped: boolean; version: Version3D } {
  const version: Version3D = { id: createId('v3'), mapId, at: new Date().toISOString(), name, thumb, space: slimSpace(space) };
  const all = versionRepo.getAll();
  const mine = all.filter((v) => v.mapId === mapId).sort((a, b) => a.at.localeCompare(b.at));
  let dropped = false;
  let rest = all;
  if (mine.length >= VERSION_MAX) {
    const gone = new Set(mine.slice(0, mine.length - VERSION_MAX + 1).map((v) => v.id));
    rest = all.filter((v) => !gone.has(v.id));
    dropped = true;
  }
  const next = [...rest, version];
  const ok = storageAdapter.setItem('mindmap3d-versions', next);
  return { ok, dropped, version };
}
export const deleteVersion = (id: string) => versionRepo.remove(id);
export const deleteVersionsOf = (mapId: string) => {
  const all = versionRepo.getAll();
  if (all.some((v) => v.mapId === mapId)) versionRepo.replaceAll(all.filter((v) => v.mapId !== mapId));
};
