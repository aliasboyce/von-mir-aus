import { useEffect, useState } from 'react';
import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { logActivity, activityRepo } from '../../services/activityLog';
import { diffLog, LOG_MAX, logEntry, projectsRepo, type LogEntry, type Project } from './projectModel';
import { syncProjectCalendar } from './projectCalendar';

export type HubLayout = 'circle' | 'tiles';
export const hubLayoutStore = createKeyValueStore<HubLayout>('project-hub-layout', 'circle');

/** Eine Tagesspur: „Am Projekt gearbeitet“ steht im Tagesrückblick – auch ohne weiteren Inhalt. */
export function markProjectWorkedOn(p: Project, lang: 'de' | 'en'): void {
  const day = new Date();
  const sameLocalDay = activityRepo.getAll().some((e) => {
    if (e.type !== 'project' || e.refId !== p.id) return false;
    const d = new Date(e.createdAt);
    return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
  });
  if (sameLocalDay) return;
  logActivity('project', lang === 'en' ? `Worked on project: ${p.title || '…'}` : `Am Projekt gearbeitet: ${p.title || '…'}`, p.id);
}

/**
 * Speichert ein Projekt von außen (z. B. aus der Zettel-Box): hängt automatische Protokoll-Einträge an,
 * gleicht den Kalender ab und vermerkt „heute gearbeitet“.
 */
export function commitProject(prev: Project, next: Project, lang: 'de' | 'en', extra: LogEntry[] = []): Project {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const entries = [...diffLog(prev, next, L), ...extra];
  const out: Project = { ...next, updatedAt: new Date().toISOString(), log: [...(next.log ?? []), ...entries].slice(-LOG_MAX) };
  projectsRepo.save(out);
  syncProjectCalendar(out, lang);
  markProjectWorkedOn(out, lang);
  return out;
}

export { logEntry };

/** Projekte live lesen (z. B. in der Auswahl) */
export function useProjects(): Project[] {
  const [list, setList] = useState<Project[]>(() => projectsRepo.getAll());
  useEffect(() => {
    const on = () => setList(projectsRepo.getAll());
    window.addEventListener('focus', on);
    return () => window.removeEventListener('focus', on);
  }, []);
  return list;
}
