import type { Routine, RoutineCard } from './routinesRepo';

/**
 * Alltags-Vorlagen für Routinen. Nichts davon ist vorgeschrieben: Sie werden nur auf Wunsch angelegt,
 * sind als „Beispiel“ markiert und lassen sich ändern oder löschen. `level` ist die Energie-Ampel
 * (1 = auch an einem schweren Tag, 2 = ab mittlerer Energie, 3 = nur mit voller Energie).
 */
type L = 1 | 2 | 3;
interface TplCard { emoji: string; color: string; level: L; timerSec?: number; de: string; en: string }
export interface RoutineTemplate { key: string; emoji: string; color: string; de: string; en: string; dede: string; deen: string; cards: TplCard[] }

const BLUE = '#4a8f9e', GOLD = '#e8a83d', GREEN = '#6fbf73', VIOLET = '#9a7bc4', ROSE = '#d9778a', NAVY = '#5b7fb5', LIME = '#8fae3d';

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    key: 'morgen', emoji: '🌤️', color: GOLD, de: 'Morgen', en: 'Morning',
    dede: 'Sanft starten – auch ganz klein möglich.', deen: 'A soft start – possible even very small.',
    cards: [
      { emoji: '💧', color: BLUE, level: 1, de: 'Ein Glas Wasser trinken', en: 'Drink a glass of water' },
      { emoji: '🌤️', color: GOLD, level: 1, de: 'Ans Fenster gehen und kurz ins Licht schauen', en: 'Go to the window and look at the light for a moment' },
      { emoji: '🪥', color: BLUE, level: 2, timerSec: 120, de: 'Zähne putzen', en: 'Brush your teeth' },
      { emoji: '🧦', color: VIOLET, level: 2, de: 'Etwas Bequemes anziehen', en: 'Put on something comfortable' },
      { emoji: '🍎', color: GREEN, level: 3, de: 'Eine Kleinigkeit essen', en: 'Eat something small' },
      { emoji: '📓', color: ROSE, level: 3, de: 'Einen Moment überlegen: Was ist heute genug?', en: 'Take a moment: what is enough today?' },
    ],
  },
  {
    key: 'abend', emoji: '🌙', color: NAVY, de: 'Abend', en: 'Evening',
    dede: 'Den Tag leise ausklingen lassen.', deen: 'Let the day fade out quietly.',
    cards: [
      { emoji: '📵', color: NAVY, level: 1, de: 'Handy zur Seite legen', en: 'Put your phone aside' },
      { emoji: '💧', color: BLUE, level: 1, de: 'Wasser ans Bett stellen', en: 'Put some water by the bed' },
      { emoji: '🪥', color: BLUE, level: 2, timerSec: 120, de: 'Zähne putzen', en: 'Brush your teeth' },
      { emoji: '🧴', color: ROSE, level: 3, de: 'Gesicht waschen oder eincremen', en: 'Wash or cream your face' },
      { emoji: '🛏️', color: VIOLET, level: 1, de: 'Es dir im Bett warm und weich machen', en: 'Make yourself warm and soft in bed' },
      { emoji: '🌬️', color: GREEN, level: 2, timerSec: 30, de: 'Drei ruhige Atemzüge', en: 'Three calm breaths' },
    ],
  },
  {
    key: 'duschen', emoji: '🚿', color: BLUE, de: 'Duschen', en: 'Showering',
    dede: 'Auch „nur Gesicht und Hände“ zählt.', deen: 'Even “just face and hands” counts.',
    cards: [
      { emoji: '🧼', color: BLUE, level: 1, de: 'Gesicht und Hände mit warmem Wasser waschen', en: 'Wash face and hands with warm water' },
      { emoji: '🧺', color: LIME, level: 2, de: 'Ein Handtuch bereitlegen', en: 'Put a towel within reach' },
      { emoji: '🚿', color: BLUE, level: 2, de: 'Warmes Wasser anstellen und kurz abbrausen', en: 'Turn on warm water and rinse off briefly' },
      { emoji: '🧴', color: ROSE, level: 3, de: 'Haare und Körper waschen', en: 'Wash hair and body' },
      { emoji: '🧦', color: VIOLET, level: 2, de: 'Abtrocknen und etwas Weiches anziehen', en: 'Dry off and put on something soft' },
    ],
  },
  {
    key: 'essen', emoji: '🍽️', color: GREEN, de: 'Essen', en: 'Eating',
    dede: 'Von „irgendwas Kleines“ bis zu einer Mahlzeit.', deen: 'From “anything small” to a proper meal.',
    cards: [
      { emoji: '💧', color: BLUE, level: 1, de: 'Ein Glas Wasser trinken', en: 'Drink a glass of water' },
      { emoji: '🍎', color: GREEN, level: 1, de: 'Etwas Kleines essen, das leicht geht', en: 'Eat something small and easy' },
      { emoji: '🍳', color: GOLD, level: 3, de: 'Etwas Warmes oder Frisches zubereiten', en: 'Prepare something warm or fresh' },
      { emoji: '🪑', color: VIOLET, level: 2, de: 'Hinsetzen und in Ruhe essen', en: 'Sit down and eat in peace' },
      { emoji: '🧽', color: LIME, level: 2, de: 'Den Teller zur Spüle bringen', en: 'Bring the plate to the sink' },
    ],
  },
  {
    key: 'schlaf', emoji: '😴', color: VIOLET, de: 'Schlaf', en: 'Sleep',
    dede: 'Dem Körper helfen, runterzufahren.', deen: 'Help the body wind down.',
    cards: [
      { emoji: '📵', color: NAVY, level: 1, de: 'Bildschirme weglegen', en: 'Put screens away' },
      { emoji: '🌙', color: NAVY, level: 2, de: 'Licht dimmen', en: 'Dim the lights' },
      { emoji: '🕯️', color: GOLD, level: 3, timerSec: 300, de: 'Fünf Minuten etwas Ruhiges tun (Lesen, Musik, Dehnen)', en: 'Five quiet minutes (reading, music, stretching)' },
      { emoji: '🛏️', color: VIOLET, level: 1, de: 'Ins Bett legen', en: 'Lie down in bed' },
      { emoji: '🌬️', color: GREEN, level: 2, timerSec: 60, de: 'Ruhig atmen, länger aus als ein', en: 'Breathe calmly, longer out than in' },
    ],
  },
  {
    key: 'spaziergang', emoji: '🚶', color: LIME, de: 'Kleiner Spaziergang', en: 'Small walk',
    dede: 'Von „kurz vor die Tür“ bis „einmal um den Block“.', deen: 'From “step outside” to “around the block”.',
    cards: [
      { emoji: '👟', color: LIME, level: 1, de: 'Schuhe anziehen', en: 'Put on your shoes' },
      { emoji: '🌬️', color: GREEN, level: 1, timerSec: 30, de: 'Vor die Tür treten und drei Atemzüge Luft nehmen', en: 'Step outside and take three breaths of air' },
      { emoji: '🚶', color: LIME, level: 2, timerSec: 300, de: 'Einmal um den Block gehen', en: 'Walk once around the block' },
      { emoji: '👀', color: BLUE, level: 3, de: 'Fünf Dinge um dich herum benennen', en: 'Name five things around you' },
      { emoji: '💧', color: BLUE, level: 2, de: 'Zurück zuhause: Wasser trinken', en: 'Back home: drink some water' },
    ],
  },
  {
    key: 'wohnung5', emoji: '🏠', color: ROSE, de: 'Wohnung „5 Minuten“', en: 'Home “5 minutes”',
    dede: 'Nur ein kleiner Anfang – dann ist es genug.', deen: 'Just a small start – then it is enough.',
    cards: [
      { emoji: '🧺', color: ROSE, level: 1, de: 'Eine einzige Sache an ihren Platz bringen', en: 'Put one single thing in its place' },
      { emoji: '🗑️', color: LIME, level: 2, de: 'Offensichtlichen Müll einsammeln', en: 'Collect the obvious trash' },
      { emoji: '⏱️', color: GOLD, level: 3, timerSec: 300, de: 'Fünf Minuten lang aufräumen, was gerade ins Auge fällt', en: 'Tidy up whatever catches your eye for five minutes' },
      { emoji: '🌿', color: GREEN, level: 3, de: 'Aufhören, wenn der Timer klingelt – das reicht', en: 'Stop when the timer rings – that is enough' },
    ],
  },
];

export const templateRoutineId = (key: string) => `routine_tpl_${key}`;

/** a ready routine from a template, marked as example */
export function routineFromTemplate(t: RoutineTemplate, lang: 'de' | 'en'): Routine {
  const now = new Date().toISOString();
  const id = `${templateRoutineId(t.key)}_${Date.now().toString(36)}`;
  return {
    id,
    title: lang === 'en' ? t.en : t.de,
    emoji: t.emoji,
    color: t.color,
    createdAt: now,
    updatedAt: now,
    isExample: true,
    templateKey: t.key,
    cards: t.cards.map((c, i): RoutineCard => ({ id: `${id}_c${i}`, text: lang === 'en' ? c.en : c.de, emoji: c.emoji, color: c.color, minEnergy: c.level, ...(c.timerSec ? { timerSec: c.timerSec } : {}) })),
  };
}
