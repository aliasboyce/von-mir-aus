import { createRepository, createId } from '../../services/storage/repository';
import { createKeyValueStore } from '../../services/storage/keyValueStore';

/**
 * "Meine Projekte" – selbstfürsorgliches Planen eigener Vorhaben (allein oder mit Freunden und Helfern).
 * Ein Projekt ist eine Folge von Bausteinen, die man selbst hinzufügt (nichts ist Pflicht):
 * Text (Ziele, Regeln, Notizen …), Aufgaben, Zeitplan mit Meilensteinen, Team & Rollen, Budget, Checkliste,
 * Risiken, Entscheidungen, Umfrage, Pro & Kontra, Tabelle, Verknüpfungen, Erinnerungen, Bilder.
 * Jeder Baustein hat eine eigene Notiz (wie im Tagebuch).
 */

export type ProjectStatus = 'idea' | 'running' | 'resting' | 'done';
export type BlockKind = 'text' | 'tasks' | 'timeline' | 'team' | 'budget' | 'checklist' | 'risks' | 'decisions' | 'poll' | 'proscons' | 'table' | 'links' | 'reminders' | 'images';

/** Minuten vor dem Termin; 0 = zur Zeit; undefined/null = keine Erinnerung */
export type Remind = number | null | undefined;

export interface ProjectPerson {
  id: string;
  name: string;
  /** Eintrag im Netzwerk, falls die Person von dort kommt */
  networkId?: string;
  availability?: string;
  contact?: string;
}
export interface ProjectRole {
  id: string;
  title: string;
  personIds: string[];
  does?: string;
}

interface BlockBase {
  id: string;
  title: string;
  /** eigene Notiz zum Baustein (leichte Formatierung wie im Tagebuch) */
  note?: string;
  collapsed?: boolean;
}

export interface TextBlock extends BlockBase { kind: 'text'; text: string; hint?: string }

export type TaskStatus = 'open' | 'doing' | 'done';
export interface ProjectTask {
  id: string;
  text: string;
  status: TaskStatus;
  /** ProjectPerson.id */
  who?: string;
  due?: string;
  time?: string;
  remind?: Remind;
  note?: string;
}
export interface TasksBlock extends BlockBase { kind: 'tasks'; items: ProjectTask[]; view?: 'list' | 'board' }

export interface MilestoneStep { id: string; text: string; done: boolean; date?: string; time?: string }
export interface Milestone {
  id: string;
  title: string;
  date?: string;
  time?: string;
  done: boolean;
  remind?: Remind;
  steps: MilestoneStep[];
  note?: string;
}
export interface TimelineBlock extends BlockBase { kind: 'timeline'; milestones: Milestone[] }

export interface TeamBlock extends BlockBase { kind: 'team' }

export interface BudgetItem {
  id: string;
  label: string;
  amount: number;
  type: 'cost' | 'income';
  /** ProjectPerson.id – wer zahlt (bei Einnahmen: wer gibt es) */
  who?: string;
  paid: boolean;
}
export interface BudgetBlock extends BlockBase { kind: 'budget'; limit?: number; currency: string; items: BudgetItem[] }

export interface CheckItem { id: string; text: string; done: boolean; who?: string }
export interface ChecklistBlock extends BlockBase { kind: 'checklist'; items: CheckItem[] }

export interface RiskItem { id: string; text: string; level: 1 | 2 | 3; planB?: string; solved?: boolean }
export interface RisksBlock extends BlockBase { kind: 'risks'; items: RiskItem[] }

export interface DecisionItem { id: string; text: string; date: string; note?: string }
export interface DecisionsBlock extends BlockBase { kind: 'decisions'; items: DecisionItem[] }

export interface PollOption { id: string; text: string }
export interface PollBlock extends BlockBase {
  kind: 'poll';
  question: string;
  options: PollOption[];
  /** nur für mich selbst (eine eigene Stimme) oder mit den Personen des Projekts */
  solo: boolean;
  /** voterId ('me' oder ProjectPerson.id) -> gewählte Optionen */
  votes: Record<string, string[]>;
  decided?: string;
}

export interface WeightedText { id: string; text: string; w: 1 | 2 | 3 }
export interface ProsConsBlock extends BlockBase { kind: 'proscons'; pros: WeightedText[]; cons: WeightedText[]; verdict?: string }

export interface TableBlock extends BlockBase { kind: 'table'; cols: string[]; rows: string[][] }

export interface LinksBlock extends BlockBase {
  kind: 'links';
  mindmaps: string[];
  /** Tagebuch-Kategorien (Bücher) */
  categories: string[];
  routines: string[];
  resources: string[];
  /** Netzwerk-Einträge */
  people: string[];
  places: string[];
  projects: string[];
}

