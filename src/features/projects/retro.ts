import type { Lfn } from './ui';

/**
 * Die drei Abschlussfragen. Ausgewählt in Anlehnung an gängige Rückblick-Methoden (After-Action-Review,
 * Retrospektiven: „Was lief gut? Was war schwer? Was nehmen wir mit?“) und an Forschung zu Dankbarkeit/Würdigen
 * und Selbstmitgefühl: erst das Gelungene würdigen (statt sofort zu suchen, was fehlt), dann das Schwere ohne
 * Schuld anschauen, dann etwas mitnehmen und sich selbst etwas Freundliches sagen.
 * Jede Frage kann gegen eine andere aus ihrem Bereich getauscht werden – alles bleibt freiwillig.
 */
export interface ReflectionSlot { id: 'good' | 'hard' | 'carry'; options: { de: string; en: string }[] }

export const REFLECTION_SLOTS: ReflectionSlot[] = [
  {
    id: 'good',
    options: [
      { de: 'Was ist dir bei diesem Projekt besser gelungen, als du es dir zugetraut hättest – und was oder wer hat dir dabei geholfen?', en: 'What went better in this project than you thought you could manage – and what or who helped you with it?' },
      { de: 'Auf welchen Moment in diesem Projekt bist du besonders stolz – auch wenn er klein war?', en: 'Which moment in this project are you especially proud of – even if it was small?' },
      { de: 'Was hat dich überrascht – im Guten – an dir, an anderen oder an dem, was möglich war?', en: 'What surprised you – in a good way – about yourself, about others or about what was possible?' },
    ],
  },
  {
    id: 'hard',
    options: [
      { de: 'Was hat dich Kraft gekostet oder war schwerer als gedacht – und was würdest du beim nächsten Mal anders machen oder früher abgeben?', en: 'What cost you energy or was harder than expected – and what would you do differently next time, or hand over sooner?' },
      { de: 'Wo hast du gemerkt, dass du Pause oder Hilfe brauchst – und wie bist du damit umgegangen?', en: 'Where did you notice you needed a break or help – and how did you deal with it?' },
      { de: 'Was hat nicht so geklappt, wie du es dir vorgestellt hast – und was darfst du einfach so stehen lassen, ohne dir Vorwürfe zu machen?', en: 'What did not work out the way you imagined – and what may you simply leave as it is, without blaming yourself?' },
    ],
  },
  {
    id: 'carry',
    options: [
      { de: 'Was nimmst du aus diesem Projekt mit – für dich selbst oder für das nächste Vorhaben – und was möchtest du dir selbst dazu sagen?', en: 'What do you take with you from this project – for yourself or for the next undertaking – and what would you like to say to yourself about it?' },
      { de: 'Was würdest du einer Freundin oder einem Freund sagen, die/der dasselbe geschafft hätte? Und darfst du das auch zu dir sagen?', en: 'What would you say to a friend who had achieved the same? And may you say that to yourself, too?' },
      { de: 'Was hat sich durch dieses Projekt verändert – in deinem Alltag, in Beziehungen oder in deinem Gefühl für dich selbst?', en: 'What has changed through this project – in your everyday life, in relationships or in how you feel about yourself?' },
    ],
  },
];

export const defaultQuestions = (L: Lfn): string[] => REFLECTION_SLOTS.map((s) => L(s.options[0].de, s.options[0].en));

/** die nächste Frage desselben Bereichs (zum Tauschen) */
export function nextQuestion(slotIdx: number, current: string, L: Lfn): string {
  const opts = REFLECTION_SLOTS[slotIdx].options.map((o) => L(o.de, o.en));
  const i = opts.indexOf(current);
  return opts[(i + 1) % opts.length];
}

/** Liebe Worte vom Wesen – nacheinander, ruhig */
export const WESEN_CHEERS = (L: Lfn, title: string): string[] => [
  L(`Du hast es geschafft! „${title || 'Dein Projekt'}“ ist fertig. Ich bin so stolz auf dich – von ganzem Herzen. 🎉`, `You did it! “${title || 'Your project'}” is finished. I’m so proud of you – with my whole heart. 🎉`),
  L('Schau mal, was alles in diesem Projekt steckt. Das warst du – Schritt für Schritt, auch an Tagen, die schwer waren. 💛', 'Look at everything that is in this project. That was you – step by step, even on the hard days. 💛'),
  L('Du musst jetzt nichts mehr leisten. Atme, lass es sacken – und feiere dich so, wie es sich für dich gut anfühlt. ✨', 'You don’t have to achieve anything now. Breathe, let it sink in – and celebrate yourself in whatever way feels good. ✨'),
];
