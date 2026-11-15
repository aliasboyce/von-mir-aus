import type { AccessChannel } from '../../data/types';

/**
 * Zu jedem Zugangskanal ein Beispiel, damit man sich etwas darunter vorstellen kann:
 * „da“ = so fühlt es sich an, wenn der Zugang gerade vorhanden ist; „fehlt“ = so, wenn er gerade nicht erreichbar ist.
 * Gemeint ist immer das JETZT – nicht, ob man etwas grundsätzlich kann.
 */
export interface ChannelExample { there: string; missing: string }

export const CHANNEL_EXAMPLES: Record<AccessChannel, { de: ChannelExample; en: ChannelExample }> = {
  denken: {
    de: { there: 'Ich kann einen Gedanken zu Ende denken, etwas einordnen oder eine einfache Frage beantworten.', missing: 'Mein Kopf ist leer oder wie Nebel – oder die Gedanken rasen und lassen sich nicht ordnen. Worte finden fällt schwer.' },
    en: { there: 'I can finish a thought, sort something out or answer a simple question.', missing: 'My head is empty or foggy – or thoughts race and will not settle. Finding words is hard.' },
  },
  erinnerung: {
    de: { there: 'Ich weiß, wer ich bin und was ich schon erlebt habe – auch, dass es mir schon einmal besser ging.', missing: 'Nur das Jetzt (oder nur das Schlimme) ist da. Ich kann mich nicht daran erinnern, wie sich Ruhe oder Sicherheit anfühlt.' },
    en: { there: 'I know who I am and what I have lived through – including that I have felt better before.', missing: 'Only the now (or only the bad) is there. I cannot remember what calm or safety feels like.' },
  },
  fuehlen: {
    de: { there: 'Ich merke, wie mir ist – Freude, Ärger, Traurigkeit – und es bedeutet mir etwas.', missing: 'Ich fühle mich taub oder leer. Ich weiß vielleicht, dass etwas schön wäre, spüre es aber nicht. Oder es ist zu viel auf einmal.' },
    en: { there: 'I notice how I am – joy, anger, sadness – and it means something to me.', missing: 'I feel numb or empty. I may know something would be nice but cannot feel it. Or it is all too much at once.' },
  },
  koerper_innen: {
    de: { there: 'Ich spüre meinen Atem, mein Herz, Wärme, Hunger oder Müdigkeit.', missing: 'Mein Körper ist wie weg oder hinter Glas. Ich spüre nicht, was innen los ist.' },
    en: { there: 'I feel my breath, my heart, warmth, hunger or tiredness.', missing: 'My body feels gone or behind glass. I cannot feel what is going on inside.' },
  },
  sinne: {
    de: { there: 'Ich kann bewusst sehen, hören, riechen oder etwas anfassen – zum Beispiel eine kalte Tasse in der Hand spüren.', missing: 'Alles wirkt flach, unwirklich oder gedämpft – oder Geräusche und Licht sind zu viel.' },
    en: { there: 'I can deliberately see, hear, smell or touch – for example feel a cold cup in my hand.', missing: 'Everything seems flat, unreal or muffled – or sounds and light are too much.' },
  },
  aufmerksamkeit: {
    de: { there: 'Ich kann meinen Blick auf etwas richten und kurz dort bleiben, zum Beispiel drei Dinge im Raum benennen.', missing: 'Mein Blick bleibt nirgends hängen, springt hin und her oder ist wie festgefroren.' },
    en: { there: 'I can point my attention at something and stay for a moment, e.g. name three things in the room.', missing: 'My attention lands nowhere, jumps around or feels frozen.' },
  },
  bewegung: {
    de: { there: 'Ich kann mich bewegen: aufstehen, die Arme ausschütteln, ein paar Schritte gehen.', missing: 'Mein Körper ist schwer oder erstarrt – oder so unruhig, dass Bewegung nicht hilft.' },
    en: { there: 'I can move: stand up, shake out my arms, take a few steps.', missing: 'My body is heavy or frozen – or so restless that moving does not help.' },
  },
  ausfuehren: {
    de: { there: 'Ich kann etwas Kleines anfangen und zu Ende bringen, zum Beispiel ein Glas Wasser holen.', missing: 'Ich weiß, was zu tun wäre, komme aber nicht ins Tun.' },
    en: { there: 'I can start something small and finish it, e.g. fetch a glass of water.', missing: 'I know what I would need to do but cannot get started.' },
  },
  beziehung: {
    de: { there: 'Kontakt zu einem Menschen (oder Tier) geht – auch ohne viele Worte: eine Nachricht schreiben, Nähe aushalten.', missing: 'Kontakt ist gerade zu viel, zu weit weg oder fühlt sich unsicher an.' },
    en: { there: 'Contact with a person (or pet) works – even without many words: sending a message, bearing closeness.', missing: 'Contact is too much right now, too far away or feels unsafe.' },
  },
  ort_zeit: {
    de: { there: 'Ich weiß, wo ich bin und welcher Tag und welche Uhrzeit ungefähr ist.', missing: 'Ort und Zeit verschwimmen – „Wo bin ich? Wie spät ist es?“' },
    en: { there: 'I know where I am and roughly what day and time it is.', missing: 'Place and time blur – “Where am I? What time is it?”' },
  },
};
