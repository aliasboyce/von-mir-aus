import { createKeyValueStore } from './storage/keyValueStore';

/**
 * Gentle hint cards ("Hinweis-Karten"): after a function ends, and now and
 * then on the start page, a small card says what the function is good for
 * in general and how it connects to other parts of the app.
 *  - ✕ closes it for now – it can come back later (snooze)
 *  - "Gar nicht mehr anzeigen" – this card never comes back
 *  - Settings can switch all hint cards off or bring everything back
 */
export interface HintLink { to: string; de: string; en: string }
export interface HintDef {
  id: string;
  /** 'after' = shown right after a function ends (fuller card), 'tip' = occasional, smaller card on the start page */
  kind: 'after' | 'tip';
  de: { title: string; text: string };
  en: { title: string; text: string };
  links: HintLink[];
}

export const HINTS: HintDef[] = [
  {
    id: 'after-zugang', kind: 'after',
    de: { title: 'Das war ein Durchgang 🌱', text: 'Du kannst den Zugang immer wieder nutzen – regelmäßig oder nur, wenn du magst. Im Rückblick der Zugänge siehst du später, was sich zeigt: welche Bedürfnisse oft da sind und was dir geholfen hat. Es muss nichts davon sein.' },
    en: { title: 'That was a pass 🌱', text: 'You can use Zugang again and again – regularly or only when you like. In the review of your passes you will later see what shows up: which needs are often there and what helped. None of it is a must.' },
    links: [{ to: '/zugang/rueckblick', de: 'Rückblick der Zugänge', en: 'Review of passes' }, { to: '/entdecken/tageskurve', de: 'Tageskurve ansehen', en: 'See day curve' }],
  },
  {
    id: 'after-skill', kind: 'after',
    de: { title: 'Skill gemacht', text: 'Was du hier einträgst, fließt in die Tageskurve und in den Wochenrückblick. So siehst du mit der Zeit, welche Skills bei dir wirken – ohne dass du etwas auswerten musst. Skills lassen sich auch zu Skillketten verbinden.' },
    en: { title: 'Skill done', text: 'What you enter here flows into the day curve and the weekly review. Over time you see which skills work for you – without having to analyse anything. Skills can also be linked into skill chains.' },
    links: [{ to: '/wochenrueckblick', de: 'Wochenrückblick', en: 'Weekly review' }, { to: '/entdecken/ressourcen/skillketten', de: 'Skillketten', en: 'Skill chains' }],
  },
  {
    id: 'after-routine', kind: 'after',
    de: { title: 'Routine geschafft', text: 'Kleine Routinen dürfen klein bleiben. Im Garten siehst du alle deine Routinen; dort kannst du sie auch an Tageszeiten oder Erinnerungen knüpfen.' },
    en: { title: 'Routine done', text: 'Small routines may stay small. In the garden you see all your routines; there you can also tie them to times of day or reminders.' },
    links: [{ to: '/entdecken/garten', de: 'Zum Garten', en: 'To the garden' }],
  },
  {
    id: 'tip-zugang-ressourcen', kind: 'tip',
    de: { title: 'Zugang und Ressourcen', text: 'Im Zugang findest du am Ende passende Skills, Orte und Hilfsmittel aus deiner Sammlung. Je mehr du in „Ressourcen" einträgst, desto besser passen die Vorschläge.' },
    en: { title: 'Zugang and resources', text: 'At the end of Zugang you find fitting skills, places and tools from your collection. The more you add under “Resources”, the better the suggestions fit.' },
    links: [{ to: '/entdecken/ressourcen', de: 'Zu den Ressourcen', en: 'To resources' }],
  },
  {
    id: 'tip-kanaele', kind: 'tip',
    de: { title: 'Was geht gerade?', text: 'Mit „Was geht gerade?" (Zeit, Energie, Zugangskanäle) blendest du aus, was jetzt zu viel wäre. Es wirkt in Ressourcen, Brücken und im Zugang gleichzeitig.' },
    en: { title: 'What works right now?', text: 'With “What works right now?” (time, energy, access channels) you hide what would be too much now. It works in resources, bridges and Zugang at once.' },
    links: [{ to: '/entdecken/ressourcen', de: 'Ausprobieren', en: 'Try it' }],
  },
  {
    id: 'tip-rueckblick', kind: 'tip',
    de: { title: 'Zurückschauen', text: 'Rückblick der Zugänge, Tageskurve und Wochenrückblick zeigen Muster, ohne zu bewerten. Schau rein, wenn du neugierig bist – nicht als Pflicht.' },
    en: { title: 'Looking back', text: 'The pass review, day curve and weekly review show patterns without judging. Take a look when you are curious – not as a duty.' },
    links: [{ to: '/zugang/rueckblick', de: 'Rückblick der Zugänge', en: 'Review of passes' }, { to: '/wochenrueckblick', de: 'Wochenrückblick', en: 'Weekly review' }],
  },
  {
    id: 'tip-bruecken', kind: 'tip',
    de: { title: 'Brücken', text: 'Brücken sind kleine Schritte zwischen „ich" und „die Welt". Sie hängen an deinen Bedürfnissen – darum tauchen sie auch im Zugang auf.' },
    en: { title: 'Bridges', text: 'Bridges are small steps between “me” and “the world”. They are tied to your needs – that is why they also appear in Zugang.' },
    links: [{ to: '/entdecken/bruecken', de: 'Zu den Brücken', en: 'To bridges' }],
  },
];

interface HintState {
  /** ids that never come back */
  forever: string[];
  /** id -> ISO time until which the card rests after a ✕ */
  snoozed: Record<string, string>;
  /** last time any occasional tip was shown (at most one per day) */
  lastTipAt?: string;
}
const EMPTY: HintState = { forever: [], snoozed: {} };
const store = createKeyValueStore<HintState>('hint-cards', EMPTY);
const read = (): HintState => ({ ...EMPTY, ...store.get() });

const DAY = 24 * 3600 * 1000;
export const SNOOZE_AFTER_MS = 20 * 3600 * 1000;
export const SNOOZE_TIP_MS = 4 * DAY;

export const hintById = (id: string) => HINTS.find((h) => h.id === id);

export function isHintAvailable(id: string): boolean {
  const s = read();
  if (s.forever.includes(id)) return false;
  const until = s.snoozed[id];
  return !until || new Date(until).getTime() <= Date.now();
}
export function snoozeHint(id: string, ms?: number) {
  const s = read();
  const h = hintById(id);
  const span = ms ?? (h?.kind === 'tip' ? SNOOZE_TIP_MS : SNOOZE_AFTER_MS);
  store.set({ ...s, snoozed: { ...s.snoozed, [id]: new Date(Date.now() + span).toISOString() }, lastTipAt: h?.kind === 'tip' ? new Date().toISOString() : s.lastTipAt });
}
export function hideHintForever(id: string) {
  const s = read();
  store.set({ ...s, forever: s.forever.includes(id) ? s.forever : [...s.forever, id] });
}
export function resetHints() { store.set(EMPTY); }
export function hintsHiddenCount(): number { return read().forever.length; }
/** next occasional tip to show (at most one per day), or null */
export function nextTip(): HintDef | null {
  const s = read();
  if (s.lastTipAt && Date.now() - new Date(s.lastTipAt).getTime() < DAY) return null;
  return HINTS.filter((h) => h.kind === 'tip').find((h) => isHintAvailable(h.id)) ?? null;
}
/** an occasional tip was put on screen – no further tip for a day, even if it was not closed */
export function markTipShown() {
  const s = read();
  store.set({ ...s, lastTipAt: new Date().toISOString() });
}