export interface ReminderItem { id: string; text: string; date: string; time: string; remind?: Remind; done?: boolean }
export interface RemindersBlock extends BlockBase { kind: 'reminders'; items: ReminderItem[] }

export interface ImageItem { id: string; src: string; caption?: string }
export interface ImagesBlock extends BlockBase { kind: 'images'; items: ImageItem[] }

export type ProjectBlock =
  | TextBlock | TasksBlock | TimelineBlock | TeamBlock | BudgetBlock | ChecklistBlock | RisksBlock | DecisionsBlock
  | PollBlock | ProsConsBlock | TableBlock | LinksBlock | RemindersBlock | ImagesBlock;

/** Ein „nächster Schritt“ – klein, mit Zeitstempel; kann (mit Uhrzeit) in den Kalender übernommen werden. */
export interface ProjectStep {
  id: string;
  text: string;
  createdAt: string;
  done: boolean;
  doneAt?: string;
  date?: string;
  time?: string;
  remind?: Remind;
}

/** Protokoll: Einträge mit Datum und Uhrzeit, teils automatisch, teils von Hand. */
export type LogKind = 'created' | 'step' | 'task' | 'insight' | 'note' | 'milestone' | 'status' | 'done' | 'box' | 'decision';
export interface LogEntry {
  id: string;
  /** ISO-Zeitpunkt */
  at: string;
  kind: LogKind;
  text: string;
  /** Baustein, auf den sich der Eintrag bezieht (zum Anspringen) */
  blockId?: string;
}

export interface Project {
  id: string;
  title: string;
  /** Kurzbeschreibung: Was wollen wir machen? Warum? */
  summary: string;
  emoji: string;
  color: string;
  status: ProjectStatus;
  start?: string;
  end?: string;
  /** alt: ein einzelner Schritt als Text – wird beim Öffnen in `steps` übernommen */
  nextStep?: string;
  /** nächste Schritte (mit Zeitstempel, optional im Kalender) */
  steps?: ProjectStep[];
  /** Protokoll */
  log?: LogEntry[];
  /** wann das Projekt geschafft wurde */
  closedAt?: string;
  folder?: string;
  archived?: boolean;
  people: ProjectPerson[];
  roles: ProjectRole[];
  blocks: ProjectBlock[];
  createdAt: string;
  updatedAt: string;
}

export const projectsRepo = createRepository<Project>('projects');
export const projectFoldersStore = createKeyValueStore<string[]>('project-folders', []);

export const PROJECT_COLORS = ['#4a8f9e', '#e8a83d', '#9a7bc4', '#6fbf73', '#d9778a', '#c9522f', '#5b7fb5', '#8fae3d'];
export const PROJECT_EMOJIS = ['🌱', '🧭', '🎨', '🏠', '✈️', '🎉', '📚', '🎬', '🛠️', '🌿', '🤝', '💡'];

export const ME = 'me';

const id = (p: string) => createId(p);

