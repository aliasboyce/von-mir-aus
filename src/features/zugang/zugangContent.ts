import type { ZugangSurvivalState, PolyvagalZone } from '../../data/types';

// ---------------------------------------------------------------------
// Step 1 — Körperwahrnehmung
// ---------------------------------------------------------------------
export const BODY_SENSATIONS_DE = [
  'schwere Augen', 'benommen', 'Watte im Kopf', 'Druck', 'flache Atmung',
  'innere Unruhe', 'Herzklopfen', 'frieren', 'angespannt', 'leer',
  'Kloß im Hals', 'Enge im Brustkorb', 'Zittern', 'Kribbeln', 'taube Hände/Füße',
  'Übelkeit', 'Schwindel', 'angespannter Kiefer', 'schwere Glieder', 'zusammengezogener Magen',
  'heiß', 'kalte Hände', 'wackelige Beine', 'trockener Mund',
  // Neutral and pleasant sensations belong here just as much as
  // difficult ones — the previous list was almost entirely symptom-
  // oriented, which quietly implied "checking in with your body" means
  // "checking for what's wrong". Noticing warmth or ease is just as
  // valid an answer to "what do I notice right now?".
  'warm', 'ruhig', 'entspannt', 'leicht', 'angenehm wach', 'weich',
  'ruhig atmend', 'gelöst', 'stabil', 'angenehm schwer', 'energiegeladen', 'wach',
];

// ---------------------------------------------------------------------
// Step 2 — Überlebenszustand
// ---------------------------------------------------------------------
export interface SurvivalStateMeta {
  emoji: string;
  label: string;
  labelEn: string;
  group: 'verbunden' | 'aktiviert' | 'reduziert';
  explanationKey: string;
}

export const SURVIVAL_STATE_ORDER: ZugangSurvivalState[] = ['verbunden', 'mobilisiert', 'flucht', 'kampf', 'erstarren', 'kollaps', 'angepasst'];

/**
 * "Drei Grundzustaende oben, aber alle Fs mit dazu"-Auftrag — a
 * zone-grouped, richer list for the selection PICKERS specifically
 * (Zugang step 2, check-in), distinct from SURVIVAL_STATE_ORDER (used
 * by the wave/pattern tools, deliberately left at the original seven).
 * Each zone heading is the "Grundzustand", with every specific
 * reaction — including the extended Fine/Flood/Friend — grouped
 * underneath it, so someone sees the three basic states as the frame
 * and all eight+ specific reactions as options within that frame.
 */
/**
 * "Fine/Flood/Friend gehoeren ins Toleranzfenster"-Korrektur — nach
 * den neuen Quellen zum Stresstoleranzfenster gehoeren alle drei klar
 * in die gruene/ventrale Zone (Fine = neutraler Normalzustand, Friend
 * = soziale Co-Regulation, Flood = der UEBERGANG an der oberen Grenze
 * des Fensters) — vorher waren Friend/Flood faelschlich unter
 * "sympathetic" einsortiert. "Fake-Ruhe" neu ergaenzt in dorsal (siehe
 * ZugangSurvivalState in types.ts fuer die Begruendung).
 */
export const EXTENDED_STATE_GROUPS: { zone: PolyvagalZone; states: ZugangSurvivalState[] }[] = [
  { zone: 'ventral', states: ['verbunden', 'fine', 'friend', 'flood'] },
  { zone: 'sympathetic', states: ['mobilisiert', 'flucht', 'kampf', 'angepasst'] },
  { zone: 'dorsal', states: ['erstarren', 'kollaps', 'fakeRuhe'] },
];

