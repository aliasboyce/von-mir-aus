import type { Lfn } from './ui';
import type { Project, ProjectBlock } from './projectModel';

/** Was jede Unterseite eines Projekts vom Container bekommt. */
export interface ProjectApi {
  p: Project;
  L: Lfn;
  lang: 'de' | 'en';
  update: (fn: (cur: Project) => Project) => void;
  setBlock: (b: ProjectBlock) => void;
  flush: () => void;
  /** liest das Projekt nach einer Änderung von außen (Zettel-Box, Schnellnotiz) neu aus dem Speicher */
  reload: () => void;
  /** relativ zum Projekt: '' = Startseite, 'schritte', 'b/<id>' … */
  go: (sub: string) => void;
  /** öffnet die Schnellnotiz */
  quickNote: () => void;
  today: string;
}
