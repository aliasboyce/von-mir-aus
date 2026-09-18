import type { WeatherCondition, NeedDirection, NeedCategory, PolyvagalZone } from '../../data/types';
import type { TranslationDictionary } from '../../i18n/de';

export const WEATHER_META: Record<
  WeatherCondition,
  { emoji: string; label: (t: TranslationDictionary) => string; hint: (t: TranslationDictionary) => string }
> = {
  klar: { emoji: '☀️', label: (t) => t.weather.klar.label, hint: (t) => t.weather.klar.hint },
  sonnig: { emoji: '🌤️', label: (t) => t.weather.sonnig.label, hint: (t) => t.weather.sonnig.hint },
  bewoelkt: { emoji: '☁️', label: (t) => t.weather.bewoelkt.label, hint: (t) => t.weather.bewoelkt.hint },
  windig: { emoji: '🌬️', label: (t) => t.weather.windig.label, hint: (t) => t.weather.windig.hint },
  regnerisch: { emoji: '🌧️', label: (t) => t.weather.regnerisch.label, hint: (t) => t.weather.regnerisch.hint },
  gewitter: { emoji: '⛈️', label: (t) => t.weather.gewitter.label, hint: (t) => t.weather.gewitter.hint },
  nebel: { emoji: '🌫️', label: (t) => t.weather.nebel.label, hint: (t) => t.weather.nebel.hint },
  brise: { emoji: '🍃', label: (t) => t.weather.brise.label, hint: (t) => t.weather.brise.hint },
  sturm: { emoji: '🌪️', label: (t) => t.weather.sturm.label, hint: (t) => t.weather.sturm.hint },
  schnee: { emoji: '❄️', label: (t) => t.weather.schnee.label, hint: (t) => t.weather.schnee.hint },
  hagel: { emoji: '🧊', label: (t) => t.weather.hagel.label, hint: (t) => t.weather.hagel.hint },
  tornado: { emoji: '🌀', label: (t) => t.weather.tornado.label, hint: (t) => t.weather.tornado.hint },
  hurrikan: { emoji: '🌊', label: (t) => t.weather.hurrikan.label, hint: (t) => t.weather.hurrikan.hint },
  hitze: { emoji: '🥵', label: (t) => t.weather.hitze.label, hint: (t) => t.weather.hitze.hint },
  frost: { emoji: '🥶', label: (t) => t.weather.frost.label, hint: (t) => t.weather.frost.hint },
};

/**
 * Connects the weather-metaphor check-in to the actual polyvagal/nervous-
 * system curve system ("Meine Entwicklung") — without this, choosing a
 * weather condition never showed up in that curve at all, even though the
 * intro/tour explicitly promises "in Meine Entwicklung später deinen
 * Verlauf über die Zeit". A soft, non-clinical mapping, not a diagnosis.
 */
export const WEATHER_TO_ZONE: Record<WeatherCondition, PolyvagalZone> = {
  klar: 'ventral',
  sonnig: 'ventral',
  bewoelkt: 'ventral',
  windig: 'sympathetic',
  gewitter: 'sympathetic',
  regnerisch: 'dorsal',
  nebel: 'dorsal',
  brise: 'ventral',
  sturm: 'sympathetic',
  schnee: 'dorsal',
  hagel: 'sympathetic',
  tornado: 'sympathetic',
  hurrikan: 'sympathetic',
  hitze: 'dorsal',
  frost: 'dorsal',
};

export const WEATHER_ORDER: WeatherCondition[] = [
  'klar',
  'sonnig',
  'bewoelkt',
  'brise',
  'windig',
  'nebel',
  'regnerisch',
  'schnee',
  'hagel',
  'gewitter',
  'sturm',
  'tornado',
  'hurrikan',
  'hitze',
  'frost',
];

export const NEED_META: Record<
  NeedDirection,
  {
    icon: string;
    category: NeedCategory;
    label: (t: TranslationDictionary) => string;
    hint: (t: TranslationDictionary) => string;
    explanation: (t: TranslationDictionary) => string;
    feelings: (t: TranslationDictionary) => string;
  }