export const SURVIVAL_STATE_META: Record<ZugangSurvivalState, SurvivalStateMeta> = {
  verbunden: { emoji: '🌿', label: 'Verbunden', labelEn: 'Connected', group: 'verbunden', explanationKey: 'verbunden' },
  mobilisiert: { emoji: '⚡', label: 'Mobilisiert', labelEn: 'Mobilized', group: 'aktiviert', explanationKey: 'mobilisiert' },
  flucht: { emoji: '🏃', label: 'Flucht', labelEn: 'Flight', group: 'aktiviert', explanationKey: 'flucht' },
  kampf: { emoji: '🥊', label: 'Kampf', labelEn: 'Fight', group: 'aktiviert', explanationKey: 'kampf' },
  erstarren: { emoji: '🧊', label: 'Erstarren', labelEn: 'Freeze', group: 'reduziert', explanationKey: 'erstarren' },
  kollaps: { emoji: '🪨', label: 'Kollaps', labelEn: 'Collapse', group: 'reduziert', explanationKey: 'kollaps' },
  angepasst: { emoji: '🤝', label: 'Angepasst', labelEn: 'Fawn', group: 'aktiviert', explanationKey: 'angepasst' },
  fine: { emoji: '🙂', label: 'Fine', labelEn: 'Fine', group: 'verbunden', explanationKey: 'fine' },
  flood: { emoji: '🌊', label: 'Flood', labelEn: 'Flood', group: 'verbunden', explanationKey: 'flood' },
  friend: { emoji: '🧑\u200d🤝\u200d🧑', label: 'Friend', labelEn: 'Friend', group: 'verbunden', explanationKey: 'friend' },
  fakeRuhe: { emoji: '🤖', label: 'Fake-Ruhe', labelEn: 'False calm', group: 'reduziert', explanationKey: 'fakeRuhe' },
  fokus: { emoji: '🎯', label: 'Fokus', labelEn: 'Focus', group: 'verbunden', explanationKey: 'fokus' },
  praesent: { emoji: '✨', label: 'Präsent', labelEn: 'Present', group: 'verbunden', explanationKey: 'praesent' },
  unruhe: { emoji: '〰️', label: 'Unruhe', labelEn: 'Restlessness', group: 'aktiviert', explanationKey: 'unruhe' },
  blockiert: { emoji: '🔒', label: 'Blockiert', labelEn: 'Blocked', group: 'reduziert', explanationKey: 'blockiert' },
};

// ---------------------------------------------------------------------
// Step 3 — Gefühl (GFK/NVC-style: Obergefühl → Untergefühle)
// ---------------------------------------------------------------------
export interface FeelingGroup {
  id: string;
  label: string;
  labelEn: string;
  /** "Unterschiedliche Farben"-Auftrag — each group gets its own
   * distinct color, reused consistently for the wedge, the expanded
   * sub-feeling chips, and wherever a selected feeling is shown
   * downstream (Zugang, review), so a color always means the same
   * feeling group across the whole app. */
  color: string;
  sub: string[];
  subEn: string[];
}