export interface BlockMeta { kind: BlockKind; icon: string; de: string; en: string; subDe: string; subEn: string }
/** Reihenfolge = Reihenfolge im „Baustein hinzufügen“-Menü */
export const BLOCK_META: BlockMeta[] = [
  { kind: 'text', icon: '📝', de: 'Text / Notiz', en: 'Text / note', subDe: 'Ziele, Regeln, Treffen-Notizen, Beschreibung – frei schreiben', subEn: 'Goals, rules, meeting notes, description – write freely' },
  { kind: 'tasks', icon: '✅', de: 'Aufgaben', en: 'Tasks', subDe: 'Zum Abhaken, mit Person, Datum und Erinnerung', subEn: 'To tick off, with person, date and reminder' },
  { kind: 'timeline', icon: '🗓️', de: 'Zeitplan & Meilensteine', en: 'Timeline & milestones', subDe: 'Meilensteine mit kleinen Schritten, im Kalender sichtbar', subEn: 'Milestones with small steps, visible in the calendar' },
  { kind: 'team', icon: '🧑‍🤝‍🧑', de: 'Team & Rollen', en: 'Team & roles', subDe: 'Wer macht mit, wer übernimmt was', subEn: 'Who takes part, who does what' },
  { kind: 'budget', icon: '💰', de: 'Finanzplan', en: 'Budget', subDe: 'Kosten, Einnahmen, wer zahlt was', subEn: 'Costs, income, who pays what' },
  { kind: 'checklist', icon: '🧺', de: 'Checkliste / Material', en: 'Checklist / material', subDe: 'Was haben wir, was muss besorgt werden', subEn: 'What we have, what has to be got' },
  { kind: 'risks', icon: '⚠️', de: 'Risiken & Plan B', en: 'Risks & plan B', subDe: 'Was könnte schiefgehen – und was dann', subEn: 'What could go wrong – and then what' },
  { kind: 'decisions', icon: '🗣️', de: 'Entscheidungen & Absprachen', en: 'Decisions & agreements', subDe: 'Klar festhalten, was beschlossen wurde', subEn: 'Write down clearly what was decided' },
  { kind: 'poll', icon: '🗳️', de: 'Umfrage', en: 'Poll', subDe: 'Für Absprachen mit anderen – oder nur für dich selbst', subEn: 'For agreements with others – or just for yourself' },
  { kind: 'proscons', icon: '⚖️', de: 'Pro & Kontra', en: 'Pros & cons', subDe: 'Abwägen, mit Gewicht', subEn: 'Weigh things up, with weight' },
  { kind: 'table', icon: '📋', de: 'Tabelle', en: 'Table', subDe: 'Eigene Spalten und Zeilen', subEn: 'Your own columns and rows' },
  { kind: 'links', icon: '🔗', de: 'Verknüpfungen', en: 'Connections', subDe: 'Mindmaps, Tagebuch-Bücher, Routinen, Ressourcen, Menschen, Orte', subEn: 'Mind maps, diary books, routines, resources, people, places' },
  { kind: 'reminders', icon: '🔔', de: 'Erinnerungen', en: 'Reminders', subDe: 'Kommen in dein Postfach und in den Kalender', subEn: 'Arrive in your mailbox and in the calendar' },
  { kind: 'images', icon: '🖼️', de: 'Bilder & Anhänge', en: 'Pictures & attachments', subDe: 'Fotos, Skizzen, Screenshots', subEn: 'Photos, sketches, screenshots' },
];

export const metaOf = (kind: BlockKind) => BLOCK_META.find((m) => m.kind === kind) as BlockMeta;

/** neuer Baustein; `title` ist bereits in der App-Sprache */
export function newBlock(kind: BlockKind, title: string, extra: Partial<ProjectBlock> = {}): ProjectBlock {
  const base = { id: id('blk'), title };
  let b: ProjectBlock;
  switch (kind) {
    case 'text': b = { ...base, kind, text: '' }; break;
    case 'tasks': b = { ...base, kind, items: [] }; break;
    case 'timeline': b = { ...base, kind, milestones: [] }; break;
    case 'team': b = { ...base, kind }; break;
    case 'budget': b = { ...base, kind, currency: '€', items: [] }; break;
    case 'checklist': b = { ...base, kind, items: [] }; break;
    case 'risks': b = { ...base, kind, items: [] }; break;
    case 'decisions': b = { ...base, kind, items: [] }; break;
    case 'poll': b = { ...base, kind, question: '', options: [{ id: id('o'), text: '' }, { id: id('o'), text: '' }], solo: true, votes: {} }; break;
    case 'proscons': b = { ...base, kind, pros: [], cons: [] }; break;
    case 'table': b = { ...base, kind, cols: ['', ''], rows: [['', ''], ['', '']] }; break;
    case 'links': b = { ...base, kind, mindmaps: [], categories: [], routines: [], resources: [], people: [], places: [], projects: [] }; break;
    case 'reminders': b = { ...base, kind, items: [] }; break;
    case 'images': b = { ...base, kind, items: [] }; break;
  }
  return { ...b, ...extra } as ProjectBlock;
}

export function newProject(title: string, lang: 'de' | 'en'): Project {
  const now = new Date().toISOString();
  void lang;
  return {
    id: id('prj'),
    title,
    summary: '',
    emoji: PROJECT_EMOJIS[Math.floor(Math.random() * PROJECT_EMOJIS.length)],
    color: PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)],
    status: 'idea',
    people: [],
    roles: [],
    blocks: [],
    createdAt: now,
    updatedAt: now,
  };
}

export const newId = id;

// ------------------------------------------------------------------ small calculations

export function taskStats(p: Project): { done: number; total: number } {
  let done = 0;
  let total = 0;
  p.blocks.forEach((b) => {
    if (b.kind === 'tasks') b.items.forEach((t) => { total++; if (t.status === 'done') done++; });
    if (b.kind === 'checklist') b.items.forEach((t) => { total++; if (t.done) done++; });
  });
  return { done, total };
}

