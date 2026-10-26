import { parkNotesRepo } from '../parkbox/parkboxRepo';
import { budgetSums, currentStep, formatDate, money, metaOf, milestoneStats, stepStats, taskStats, type BlockKind, type Project, type ProjectBlock } from './projectModel';
import type { Lfn } from './ui';

export const KIND_COLOR: Record<string, string> = {
  steps: '#e8a83d', tasks: '#5fae6b', timeline: '#3f8fa0', team: '#9a7bc4', budget: '#d6a23a', checklist: '#4f9d85',
  risks: '#d0603a', decisions: '#5b7fb5', poll: '#8fae3d', proscons: '#b274b0', table: '#7a8794', links: '#3f8fa0',
  reminders: '#e8a83d', images: '#d9778a', text: '#7a8794', log: '#6b7fb5', box: '#c98f5a', all: '#4a8f9e',
};

export interface Tile {
  key: string;
  /** relativer Pfad im Projekt ('' nur für Start) */
  to: string;
  icon: string;
  label: string;
  badge?: string;
  color: string;
  /** 0..1 – Ring um die Kachel */
  progress?: number;
  /** leuchtet: hier wartet etwas */
  glow?: boolean;
  /** Baustein existiert noch nicht – wird beim Antippen angelegt */
  create?: BlockKind;
  /** Spezial: öffnet die Auswahl „Baustein hinzufügen“ */
  more?: boolean;
  /** gehört in den Kreis (das Wichtigste); der Rest steht als kleine Chips darunter */
  core?: boolean;
}

const CORE: { kind: BlockKind; key: string }[] = [{ kind: 'tasks', key: 'tasks' }, { kind: 'timeline', key: 'timeline' }, { kind: 'team', key: 'team' }];

export function boxCount(projectId: string): number {
  return parkNotesRepo.getAll().filter((n) => n.projectId === projectId && !n.archived).length;
}

function blockBadge(b: ProjectBlock, p: Project, L: Lfn, lang: 'de' | 'en', today: string): { badge?: string; progress?: number; glow?: boolean } {
  switch (b.kind) {
    case 'tasks': {
      const total = b.items.length;
      const done = b.items.filter((t) => t.status === 'done').length;
      const dueNow = b.items.some((t) => t.status !== 'done' && t.due && t.due <= today);
      return { badge: total ? `${done}/${total}` : undefined, progress: total ? done / total : undefined, glow: dueNow };
    }
    case 'checklist': {
      const total = b.items.length;
      const done = b.items.filter((t) => t.done).length;
      return { badge: total ? `${done}/${total}` : undefined, progress: total ? done / total : undefined };
    }
    case 'timeline': {
      const total = b.milestones.length;
      const done = b.milestones.filter((m) => m.done).length;
      const nextM = b.milestones.filter((m) => m.date && !m.done).sort((a, c) => (a.date as string).localeCompare(c.date as string))[0];
      return { badge: nextM ? formatDate(nextM.date, lang, false) : total ? `${done}/${total}` : undefined, progress: total ? done / total : undefined, glow: !!nextM && (nextM.date as string) <= today };
    }
    case 'team': return { badge: p.people.length ? `${p.people.length} 👤` : undefined };
    case 'budget': { const s = budgetSums(b); return { badge: b.items.length ? money(s.balance, b.currency, lang) : undefined }; }
    case 'risks': { const open = b.items.filter((r) => !r.solved).length; return { badge: open ? `${open} ${L('offen', 'open')}` : undefined }; }
    case 'decisions': return { badge: b.items.length ? String(b.items.length) : undefined };
    case 'poll': return { badge: b.decided ? '✓' : undefined };
    case 'proscons': return { badge: b.pros.length + b.cons.length ? `${b.pros.length}+ / ${b.cons.length}−` : undefined };
    case 'table': return { badge: b.rows.length ? `${b.rows.length}×${b.cols.length}` : undefined };
    case 'links': { const n = b.mindmaps.length + b.categories.length + b.routines.length + b.resources.length + b.people.length + b.places.length + b.projects.length; return { badge: n ? String(n) : undefined }; }
    case 'reminders': { const next = b.items.filter((r) => !r.done && r.date).sort((a, c) => a.date.localeCompare(c.date))[0]; return { badge: next ? formatDate(next.date, lang, false) : undefined, glow: !!next && next.date <= today }; }
    case 'images': return { badge: b.items.length ? `${b.items.length}` : undefined };
    case 'text': return { badge: b.text.trim() ? '…' : undefined };
  }
}