export const FEELING_GROUPS: FeelingGroup[] = [
  {
    id: 'angst', label: 'Angst / Stress', labelEn: 'Fear / Stress', color: '#8B7BB8',
    sub: [
      'ängstlich', 'besorgt', 'nervös', 'unsicher', 'überfordert', 'panisch',
      'skeptisch', 'misstrauisch', 'irritiert', 'durcheinander', 'verwirrt', 'ungeduldig',
      'aufgeregt', 'angespannt', 'aufgewühlt', 'unruhig', 'gehemmt', 'verunsichert',
      'überlastet', 'gestresst', 'eifersüchtig', 'entsetzt', 'schockiert',
    ],
    subEn: [
      'afraid', 'worried', 'nervous', 'unsure', 'overwhelmed', 'panicked',
      'skeptical', 'distrustful', 'irritated', 'disoriented', 'confused', 'impatient',
      'agitated', 'tense', 'stirred up', 'restless', 'inhibited', 'unsettled',
      'overloaded', 'stressed', 'jealous', 'horrified', 'shocked',
    ],
  },
  {
    id: 'traurigkeit', label: 'Trauer', labelEn: 'Sadness', color: '#5B84B1',
    sub: ['traurig', 'niedergeschlagen', 'enttäuscht', 'erschöpft', 'betrübt', 'bedrückt'],
    subEn: ['sad', 'down', 'disappointed', 'exhausted', 'grieved', 'weighed down'],
  },
  {
    id: 'wut', label: 'Ärger / Wut', labelEn: 'Anger', color: '#C1502E',
    sub: [
      'wütend', 'gereizt', 'genervt', 'empört', 'ärgerlich', 'hasserfüllt', 'zornig',
      'bestürzt', 'fassungslos', 'entrüstet', 'erschüttert', 'geladen', 'aufgebracht',
      'widerwillig', 'trotzig', 'beleidigt', 'die Nase voll haben', 'etwas satt haben',
    ],
    subEn: [
      'angry', 'irritated', 'annoyed', 'outraged', 'cross', 'full of hatred', 'furious',
      'dismayed', 'stunned', 'indignant', 'shaken', 'fuming', 'worked up',
      'reluctant', 'defiant', 'offended', 'fed up', 'sick of it',
    ],
  },
  {
    id: 'scham', label: 'Scham', labelEn: 'Shame', color: '#B87F95',
    sub: ['beschämt', 'peinlich berührt', 'unzulänglich', 'wertlos', 'bloßgestellt', 'sich schämend'],
    subEn: ['ashamed', 'embarrassed', 'inadequate', 'worthless', 'exposed', 'feeling shame'],
  },
  {
    id: 'schuld', label: 'Schuld', labelEn: 'Guilt', color: '#A67C52',
    sub: ['schuldig', 'reuig', 'unwohl mit mir', 'selbstvorwürflich', 'verpflichtet', 'verantwortlich'],
    subEn: ['guilty', 'remorseful', 'uneasy with myself', 'self-reproachful', 'obligated', 'responsible'],
  },
  {
    id: 'freude', label: 'Freude / Glück', labelEn: 'Joy / Happiness', color: '#D9A441',
    sub: [
      'froh', 'erleichtert', 'dankbar', 'zufrieden', 'begeistert', 'verbunden',
      'erfreut', 'glücklich', 'motiviert', 'erfüllt', 'sicher', 'berührt',
      'angetan', 'inspiriert', 'interessiert', 'ausgeglichen', 'entspannt', 'beruhigt',
    ],
    subEn: [
      'glad', 'relieved', 'grateful', 'content', 'excited', 'connected',
      'pleased', 'happy', 'motivated', 'fulfilled', 'safe', 'moved',
      'taken with it', 'inspired', 'interested', 'balanced', 'relaxed', 'soothed',
    ],
  },
  {
    id: 'hoffnungslosigkeit', label: 'Hoffnungslosigkeit', labelEn: 'Hopelessness', color: '#5C6B73',
    sub: ['mutlos', 'deprimiert', 'verzweifelt', 'hoffnungslos'],
    subEn: ['discouraged', 'depressed', 'desperate', 'hopeless'],
  },
  {
    id: 'ohnmacht', label: 'Ohnmacht', labelEn: 'Powerlessness', color: '#6B5B73',
    sub: ['blockiert', 'gelähmt', 'überfordert', 'überlastet', 'hilflos', 'machtlos', 'ohnmächtig'],
    subEn: ['blocked', 'paralyzed', 'overwhelmed', 'overloaded', 'helpless', 'powerless', 'powerless'],
  },
  {
    id: 'frust', label: 'Frust', labelEn: 'Frustration', color: '#C1743A',
    sub: ['frustriert', 'resigniert', 'verbittert', 'entmutigt', 'unmotiviert', 'demotiviert'],
    subEn: ['frustrated', 'resigned', 'embittered', 'discouraged', 'unmotivated', 'demotivated'],
  },
  {
    id: 'unzufriedenheit', label: 'Unzufriedenheit', labelEn: 'Dissatisfaction', color: '#5B8A87',
    sub: ['unzufrieden', 'schlecht gelaunt', 'unbefriedigt'],
    subEn: ['dissatisfied', 'in a bad mood', 'unfulfilled'],
  },
  {
    id: 'einsamkeit', label: 'Einsamkeit', labelEn: 'Loneliness', color: '#7A8B9E',
    sub: ['einsam'],
    subEn: ['lonely'],
  },
  {
    id: 'gleichgueltigkeit', label: 'Gleichgültigkeit', labelEn: 'Indifference', color: '#8A8A7E',
    sub: ['desinteressiert', 'gelangweilt', 'angeödet', 'lustlos', 'teilnahmslos', 'gefühllos', 'gleichgültig'],
    subEn: ['uninterested', 'bored', 'turned off', 'listless', 'apathetic', 'unfeeling', 'indifferent'],
  },
];

/**
 * "Ueberall konsistent"-Auftrag - reverse lookup from a specific
 * sub-feeling word (as stored in ZugangEntry.feelings, e.g.
 * "aengstlich") back to its group's color, so any place displaying a
 * saved feeling (review, diary) can color it the same way the wheel
 * and Zugang's picker do, without needing to store the group
 * alongside every feeling word.
 */
