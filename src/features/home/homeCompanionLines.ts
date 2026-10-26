import type { TimeOfDay, WeatherMood } from './homeContext';
import { getCustomLines, currentTimeOfDay, getDeactivatedIds } from '../../components/companion/companionContentManagement';
import { textFor } from '../../components/companion/companionRegistry';
import { getUiLanguage } from '../../services/uiLanguage';

/**
 * Extensible contextual sayings for the Home hero companion. To add a new
 * state or more lines: just add/extend an entry below — nothing else needs
 * to change. Each key is checked independently and combined, so a line can
 * be tied to time-of-day, to weather, to weekday/weekend, or just be a
 * general "any time" aside.
 */
export const TIME_OF_DAY_LINES: Record<TimeOfDay, string[]> = {
  morgen: [
    'Guten Morgen. Ein neuer Tag, ganz ohne Vorgaben.',
    'Der Morgen ist noch ganz unbeschrieben.',
    'Kaffee, Tee, oder einfach nur da sein — alles gilt.',
  ],
  tag: [
    'Mitten im Tag — kurz durchatmen zählt auch.',
    'Wie fühlt sich dieser Moment gerade an?',
  ],
  abend: [
    'Der Abend darf ruhiger werden.',
    'Ein guter Moment, um den Tag kurz sacken zu lassen.',
  ],
  nacht: [
    'Es ist spät. Sei sanft mit dir.',
    'Auch die Nacht darf einfach nur Nacht sein.',
  ],
};

export const WEEKEND_LINES: string[] = [
  'Wochenende — vielleicht heute ein bisschen weniger Plan.',
  'Kein Termin-Druck heute, wenn du nicht willst.',
];

export const WEATHER_LINES: Record<Exclude<WeatherMood, null>, string[]> = {
  sonnig: ['Draußen scheint gerade die Sonne — vielleicht ein Grund für einen kurzen Ausblick.', 'Sonnig heute. Auch das darf man einfach bemerken.'],
  regen: ['Es regnet gerade draußen — drinnen ist es jetzt besonders gemütlich.', 'Regenwetter. Ein guter Tag für eine warme Tasse irgendwas.'],
  bewoelkt: ['Bewölkter Himmel heute — passt vielleicht ganz gut zu einem ruhigen Tag.'],
  schnee: ['Es schneit gerade — falls du kurz rausschaust, lohnt es sich.'],
};


/* English versions of the same pools */
const TIME_OF_DAY_LINES_EN: Record<TimeOfDay, string[]> = {
  morgen: ['Good morning. A new day, with no requirements.', 'The morning is still completely unwritten.', 'Coffee, tea, or just being here — all of it counts.'],
  tag: ['Middle of the day — a short breath counts, too.', 'How does this moment feel right now?'],
  abend: ['The evening may become quieter.', 'A good moment to let the day settle for a bit.'],
  nacht: ['It is late. Be gentle with yourself.', 'Even the night may simply be night.'],
};
const WEEKEND_LINES_EN: string[] = ['Weekend — maybe a little less plan today.', 'No appointment pressure today, if you don’t want it.'];
const WEATHER_LINES_EN: Record<Exclude<WeatherMood, null>, string[]> = {
  sonnig: ['The sun is out right now — maybe a reason for a short look outside.', 'Sunny today. That, too, may simply be noticed.'],
  regen: ['It is raining outside — which makes it especially cosy in here.', 'Rainy weather. A good day for a warm cup of something.'],
  bewoelkt: ['Cloudy sky today — perhaps just right for a calm day.'],
  schnee: ['It is snowing right now — worth a quick look out, if you like.'],
};
const namedLinesEn = (name: string) => [`Hello ${name}, lovely to hear from you.`, `${name}, you’re here again today.`, `${name}, maybe a small step is enough today.`, `Nice to see you, ${name}.`];

/** Uses the person's name if they gave one at first launch (see
 * FirstNameStep) — deliberately a small, separate pool with its own low
 * inclusion chance in pickHomeContextLine, so the name shows up
 * occasionally and naturally, never on every single visit. */
function namedLines(name: string): string[] {
  return [
    `Hallo ${name}, schön von dir zu hören.`,
    `${name}, du bist heute wieder da.`,
    `${name}, vielleicht ist heute ein kleiner Schritt schon genug.`,
    `Schön, dich zu sehen, ${name}.`,
  ];
}

/** Picks one contextual line, mixing in whichever context pools are
 * available (weather is optional and often null). Avoids repeating the
 * exact same line as last time within a session. */
let lastShown: string | null = null;

export function pickHomeContextLine(
  timeOfDay: TimeOfDay,
  isWeekend: boolean,
  weather: WeatherMood,
  userName?: string,
): string {
  const en = getUiLanguage() === 'en';
  const pool: string[] = [...(en ? TIME_OF_DAY_LINES_EN : TIME_OF_DAY_LINES)[timeOfDay]];
  if (isWeekend) pool.push(...(en ? WEEKEND_LINES_EN : WEEKEND_LINES));
  if (weather) pool.push(...(en ? WEATHER_LINES_EN : WEATHER_LINES)[weather]);
  // Only a ~20% chance to even offer the named lines as candidates — keeps
  // the name feeling occasional rather than constant, on top of it already
  // competing for a random pick against every other line in the pool.
  if (userName && Math.random() < 0.2) pool.push(...(en ? namedLinesEn(userName) : namedLines(userName)));

  const candidates = pool.filter((line) => line !== lastShown);
  const chosen = (candidates.length > 0 ? candidates : pool)[Math.floor(Math.random() * (candidates.length > 0 ? candidates.length : pool.length))];
  lastShown = chosen;
  return chosen;
}

/**
 * "Ich habe neue Saetze hinzugefuegt, die am Anfang auf der Startseite
 * angezeigt werden — aber sie werden mir nie angezeigt"-Fund. Own
 * sentences added under Wesen-Inhalte (Ort: Startseite, or "ueberall"
 * with an opening trigger) are kept in the companion registry, but the
 * Home page never asked the registry — it only used the fixed lists
 * above, so those sentences could not appear. This returns one of the
 * person's own Home sentences, or null. How often one is offered follows
 * the frequency they chose (selten ~12%, gelegentlich ~30%, haeufig
 * ~50% per visit), and the time-of-day choice is respected.
 */
const CUSTOM_HOME_CHANCE = { selten: 0.12, gelegentlich: 0.3, haeufig: 0.5 } as const;
let lastCustom: string | null = null;

export function pickCustomHomeLine(): string | null {
  const deactivated = getDeactivatedIds();
  const now = currentTimeOfDay();
  const lines = getCustomLines().filter((l) => {
    if (deactivated.has(l.id)) return false;
    const forHome = l.page === '/' || (l.page === '*' && (l.trigger === 'erstes_oeffnen' || l.trigger === 'wiederholtes_oeffnen'));
    const timeOk = !l.timeOfDay || l.timeOfDay === 'any' || l.timeOfDay === now;
    return forHome && timeOk;
  });
  if (lines.length === 0) return null;
  // the chance of showing a custom line at all = the highest frequency among the candidates
  const chance = Math.max(...lines.map((l) => CUSTOM_HOME_CHANCE[l.frequency ?? 'gelegentlich']));
  if (Math.random() > chance) return null;
  const fresh = lines.filter((l) => textFor(l) !== lastCustom);
  const pool = fresh.length > 0 ? fresh : lines;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  lastCustom = textFor(chosen);
  return lastCustom;
}
