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
    id: 'after-checkin', kind: 'after',
    de: { title: 'Check-in gemacht', text: 'Danke fürs Hinschauen. Dein Check-in landet in der Tageskurve – so siehst du mit der Zeit, wie es dir über den Tag geht, ohne etwas auswerten zu müssen. Du kannst jederzeit einen neuen machen, wenn sich etwas ändert.' },
    en: { title: 'Check-in done', text: 'Thanks for looking. Your check-in goes into the day curve – over time you see how you are across the day without having to analyse anything. You can make a new one whenever something changes.' },
    links: [{ to: '/entdecken/tageskurve', de: 'Tageskurve', en: 'Day curve' }, { to: '/zugang', de: 'Zum Zugang', en: 'To Zugang' }],
  },
  {
    id: 'after-skillkette', kind: 'after',
    de: { title: 'Kette durch', text: 'Eine Skillkette nimmt dir das Überlegen ab: Du musst nicht wissen, was als Nächstes kommt. Du kannst Ketten ändern oder eigene bauen – und jeden Schritt überspringen, wenn er gerade nicht hilft.' },
    en: { title: 'Chain done', text: 'A skill chain takes the thinking off you: you do not have to know what comes next. You can change chains or build your own – and skip any step that does not help right now.' },
    links: [{ to: '/entdecken/ressourcen/skillketten', de: 'Meine Skillketten', en: 'My skill chains' }, { to: '/wochenrueckblick', de: 'Wochenrückblick', en: 'Weekly review' }],
  },
  {
    id: 'after-bruecke', kind: 'after',
    de: { title: 'Brücke gebaut 🌉', text: 'Eine Brücke darf klein bleiben und in deinem Tempo wachsen. Sie hängt an Bedürfnissen und Werten – darum findest du sie auch im Zugang wieder. Hindernisse und Ressourcen kannst du jederzeit ergänzen.' },
    en: { title: 'Bridge built 🌉', text: 'A bridge may stay small and grow at your pace. It is tied to needs and values – so you also find it again in Zugang. You can add obstacles and resources any time.' },
    links: [{ to: '/bruecken', de: 'Meine Brücken', en: 'My bridges' }, { to: '/entdecken/glossar', de: 'Wörterbuch', en: 'Dictionary' }],
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
    id: 'tip-glossar', kind: 'tip',
    de: { title: 'Was heißt was?', text: 'Im Wörterbuch stehen alle Wörter der App – Fachwörter, Begriffe, Funktionen – mit Suche, Rubriken und einem Link, der direkt dorthin führt.' },
    en: { title: 'What means what?', text: 'The dictionary holds every word used in the app – technical terms, app terms, functions – with search, sections and a link that takes you right there.' },
    links: [{ to: '/entdecken/glossar', de: 'Zum Wörterbuch', en: 'To the dictionary' }],
  },
  {
    id: 'tip-skillketten', kind: 'tip',
    de: { title: 'Skills hintereinander', text: 'Mehrere Skills lassen sich zu einer Kette verbinden. Dann läuft eine feste Reihenfolge ab, und du musst nicht überlegen, was als Nächstes kommt – gut für Tage, an denen der Kopf voll ist.' },
    en: { title: 'Skills in a row', text: 'Several skills can be linked into a chain. A fixed order then runs and you do not have to think about what comes next – good for days when your head is full.' },
    links: [{ to: '/entdecken/ressourcen/skillketten', de: 'Zu den Skillketten', en: 'To skill chains' }],
  },
  {
    id: 'tip-mindmap', kind: 'tip',
    de: { title: 'Sortieren auf einer Fläche', text: 'Wenn viel durcheinander ist, hilft manchmal eine Mindmap: Gedanken, Karten und Bilder auf einer Fläche hin- und herschieben. Sie kann auf Dinge in der App verweisen.' },
    en: { title: 'Sorting on one canvas', text: 'When a lot is tangled, a mind map can help: move thoughts, cards and pictures around on one canvas. It can point to things in the app.' },
    links: [{ to: '/entdecken/mindmap', de: 'Zur Mindmap', en: 'To mind map' }],
  },
  {
    id: 'tip-suche', kind: 'tip',
    de: { title: 'Nicht sicher, wo etwas ist?', text: 'Oben auf der Startseite ist die Lupe. Schreib ein Wort wie „Atmen“, „Angst“ oder „Schlaf“ – die Suche zeigt, was dazu in der App steht.' },
    en: { title: 'Not sure where something is?', text: 'The magnifier is at the top of the start page. Type a word like “breathing”, “fear” or “sleep” – search shows what the app has on it.' },
    links: [{ to: '/suche', de: 'Zur Suche', en: 'To search' }],
  },
  {
    id: 'tip-startseite', kind: 'tip',
    de: { title: 'Startseite ruhiger oder voller', text: 'Die Startseite zeigt nur das Wichtigste; der Rest steckt hinter „Mehr“. Wenn dir die volle Startseite lieber ist, kannst du das in den Einstellungen unter „Design“ umstellen.' },
    en: { title: 'Start page calmer or fuller', text: 'The start page shows only the essentials; the rest sits behind “More”. If you prefer the fuller start page, you can switch that in Settings under “Design”.' },
    links: [{ to: '/einstellungen?bereich=design', de: 'Zu Design', en: 'To Design' }],
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