export function colorForFeelingWord(word: string): string | undefined {
  return FEELING_GROUPS.find((g) => g.sub.includes(word) || g.subEn.includes(word))?.color;
}

// ---------------------------------------------------------------------
// Step 4 — Schutzstrategie
// ---------------------------------------------------------------------
export const PROTECTION_STRATEGIES_DE = [
  'abschalten', 'nichts mehr fühlen', 'Kontrolle zurückgewinnen', 'analysieren',
  'möglichst still werden', 'Rückzug', 'perfekt sein wollen', 'Handy/Serien als Ablenkung',
  'sich klein machen', 'alles kontrollieren', 'sich anpassen', 'gefallen wollen', 'dissoziieren',
];

/** Loose keyword hints suggesting a strategy might be worth turning
 * into a Garden counter — never automatic, always an offered question. */
export const PROTECTION_GARDEN_SUGGESTIONS = ['rauchen', 'vermeiden', 'ablenkung', 'kontrollieren'];

// ---------------------------------------------------------------------
// Step 5 — Fürsorge
// ---------------------------------------------------------------------
export interface CareWishOption {
  text: string;
  textEn: string;
  category: string;
  categoryEn: string;
}

export const CARE_WISH_OPTIONS: CareWishOption[] = [
  { text: '„Ordne mit mir.“', textEn: '"Help me sort through this."', category: 'Orientierung', categoryEn: 'Orientation' },
  { text: '„Bleib bei mir.“', textEn: '"Stay with me."', category: 'Sicherheit / Co-Regulation', categoryEn: 'Safety / co-regulation' },
  { text: '„Mach mir Tee.“', textEn: '"Make me tea."', category: 'Fürsorge / Regulation', categoryEn: 'Care / regulation' },
  { text: '„Sag mir, dass das reicht.“', textEn: '"Tell me that\'s enough."', category: 'Entlastung', categoryEn: 'Relief' },
  { text: '„Geh mit mir raus.“', textEn: '"Come outside with me."', category: 'Aktivierung + Verbindung', categoryEn: 'Activation + connection' },
  { text: '„Hilf mir entscheiden.“', textEn: '"Help me decide."', category: 'Entscheidungssicherheit', categoryEn: 'Decision support' },
  { text: '„Frag mich nichts.“', textEn: '"Don\'t ask me anything."', category: 'Ruhe', categoryEn: 'Quiet' },
  { text: '„Erinnere mich.“', textEn: '"Remind me."', category: 'Orientierung / Selbstkontinuität', categoryEn: 'Orientation / self-continuity' },
];

export const CARE_ACTIONS_DE = [
  'zuhören', 'sortieren', 'Tee machen', 'spazieren gehen', 'einfach da sein',
  'mitdenken', 'erinnern', 'gemeinsam schweigen', 'in den Arm nehmen', 'ruhig sprechen',
  'Zeit geben', 'nicht bewerten', 'erklären, was als Nächstes passiert',
];

// ---------------------------------------------------------------------
// Step 6 — Eigentliches Bedürfnis (GFK-style needs inventory)
// ---------------------------------------------------------------------
export interface NeedCategoryGroup {
  id: string;
  label: string;
  labelEn: string;
  /** Added alongside the "neue Beduerfnisse"-Auftrag — every category
   * gets a fixed emoji for consistent visual recognition wherever
   * needs are shown (Zugang, Beduerfniskompass, review), matching the
   * app-wide push for consistent iconography per concept. */
  emoji: string;
  items: string[];
  itemsEn: string[];
}