> = {
  koerperliche_versorgung: {
    icon: '🍞',
    category: 'koerperlich',
    label: (t) => t.weather.needs.koerperliche_versorgung.label,
    hint: (t) => t.weather.needs.koerperliche_versorgung.hint,
    explanation: (t) => t.weather.needs.koerperliche_versorgung.explanation,
    feelings: (t) => t.weather.needs.koerperliche_versorgung.feelings,
  },
  schlaf: {
    icon: '🌙',
    category: 'koerperlich',
    label: (t) => t.weather.needs.schlaf.label,
    hint: (t) => t.weather.needs.schlaf.hint,
    explanation: (t) => t.weather.needs.schlaf.explanation,
    feelings: (t) => t.weather.needs.schlaf.feelings,
  },
  bewegung: {
    icon: '🚶',
    category: 'koerperlich',
    label: (t) => t.weather.needs.bewegung.label,
    hint: (t) => t.weather.needs.bewegung.hint,
    explanation: (t) => t.weather.needs.bewegung.explanation,
    feelings: (t) => t.weather.needs.bewegung.feelings,
  },
  sicherheit: {
    icon: '🛡️',
    category: 'psychisch_sozial',
    label: (t) => t.weather.needs.sicherheit.label,
    hint: (t) => t.weather.needs.sicherheit.hint,
    explanation: (t) => t.weather.needs.sicherheit.explanation,
    feelings: (t) => t.weather.needs.sicherheit.feelings,
  },
  verbindung: {
    icon: '🤝',
    category: 'psychisch_sozial',
    label: (t) => t.weather.needs.verbindung.label,
    hint: (t) => t.weather.needs.verbindung.hint,
    explanation: (t) => t.weather.needs.verbindung.explanation,
    feelings: (t) => t.weather.needs.verbindung.feelings,
  },
  zugehoerigkeit: {
    icon: '🌳',
    category: 'psychisch_sozial',
    label: (t) => t.weather.needs.zugehoerigkeit.label,
    hint: (t) => t.weather.needs.zugehoerigkeit.hint,
    explanation: (t) => t.weather.needs.zugehoerigkeit.explanation,
    feelings: (t) => t.weather.needs.zugehoerigkeit.feelings,
  },
  autonomie: {
    icon: '🗝️',
    category: 'psychisch_sozial',
    label: (t) => t.weather.needs.autonomie.label,
    hint: (t) => t.weather.needs.autonomie.hint,
    explanation: (t) => t.weather.needs.autonomie.explanation,
    feelings: (t) => t.weather.needs.autonomie.feelings,
  },
  orientierung: {
    icon: '🧭',
    category: 'psychisch_sozial',
    label: (t) => t.weather.needs.orientierung.label,
    hint: (t) => t.weather.needs.orientierung.hint,
    explanation: (t) => t.weather.needs.orientierung.explanation,
    feelings: (t) => t.weather.needs.orientierung.feelings,
  },
  ruhe: {
    icon: '🌊',
    category: 'psychisch_sozial',
    label: (t) => t.weather.needs.ruhe.label,
    hint: (t) => t.weather.needs.ruhe.hint,
    explanation: (t) => t.weather.needs.ruhe.explanation,
    feelings: (t) => t.weather.needs.ruhe.feelings,
  },
  ausdruck: {
    icon: '🎨',
    category: 'psychisch_sozial',
    label: (t) => t.weather.needs.ausdruck.label,
    hint: (t) => t.weather.needs.ausdruck.hint,
    explanation: (t) => t.weather.needs.ausdruck.explanation,
    feelings: (t) => t.weather.needs.ausdruck.feelings,
  },
  wertschaetzung: {
    icon: '🌱',
    category: 'psychisch_sozial',
    label: (t) => t.weather.needs.wertschaetzung.label,
    hint: (t) => t.weather.needs.wertschaetzung.hint,
    explanation: (t) => t.weather.needs.wertschaetzung.explanation,
    feelings: (t) => t.weather.needs.wertschaetzung.feelings,
  },
  freude: {
    icon: '✨',
    category: 'psychisch_sozial',
    label: (t) => t.weather.needs.freude.label,
    hint: (t) => t.weather.needs.freude.hint,
    explanation: (t) => t.weather.needs.freude.explanation,
    feelings: (t) => t.weather.needs.freude.feelings,
  },
  sinn: {
    icon: '🔭',
    category: 'psychisch_sozial',
    label: (t) => t.weather.needs.sinn.label,
    hint: (t) => t.weather.needs.sinn.hint,
    explanation: (t) => t.weather.needs.sinn.explanation,
    feelings: (t) => t.weather.needs.sinn.feelings,
  },
  selbstwirksamkeit: {
    icon: '⚡',
    category: 'psychisch_sozial',
    label: (t) => t.weather.needs.selbstwirksamkeit.label,
    hint: (t) => t.weather.needs.selbstwirksamkeit.hint,
    explanation: (t) => t.weather.needs.selbstwirksamkeit.explanation,
    feelings: (t) => t.weather.needs.selbstwirksamkeit.feelings,
  },
  koerperliche_unversehrtheit: {
    icon: '🩺',
    category: 'koerperlich',
    label: (t) => t.weather.needs.koerperliche_unversehrtheit.label,
    hint: (t) => t.weather.needs.koerperliche_unversehrtheit.hint,
    explanation: (t) => t.weather.needs.koerperliche_unversehrtheit.explanation,
    feelings: (t) => t.weather.needs.koerperliche_unversehrtheit.feelings,
  },
};

export const NEED_ORDER: NeedDirection[] = [
  'koerperliche_versorgung',
  'schlaf',
  'bewegung',
  'sicherheit',
  'verbindung',
  'zugehoerigkeit',
  'autonomie',
  'orientierung',
  'ruhe',
  'ausdruck',
  'wertschaetzung',
  'freude',
  'sinn',
  'selbstwirksamkeit',
  'koerperliche_unversehrtheit',
];
