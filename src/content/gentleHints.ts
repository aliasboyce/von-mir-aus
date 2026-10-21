/**
 * "Anker, die wandern": in a state where familiar things are filtered out
 * (perceptual defense), a reminder that always looks the same stops being
 * seen. So each gentle reminder has several wordings per kind AND comes in
 * different forms — a short text, a bare question, or the companion
 * speaking/moving — chosen at random without repeating the last one.
 */
export type GentleKind = 'checkin' | 'inward' | 'energy';

interface Variant {
  de: { title: string; text: string };
  en: { title: string; text: string };
}
interface KindContent {
  variants: Variant[];
  question: { de: string; en: string };
  wesen: { de: string; en: string };
}

export const GENTLE_HINTS: Record<GentleKind, KindContent> = {
  checkin: {
    variants: [
      { de: { title: 'Kurz einchecken?', text: 'Wie angespannt bist du gerade? Ein kurzer Check-in setzt einen Punkt auf deine Kurve.' }, en: { title: 'Check in briefly?', text: 'How tense are you right now? A short check-in puts a point on your curve.' } },
      { de: { title: 'Einen Moment für dich?', text: 'Wenn du magst: kurz schauen, wo du gerade stehst. Ohne Bewertung.' }, en: { title: 'A moment for you?', text: 'If you like: take a brief look at where you are. No judging.' } },
      { de: { title: 'Wie ist es gerade?', text: 'Dein Check-in wartet — nur, wenn es passt.' }, en: { title: 'How is it right now?', text: 'Your check-in is waiting — only if it suits you.' } },
    ],
    question: { de: 'Wo stehst du gerade — zwischen ruhig und angespannt?', en: 'Where are you right now — between calm and tense?' },
    wesen: { de: 'Hey. Magst du kurz schauen, wie es dir geht?', en: 'Hey. Would you like to check how you are?' },
  },
  inward: {
    variants: [
      { de: { title: 'Nach innen spüren', text: 'Wie fühlt sich dein Körper gerade an? Du musst nichts ändern — nur kurz hinschauen.' }, en: { title: 'Feel inward', text: 'How does your body feel right now? You do not have to change anything — just look briefly.' } },
      { de: { title: 'Kurz zum Körper', text: 'Wo berühren deine Füße den Boden? Wo sitzt du gerade am schwersten?' }, en: { title: 'Briefly to the body', text: 'Where do your feet touch the ground? Where do you feel heaviest right now?' } },
      { de: { title: 'Ein kleiner Blick nach innen', text: 'Atem, Schultern, Hände — was fällt dir auf?' }, en: { title: 'A small look inside', text: 'Breath, shoulders, hands — what do you notice?' } },
    ],
    question: { de: 'Was spürst du gerade am deutlichsten im Körper?', en: 'What do you feel most clearly in your body right now?' },
    wesen: { de: 'Ich bin da. Spürst du deine Füße?', en: 'I am here. Can you feel your feet?' },
  },
  energy: {
    variants: [
      { de: { title: 'Energie-Check', text: 'Wie viel Energie hast du gerade? Auch dein Wesen schaut gern kurz mit dir hin.' }, en: { title: 'Energy check', text: 'How much energy do you have right now? Your companion likes to look along with you.' } },
      { de: { title: 'Wie voll ist der Akku?', text: 'Ein Blick auf deine Energie hilft, den Rest des Tages passend zu wählen.' }, en: { title: 'How full is the battery?', text: 'A look at your energy helps you choose what fits the rest of the day.' } },
      { de: { title: 'Kraft für jetzt', text: 'Wie viel Kraft ist gerade da — und was passt dazu?' }, en: { title: 'Strength for now', text: 'How much strength is here right now — and what fits it?' } },
    ],
    question: { de: 'Wie viel Energie hast du gerade, ungefähr?', en: 'About how much energy do you have right now?' },
    wesen: { de: 'Wie ist der Akku bei dir?', en: 'How is your battery?' },
  },
};

export type GentleForm = 'text' | 'frage' | 'wesen';