export const NEED_CATEGORY_GROUPS: NeedCategoryGroup[] = [
  { id: 'autonomie', label: 'Autonomie', labelEn: 'Autonomy', emoji: '🕊️', items: ['Freiheit', 'Selbstbestimmung'], itemsEn: ['Freedom', 'Self-determination'] },
  {
    id: 'koerper', label: 'Körper', labelEn: 'Body', emoji: '🫀',
    items: ['Luft', 'Wasser', 'Bewegung', 'Nahrung', 'Schlaf', 'Distanz', 'Unterkunft', 'Wärme', 'Gesundheit', 'Heilung', 'Kraft', 'Lebenserhaltung'],
    itemsEn: ['Air', 'Water', 'Movement', 'Food', 'Sleep', 'Distance', 'Shelter', 'Warmth', 'Health', 'Healing', 'Strength', 'Sustenance'],
  },
  {
    id: 'koerperliche_unversehrtheit', label: 'Körperliche Unversehrtheit', labelEn: 'Physical integrity', emoji: '🩺',
    items: ['Freiheit von Schmerz', 'Freiheit von Krankheit', 'körperliche Sicherheit', 'Unverletztheit', 'medizinische Versorgung'],
    itemsEn: ['Freedom from pain', 'Freedom from illness', 'Physical safety', 'Being unharmed', 'Medical care'],
  },
  {
    id: 'integritaet', label: 'Integrität / Stimmigkeit', labelEn: 'Integrity / Congruence', emoji: '🧭',
    items: ['Authentizität', 'Einklang', 'Eindeutigkeit', 'Übereinstimmung mit eigenen Werten', 'Identität', 'Individualität'],
    itemsEn: ['Authenticity', 'Alignment', 'Clarity of self', 'Congruence with own values', 'Identity', 'Individuality'],
  },
  {
    id: 'sicherheit', label: 'Sicherheit', labelEn: 'Security', emoji: '🛡️',
    items: ['Schutz', 'Übersicht', 'Klarheit', 'Abgrenzung', 'Privatsphäre', 'Struktur', 'Beständigkeit', 'Verbindlichkeit', 'Orientierung'],
    itemsEn: ['Protection', 'Overview', 'Clarity', 'Boundaries', 'Privacy', 'Structure', 'Constancy', 'Reliability', 'Orientation'],
  },
  {
    id: 'verbindung', label: 'Verbindung', labelEn: 'Connection', emoji: '🤝',
    items: [
      'Wertschätzung', 'Nähe', 'Zugehörigkeit', 'Liebe', 'Intimität', 'Unterstützung', 'Ehrlichkeit', 'Gemeinschaft',
      'Geborgenheit', 'Respekt', 'Kontakt', 'Akzeptanz', 'Austausch', 'Offenheit', 'Vertrauen', 'Anerkennung',
      'Freundschaft', 'Achtsamkeit', 'Aufmerksamkeit', 'Toleranz', 'Zusammenarbeit',
      'Hilfe', 'Fürsorge', 'Rückhalt', 'Zuspruch', 'Ermutigung', 'Einbezogen sein', 'Eigenen Platz haben',
      'Bewunderung', 'Bestätigung', 'Verständigung', 'Wahrgenommen werden', 'Dankbarkeit',
    ],
    itemsEn: [
      'Appreciation', 'Closeness', 'Belonging', 'Love', 'Intimacy', 'Support', 'Honesty', 'Community',
      'Security in relationship', 'Respect', 'Contact', 'Acceptance', 'Exchange', 'Openness', 'Trust', 'Recognition',
      'Friendship', 'Mindfulness', 'Attention', 'Tolerance', 'Cooperation',
      'Help', 'Care', 'Being backed up', 'Encouragement', 'Being encouraged', 'Being included', 'Having your own place',
      'Admiration', 'Affirmation', 'Mutual understanding', 'Being seen', 'Gratitude',
    ],
  },
  {
    id: 'entspannung', label: 'Entspannung', labelEn: 'Relaxation', emoji: '🌙',
    items: ['Erholung', 'Ausruhen', 'Spiel', 'Leichtigkeit', 'Ruhe', 'Gemütlichkeit', 'Bequemlichkeit', 'Stille', 'Rückzug', 'Gelassenheit', 'Frieden'],
    itemsEn: ['Recovery', 'Resting', 'Play', 'Lightness', 'Rest', 'Coziness', 'Comfort', 'Stillness', 'Withdrawal', 'Ease', 'Peace'],
  },
  {
    id: 'geistig', label: 'Geistige Bedürfnisse', labelEn: 'Mental / spiritual needs', emoji: '✨',
    items: ['Harmonie', 'Inspiration', 'Ordnung', 'innerer Friede', 'Freude', 'Humor', 'Abwechslungsreichtum', 'Ausgewogenheit', 'Glück', 'Ästhetik', 'Vielfalt', 'Abenteuer', 'Unterhaltung'],
    itemsEn: ['Harmony', 'Inspiration', 'Order', 'Inner peace', 'Joy', 'Humor', 'Variety', 'Balance', 'Happiness', 'Aesthetics', 'Diversity', 'Adventure', 'Entertainment'],
  },
  {
    id: 'sinn_kohaerenz', label: 'Sinn & Kohärenz', labelEn: 'Meaning & coherence', emoji: '🔭',
    items: ['das Leben verstehen', 'Bedeutung geben', 'einen roten Faden erkennen', 'Zusammenhänge verstehen', 'Werte leben'],
    itemsEn: ['Understanding life', 'Giving meaning', 'Recognizing a thread', 'Understanding connections', 'Living values'],
  },
  {
    id: 'selbstwirksamkeit', label: 'Selbstwirksamkeit', labelEn: 'Self-efficacy', emoji: '⚡',
    items: ['Kompetenz spüren', 'etwas bewirken können', 'Einfluss nehmen', 'Fähigkeiten einsetzen', 'etwas erfolgreich verändern'],
    itemsEn: ['Feeling competent', 'Being able to make a difference', 'Having influence', 'Using abilities', 'Successfully changing something'],
  },
  {
    id: 'entwicklung', label: 'Entwicklung', labelEn: 'Growth', emoji: '🌱',
    items: [
      'Beitrag', 'Wachstum', 'Feedback', 'Rückmeldung', 'Gelingen', 'Kreativität',
      'Effektivität', 'Kompetenz', 'Lernen', 'Feiern', 'Trauern', 'Bildung', 'Engagement', 'Erfolg',
    ],
    itemsEn: [
      'Contribution', 'Growth', 'Feedback', 'Reflection', 'Accomplishment', 'Creativity',
      'Effectiveness', 'Competence', 'Learning', 'Celebration', 'Mourning', 'Education', 'Engagement', 'Success',
    ],
  },
  {
    id: 'einfuehlung', label: 'Einfühlung', labelEn: 'Empathy', emoji: '💞',
    items: ['Empathie', 'Verständnis', 'Gleichbehandlung', 'Gerechtigkeit', 'Gegenseitigkeit', 'Gleichwertigkeit'],
    itemsEn: ['Empathy', 'Understanding', 'Equal treatment', 'Fairness', 'Mutuality', 'Equal worth'],
  },
];