export function milestoneStats(p: Project): { done: number; total: number } {
  let done = 0;
  let total = 0;
  p.blocks.forEach((b) => {
    if (b.kind === 'timeline') b.milestones.forEach((m) => { total++; if (m.done) done++; });
  });
  return { done, total };
}

/** nächster offener Termin im Projekt (Meilenstein, Aufgabe, Erinnerung) ab heute */
export function nextDate(p: Project, today: string): { date: string; label: string } | undefined {
  const all: { date: string; label: string }[] = [];
  p.blocks.forEach((b) => {
    if (b.kind === 'timeline') b.milestones.forEach((m) => { if (m.date && !m.done) all.push({ date: m.date, label: m.title }); });
    if (b.kind === 'tasks') b.items.forEach((t) => { if (t.due && t.status !== 'done') all.push({ date: t.due, label: t.text }); });
    if (b.kind === 'reminders') b.items.forEach((r) => { if (r.date) all.push({ date: r.date, label: r.text }); });
  });
  return all.filter((x) => x.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
}

export interface BudgetSums { cost: number; income: number; paidCost: number; balance: number; perPerson: Map<string, number> }
export function budgetSums(b: BudgetBlock): BudgetSums {
  const perPerson = new Map<string, number>();
  let cost = 0;
  let income = 0;
  let paidCost = 0;
  b.items.forEach((i) => {
    const a = Number.isFinite(i.amount) ? i.amount : 0;
    if (i.type === 'cost') {
      cost += a;
      if (i.paid) paidCost += a;
      const k = i.who || '';
      perPerson.set(k, (perPerson.get(k) ?? 0) + a);
    } else income += a;
  });
  return { cost, income, paidCost, balance: income - cost, perPerson };
}

export function money(n: number, currency: string, lang: 'de' | 'en'): string {
  const s = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
  return `${s} ${currency}`.trim();
}

export function formatDate(d: string | undefined, lang: 'de' | 'en', withYear = true): string {
  if (!d) return '';
  const dt = new Date(`${d}T12:00:00`);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(lang === 'en' ? 'en-US' : 'de-DE', { day: '2-digit', month: '2-digit', ...(withYear ? { year: 'numeric' } : {}) });
}

export function personName(p: Project, who: string | undefined, meLabel: string): string {
  if (!who) return '';
  if (who === ME) return meLabel;
  return p.people.find((x) => x.id === who)?.name ?? '';
}

/** Stimmen einer Option */
export function votesFor(b: PollBlock, optionId: string): string[] {
  return Object.entries(b.votes).filter(([, v]) => v.includes(optionId)).map(([k]) => k);
}

export function weightSum(list: WeightedText[]): number {
  return list.reduce((s, x) => s + x.w, 0);
}

export const REMIND_CHOICES: { v: number; de: string; en: string }[] = [
  { v: 0, de: 'zur Zeit', en: 'at the time' },
  { v: 60, de: '1 Stunde vorher', en: '1 hour before' },
  { v: 1440, de: '1 Tag vorher', en: '1 day before' },
  { v: 4320, de: '3 Tage vorher', en: '3 days before' },
];

export function statusLabel(s: ProjectStatus, L: (de: string, en: string) => string): string {
  return s === 'idea' ? L('Idee', 'Idea') : s === 'running' ? L('Läuft', 'Running') : s === 'resting' ? L('Ruht gerade', 'Resting for now') : L('Geschafft', 'Done');
}


// ------------------------------------------------------------------ steps & log helpers

export function newStep(text: string): ProjectStep {
  return { id: id('stp'), text, createdAt: new Date().toISOString(), done: false };
}

export function logEntry(kind: LogKind, text: string, blockId?: string, at?: string): LogEntry {
  return { id: id('log'), at: at ?? new Date().toISOString(), kind, text, ...(blockId ? { blockId } : {}) };
}

export const LOG_ICON: Record<LogKind, string> = {
  created: '🌱', step: '➡️', task: '✅', insight: '💡', note: '📝', milestone: '🏁', status: '🔄', done: '🎉', box: '🗒️', decision: '🗣️',
};

/** Nimmt ein altes `nextStep`-Feld in die neue Schrittliste auf (einmalig). */
export function migrateProject(p: Project): Project {
  let out = p;
  if (p.nextStep?.trim() && !(p.steps && p.steps.length)) {
    out = { ...out, steps: [newStep(p.nextStep.trim())], nextStep: undefined };
  } else if (p.nextStep !== undefined && !p.nextStep.trim()) {
    out = { ...out, nextStep: undefined };
  }
  return out;
}

/** der aktuelle nächste Schritt (erster offener) */
export function currentStep(p: Project): ProjectStep | undefined {
  return (p.steps ?? []).find((s) => !s.done);
}

export function stepStats(p: Project): { done: number; total: number } {
  const s = p.steps ?? [];
  return { done: s.filter((x) => x.done).length, total: s.length };
}

/** Zeitstempel für Anzeige: „26.10. 14:05“ */
export function stamp(iso: string, lang: 'de' | 'en'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const day = d.toLocaleDateString(lang === 'en' ? 'en-US' : 'de-DE', { day: '2-digit', month: '2-digit' });
  const time = d.toLocaleTimeString(lang === 'en' ? 'en-US' : 'de-DE', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${time}`;
}

/**
 * Was hat sich zwischen zwei Ständen getan? Daraus entstehen automatische Protokoll-Einträge
 * (neue/erledigte Aufgaben, Schritte, Meilensteine, Entscheidungen, Statuswechsel).
 */
export function diffLog(prev: Project, next: Project, L: (de: string, en: string) => string): LogEntry[] {
  const out: LogEntry[] = [];
  const clip = (t: string) => (t.length > 80 ? `${t.slice(0, 79)}…` : t || '…');
  const prevStep = new Map((prev.steps ?? []).map((s) => [s.id, s]));
  (next.steps ?? []).forEach((s) => {
    const o = prevStep.get(s.id);
    if (!o) out.push(logEntry('step', L(`Nächster Schritt: ${clip(s.text)}`, `Next step: ${clip(s.text)}`)));
    else if (!o.done && s.done) out.push(logEntry('step', L(`Schritt geschafft: ${clip(s.text)}`, `Step done: ${clip(s.text)}`)));
    else if (o.done && !s.done) out.push(logEntry('step', L(`Schritt wieder offen: ${clip(s.text)}`, `Step open again: ${clip(s.text)}`)));
  });
  const prevBlocks = new Map(prev.blocks.map((b) => [b.id, b]));
  next.blocks.forEach((b) => {
    const o = prevBlocks.get(b.id);
    if (!o || o.kind !== b.kind) return;
    if (b.kind === 'tasks' && o.kind === 'tasks') {
      const om = new Map(o.items.map((t) => [t.id, t]));
      b.items.forEach((t) => {
        const q = om.get(t.id);
        if (!q) out.push(logEntry('task', L(`Neue Aufgabe: ${clip(t.text)}`, `New task: ${clip(t.text)}`), b.id));
        else if (q.status !== 'done' && t.status === 'done') out.push(logEntry('task', L(`Aufgabe erledigt: ${clip(t.text)}`, `Task done: ${clip(t.text)}`), b.id));
      });
    }
    if (b.kind === 'checklist' && o.kind === 'checklist') {
      const om = new Map(o.items.map((t) => [t.id, t]));
      b.items.forEach((t) => {
        const q = om.get(t.id);
        if (q && !q.done && t.done) out.push(logEntry('task', L(`Abgehakt: ${clip(t.text)}`, `Ticked off: ${clip(t.text)}`), b.id));
      });
    }
    if (b.kind === 'timeline' && o.kind === 'timeline') {
      const om = new Map(o.milestones.map((m) => [m.id, m]));
      b.milestones.forEach((m) => {
        const q = om.get(m.id);
        if (!q) { out.push(logEntry('milestone', L(`Neuer Meilenstein: ${clip(m.title)}`, `New milestone: ${clip(m.title)}`), b.id)); return; }
        if (!q.done && m.done) out.push(logEntry('milestone', L(`Meilenstein erreicht: ${clip(m.title)}`, `Milestone reached: ${clip(m.title)}`), b.id));
        const os = new Map(q.steps.map((s) => [s.id, s]));
        m.steps.forEach((s) => {
          const w = os.get(s.id);
          if (w && !w.done && s.done) out.push(logEntry('milestone', L(`Schritt geschafft: ${clip(s.text)}`, `Step done: ${clip(s.text)}`), b.id));
        });
      });
    }
    if (b.kind === 'decisions' && o.kind === 'decisions') {
      const ids = new Set(o.items.map((x) => x.id));
      b.items.filter((x) => !ids.has(x.id)).forEach((x) => out.push(logEntry('decision', L(`Entschieden: ${clip(x.text)}`, `Decided: ${clip(x.text)}`), b.id)));
    }
  });
  if (prev.status !== next.status && next.status !== 'done') {
    out.push(logEntry('status', L(`Status: ${statusLabel(next.status, L)}`, `Status: ${statusLabel(next.status, L)}`)));
  }
  return out;
}

export const LOG_MAX = 600;