/** Die Kacheln der Projekt-Startseite: erst das Wichtigste (Schritte, Aufgaben, Zeitplan, Beteiligte), dann der Rest. */
export function buildTiles(p: Project, L: Lfn, lang: 'de' | 'en', today: string): Tile[] {
  const tiles: Tile[] = [];
  const cs = currentStep(p);
  const ss = stepStats(p);
  const stepDue = (p.steps ?? []).some((s) => !s.done && s.date && s.date <= today);
  tiles.push({
    key: 'steps', core: true, to: 'schritte', icon: '➡️', label: L('Nächste Schritte', 'Next steps'), color: KIND_COLOR.steps,
    badge: cs ? (cs.text.length > 16 ? `${cs.text.slice(0, 15)}…` : cs.text) : ss.total ? '🎉' : undefined,
    progress: ss.total ? ss.done / ss.total : undefined, glow: stepDue,
  });
  const used = new Set<string>();
  CORE.forEach(({ kind, key }) => {
    const b = p.blocks.find((x) => x.kind === kind);
    const m = metaOf(kind);
    if (b) {
      used.add(b.id);
      const info = blockBadge(b, p, L, lang, today);
      tiles.push({ key: `b-${b.id}`, core: true, to: `b/${b.id}`, icon: m.icon, label: kind === 'team' ? L('Beteiligte', 'People involved') : b.title || L(m.de, m.en), color: KIND_COLOR[key], ...info });
    } else {
      tiles.push({ key: `new-${kind}`, core: true, to: '', icon: m.icon, label: kind === 'team' ? L('Beteiligte', 'People involved') : L(m.de, m.en), color: KIND_COLOR[key], create: kind });
    }
  });
  p.blocks.forEach((b) => {
    if (used.has(b.id)) return;
    const m = metaOf(b.kind);
    tiles.push({ key: `b-${b.id}`, to: `b/${b.id}`, icon: m.icon, label: b.title || L(m.de, m.en), color: KIND_COLOR[b.kind] ?? '#4a8f9e', ...blockBadge(b, p, L, lang, today) });
  });
  const logN = (p.log ?? []).length;
  tiles.push({ key: 'log', core: true, to: 'protokoll', icon: '📖', label: L('Protokoll', 'Log'), color: KIND_COLOR.log, badge: logN ? String(logN) : undefined });
  const bn = boxCount(p.id);
  tiles.push({ key: 'box', core: true, to: 'zettel', icon: '🗒️', label: L('Zettel-Box', 'Slip box'), color: KIND_COLOR.box, badge: bn ? String(bn) : undefined, glow: bn > 0 });
  tiles.push({ key: 'all', core: true, to: 'alles', icon: '📄', label: L('Alles zeigen', 'Show all'), color: KIND_COLOR.all });
  tiles.push({ key: 'more', to: '', icon: '＋', label: L('Mehr', 'More'), color: '#8a8f98', more: true });
  return tiles;
}

export function overallProgress(p: Project): number | undefined {
  const ts = taskStats(p);
  const ms = milestoneStats(p);
  const ss = stepStats(p);
  const done = ts.done + ms.done + ss.done;
  const total = ts.total + ms.total + ss.total;
  return total ? done / total : undefined;
}