// ---------------------------------------------------------------------
// Step 7 — Hindernis
// ---------------------------------------------------------------------
export const OBSTACLES_DE = [
  'Angst vor Nähe', 'Misstrauen', 'Erschöpfung', 'innerer Kritiker', 'altes Beschämungsmuster',
  'Stimme aus der Vergangenheit', 'Zeitmangel', '„Ich darf das nicht.“', 'Angst vor Kontrollverlust',
  'Scham, Hilfe zu brauchen', 'Angst, andere zu belasten', '„Ich muss das alleine schaffen.“',
  'zu viele Aufgaben gleichzeitig',
];

// ---------------------------------------------------------------------
// Step 8 — Brücke (uses existing bridgesRepo — no static list needed)
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// Step 9 — Verbindung zum Leben
// ---------------------------------------------------------------------
export const CONNECTION_ITEMS_DE = [
  'Kreativität', 'Produktivität', 'soziale Verbindung', 'emotionale Verbindung', 'Verantwortung',
  'Dankbarkeit', 'Familie', 'Partnerschaft', 'Freundschaft', 'Gemeinschaft', 'Identität', 'Tageslicht',
  'Rhythmus', 'Natur', 'Tiere', 'Schlaf', 'Erholung', 'Wasser/Nahrung', 'Bewegung', 'Integrität',
  'Ehrlichkeit', 'Spiritualität', 'Sinn', 'Humor', 'Lachen', 'Neugier', 'Lernen',
];

// ---------------------------------------------------------------------
// Step 10 — Konkrete Handlung (examples shown alongside real app data)
// ---------------------------------------------------------------------
export const ACTION_EXAMPLES_DE = [
  'Pause machen', 'jemanden anrufen', 'aufschreiben, was los ist', 'etwas Gutes tun', 'rausgehen',
  'lesen', 'arbeiten', 'liegen bleiben dürfen', 'Hilfe holen', 'eine Kleinigkeit erledigen',
  'schlafen/ruhen', 'Grenze setzen', 'sprechen', 'kreativ werden',
];
