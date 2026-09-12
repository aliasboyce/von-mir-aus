export interface GroundingStepContent {
  id: string;
  text: string;
  textEn: string;
  hasInput: boolean;
  isBreath?: boolean;
}

/**
 * Migrated from the old static t.companion.groundingSteps i18n array so
 * each step can now be individually toggled on/off (see
 * groundingManagement.ts) — the same "verwaltbar" capability the other
 * three Wesen-Inhalte tabs already have.
 *
 * 'intro' and 'closing' stay pinned first/last (an arrival moment
 * followed later by a deliberate finishing line only make sense in
 * those positions) — everything in between, including the sensory
 * steps and the breath step, can be freely reordered by the person
 * (see moveBuiltinGroundingStep in groundingManagement.ts), since which
 * sense to check in with first is genuinely a matter of personal
 * preference.
 */
export const GROUNDING_STEPS: GroundingStepContent[] = [
  { id: 'intro', text: 'Okay. Wir gehen das ganz langsam an, ein kleiner Schritt nach dem anderen. Du kannst jederzeit weitermachen oder aufhören.', textEn: "Okay. We'll take this slowly, one small step at a time. You can keep going or stop at any point.", hasInput: false },
  { id: 'where', text: 'Wo bist du gerade — welcher Raum, welcher Ort?', textEn: 'Where are you right now — which room, which place?', hasInput: false },
  { id: 'place-kind', text: 'Was kannst du über diesen Ort sagen? Groß, klein, hell, vertraut?', textEn: 'What can you say about this place? Big, small, bright, familiar?', hasInput: false },
  { id: 'see', text: 'Schau dich kurz um: Was siehst du? Ein paar Dinge reichen schon.', textEn: 'Look around for a moment: what do you see? A couple of things is plenty.', hasInput: true },
  { id: 'colors', text: 'Welche Farben siehst du gerade um dich herum?', textEn: 'What colors do you see around you right now?', hasInput: true },
  { id: 'hear-near', text: 'Was kannst du gerade hören, das nah bei dir ist?', textEn: "What can you hear right now that's close by?", hasInput: true },
  { id: 'hear-far', text: 'Gibt es auch Geräusche, die weiter weg sind?', textEn: 'Are there any sounds further away too?', hasInput: true },
  { id: 'touch', text: 'Was berührt gerade deinen Körper — der Stuhl, der Boden, ein Stoff?', textEn: 'What is touching your body right now — the chair, the floor, some fabric?', hasInput: true },
  { id: 'feet', text: 'Wo befinden sich gerade deine Füße?', textEn: 'Where are your feet right now?', hasInput: true },
  { id: 'hands', text: 'Wo befinden sich gerade deine Hände?', textEn: 'Where are your hands right now?', hasInput: true },
  { id: 'temperature', text: 'Wie fühlt sich die Temperatur gerade an — eher warm, eher kühl?', textEn: 'How does the temperature feel right now — warmer, cooler?', hasInput: true },
  { id: 'smell', text: 'Was kannst du gerade riechen?', textEn: 'What can you smell right now?', hasInput: true },
  { id: 'taste', text: 'Was schmeckst du gerade, oder was könntest du dir schmecken lassen?', textEn: 'What do you taste right now, or what could you treat yourself to?', hasInput: true },
  { id: 'day-season', text: 'Welcher Tag ist heute ungefähr, und welche Jahreszeit gerade?', textEn: 'Roughly what day is it today, and what season?', hasInput: false },
  { id: 'age', text: 'Wie alt bist du heute?', textEn: 'How old are you today?', hasInput: false },
  { id: 'here-now', text: 'Was zeigt dir gerade, dass du hier bist — genau jetzt, nicht damals?', textEn: "What shows you that you're here right now — not back then?", hasInput: true },
  { id: 'breath', text: '', textEn: '', hasInput: false, isBreath: true },
  { id: 'closing', text: 'Du bist hier. Jetzt. Das reicht für diesen Moment.', textEn: "You're here. Now. That's enough for this moment.", hasInput: false },
];
