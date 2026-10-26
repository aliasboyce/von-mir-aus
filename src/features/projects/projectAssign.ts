import { dayKey } from '../calendar/calendarRepo';
import { logEntry, newBlock, newId, newStep, type DecisionItem, type Project, type ProjectBlock } from './projectModel';
import { commitProject } from './projectStore';

/** Wohin ein Zettel / eine Idee im Projekt kann */
export type AssignTarget = 'step' | 'task' | 'insight' | 'note' | 'milestone' | 'decision';

export const ASSIGN_TARGETS: { id: AssignTarget; icon: string; de: string; en: string }[] = [
  { id: 'step', icon: '➡️', de: 'Nächster Schritt', en: 'Next step' },
  { id: 'task', icon: '✅', de: 'Aufgabe', en: 'Task' },
  { id: 'milestone', icon: '🏁', de: 'Meilenstein', en: 'Milestone' },
  { id: 'insight', icon: '💡', de: 'Erkenntnis', en: 'Insight' },
  { id: 'note', icon: '📝', de: 'Notiz', en: 'Note' },
  { id: 'decision', icon: '🗣️', de: 'Entscheidung', en: 'Decision' },
];

function firstOrNew<K extends ProjectBlock['kind']>(p: Project, kind: K, title: string): { blocks: ProjectBlock[]; block: Extract<ProjectBlock, { kind: K }>; created: boolean } {
  const found = p.blocks.find((b) => b.kind === kind) as Extract<ProjectBlock, { kind: K }> | undefined;
  if (found) return { blocks: p.blocks, block: found, created: false };
  const nb = newBlock(kind, title) as Extract<ProjectBlock, { kind: K }>;
  return { blocks: [...p.blocks, nb], block: nb, created: true };
}

/** Pure: gibt das geänderte Projekt zurück (noch nicht gespeichert). Protokoll-Einträge macht commitProject. */
export function applyAssign(p: Project, text: string, target: AssignTarget, lang: 'de' | 'en'): Project {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const t = text.trim();
  if (!t) return p;
  switch (target) {
    case 'step':
      return { ...p, steps: [...(p.steps ?? []), newStep(t)] };
    case 'task': {
      const r = firstOrNew(p, 'tasks', L('Aufgaben', 'Tasks'));
      const next = { ...r.block, items: [...r.block.items, { id: newId('tsk'), text: t, status: 'open' as const }] };
      return { ...p, blocks: r.blocks.map((b) => (b.id === next.id ? next : b)) };
    }
    case 'milestone': {
      const r = firstOrNew(p, 'timeline', L('Zeitplan & Meilensteine', 'Timeline & milestones'));
      const next = { ...r.block, milestones: [...r.block.milestones, { id: newId('ms'), title: t, done: false, steps: [] }] };
      return { ...p, blocks: r.blocks.map((b) => (b.id === next.id ? next : b)) };
    }
    case 'note': {
      const r = firstOrNew(p, 'text', L('Notizen', 'Notes'));
      const stamp = new Date().toLocaleString(lang === 'en' ? 'en-US' : 'de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      const add = `${r.block.text.trim() ? '\n' : ''}${stamp}: ${t}`;
      const next = { ...r.block, text: `${r.block.text}${add}` };
      return { ...p, blocks: r.blocks.map((b) => (b.id === next.id ? next : b)) };
    }
    case 'decision': {
      const r = firstOrNew(p, 'decisions', L('Entscheidungen & Absprachen', 'Decisions & agreements'));
      const item: DecisionItem = { id: newId('dec'), text: t, date: dayKey(new Date()) };
      const next = { ...r.block, items: [...r.block.items, item] };
      return { ...p, blocks: r.blocks.map((b) => (b.id === next.id ? next : b)) };
    }
    case 'insight':
      return { ...p, log: [...(p.log ?? []), logEntry('insight', t)] };
  }
}

/** Zettel einem Platz im Projekt zuordnen und sofort speichern (mit Protokoll, Kalender, Tagesspur). */
export function assignToProject(p: Project, text: string, target: AssignTarget, lang: 'de' | 'en'): Project {
  const next = applyAssign(p, text, target, lang);
  return commitProject(p, next, lang);
}

/** Zettel einfach ins Protokoll der Projekt-Box legen (Eintrag „Zettel in der Box“) */
export function logBoxSlip(p: Project, text: string, lang: 'de' | 'en'): Project {
  const short = text.length > 80 ? `${text.slice(0, 79)}…` : text;
  return commitProject(p, p, lang, [logEntry('box', lang === 'en' ? `Slip in the box: ${short}` : `Zettel in der Box: ${short}`)]);
}
