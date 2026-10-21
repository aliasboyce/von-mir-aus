import type { PolyvagalZone } from '../../data/types';

interface NarrativeVariants {
  de: string[];
  en: string[];
}

const DOMINANT_VENTRAL: NarrativeVariants = {
  de: [
    'Diese Woche warst du öfter in ruhigeren, verbundenen Momenten unterwegs.',
    'Diese Woche gab es viele Momente, in denen du dich verbunden gefühlt hast.',
    'Ruhe und Verbindung waren diese Woche recht oft mit dabei.',
  ],
  en: [
    'This week, you were often in calmer, more connected moments.',
    'This week had many moments where you felt connected.',
    'Calm and connection showed up quite often this week.',
  ],
};

const DOMINANT_SYMPATHETIC: NarrativeVariants = {
  de: [
    'Diese Woche war öfter Aktivierung da — das darf so sein, ganz ohne Bewertung.',
    'Diese Woche hat sich dein System öfter mobilisiert gezeigt. Nur eine Beobachtung, keine Bewertung.',
    'Es steckte diese Woche viel Energie und Anspannung in dir. Das ist eine Information, kein Urteil.',
  ],
  en: [
    'This week had more activation — that\'s allowed, without any judgment.',
    'Your system showed up mobilized more often this week. Just an observation, not a judgment.',
    'There was a lot of energy and tension in you this week. That\'s information, not a verdict.',
  ],
};

const DOMINANT_DORSAL: NarrativeVariants = {
  de: [
    'Diese Woche gab es öfter Momente von Rückzug oder Erschöpfung. Das ist eine Information, keine Bewertung.',
    'Dein System hat sich diese Woche öfter zurückgezogen oder heruntergefahren. Das darf so sein.',
    'Es war diese Woche öfter wenig Energie da. Kein Grund, dir das vorzuwerfen.',
  ],
  en: [
    'This week had more moments of withdrawal or exhaustion. That\'s information, not a judgment.',
    'Your system pulled back or powered down more often this week. That\'s allowed.',
    'There was often little energy this week. No reason to hold that against yourself.',
  ],
};

const MIXED: NarrativeVariants = {
  de: [
    'Diese Woche war unterschiedlich — mal ruhiger, mal aktivierter, mal zurückgezogener. Auch das ist okay.',
    'Es gab diese Woche ein Auf und Ab zwischen verschiedenen Zuständen. Das ist ganz normal.',
    'Diese Woche hat sich vieles abgewechselt, ohne ein klares Muster. Auch das darf so sein.',
  ],
  en: [
    'This week was mixed — sometimes calmer, sometimes more activated, sometimes more withdrawn. That\'s okay too.',
    'There was some back-and-forth between different states this week. That\'s completely normal.',
    'This week had a lot of variation, without one clear pattern. That\'s allowed too.',
  ],
};

const NO_DATA: NarrativeVariants = {
  de: [
    'Diese Woche gibt es hier noch nicht viel zu zeigen — das ist völlig in Ordnung, du musst nichts dokumentieren, um die App zu nutzen.',
    'Für diese Woche liegen wenige Daten vor. Das sagt nichts über die Woche selbst aus, nur darüber, wie viel festgehalten wurde.',
  ],
  en: [
    "There isn't much to show here for this week yet — that's completely fine, you don't have to log anything to use the app.",
    'Not much data was recorded for this week. That says nothing about the week itself, only about how much was logged.',
  ],
};

function pick(variants: string[], seed: number): string {
  return variants[seed % variants.length];
}

/**
 * A deterministic-but-varied pick keyed to the ISO week number, so the
 * same week always shows the same phrasing on repeat visits within
 * that week, but different weeks get genuine variety over time rather
 * than the exact same sentence every single week.
 */
function weekSeed(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return Math.floor(days / 7);
}

export function weeklyNarrative(zoneCounts: Record<PolyvagalZone, number>, isEn: boolean, periodLabel?: { de: string; en: string }): string {
  const total = zoneCounts.ventral + zoneCounts.sympathetic + zoneCounts.dorsal;
  const seed = weekSeed();
  let text: string;
  if (total === 0) {
    text = pick(isEn ? NO_DATA.en : NO_DATA.de, seed);
  } else {
    const entries: [PolyvagalZone, number][] = [
      ['ventral', zoneCounts.ventral],
      ['sympathetic', zoneCounts.sympathetic],
      ['dorsal', zoneCounts.dorsal],
    ];
    entries.sort((a, b) => b[1] - a[1]);
    const [topZone, topCount] = entries[0];
    const [, secondCount] = entries[1];

    // If the top zone doesn't clearly lead (within ~20% of the runner-up),
    // treat the period as genuinely mixed rather than picking a "winner"
    // that isn't really representative.
    const isMixed = topCount === 0 || (topCount - secondCount) / total < 0.2;
    if (isMixed) {
      text = pick(isEn ? MIXED.en : MIXED.de, seed);
    } else {
      const variants = topZone === 'ventral' ? DOMINANT_VENTRAL : topZone === 'sympathetic' ? DOMINANT_SYMPATHETIC : DOMINANT_DORSAL;
      text = pick(isEn ? variants.en : variants.de, seed);
    }
  }
  // "Monatsrueckblick"-Auftrag — every phrase above was written for a
  // week ("diese Woche"/"this week"); rather than duplicating the
  // entire phrase set for months, swap the one idiomatic time phrase
  // each sentence uses. Both "diese Woche" and "diesen Monat" (and
  // their English equivalents) are used the same way grammatically —
  // as a time adverbial — so a straight substring swap stays correct
  // in every sentence position above.
  if (periodLabel) {
    text = isEn ? text.replace(/this week/gi, periodLabel.en) : text.replaceAll('diese Woche', periodLabel.de);
  }
  return text;
}
