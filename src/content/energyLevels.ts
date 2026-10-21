/**
 * "4 verschiedene Energielevel anstatt 3, jeweils mit konkreten
 * Beschreibungen, wie man sich bei diesem Level fuehlt, damit man es
 * besser einschaetzen kann"-Auftrag — the ONE definition used by the
 * filter, the resource/Hilfsmittel/Skill forms and the bridge levels.
 * Energy is deliberately not arousal: someone can be wide awake and
 * jittery with almost no usable energy, or calm with plenty. The
 * descriptions therefore speak about what is doable, not about the
 * nervous-system zone.
 */
export type EnergyLevel = 1 | 2 | 3 | 4;

export interface EnergyLevelInfo {
  level: EnergyLevel;
  icon: string;
  de: { label: string; feel: string };
  en: { label: string; feel: string };
}

export const ENERGY_LEVELS: EnergyLevelInfo[] = [
  {
    level: 1,
    icon: '🔋',
    de: {
      label: 'Fast nichts da',
      feel: 'Alles ist schwer. Aufstehen, sprechen oder entscheiden kostet schon viel. Der Körper fühlt sich schwer oder leer an, Gedanken sind zäh. Möglich ist nur das Allernötigste — im Liegen oder Sitzen, ohne Anleitung lesen zu müssen.',
    },
    en: {
      label: 'Almost nothing left',
      feel: 'Everything is heavy. Getting up, talking or deciding already costs a lot. The body feels heavy or empty, thoughts are sluggish. Only the bare minimum is possible — lying or sitting, without having to read instructions.',
    },
  },
  {
    level: 2,
    icon: '🔋🔋',
    de: {
      label: 'Wenig',
      feel: 'Kleine Dinge gehen, aber alles braucht Anlauf. Ich schaffe ein paar Minuten, brauche Pausen und möchte nicht lange nachdenken oder planen müssen. Ein Schritt nach dem anderen.',
    },
    en: {
      label: 'A little',
      feel: 'Small things work, but everything needs a run-up. I can manage a few minutes, need breaks and do not want to think or plan for long. One step at a time.',
    },
  },
  {
    level: 3,
    icon: '🔋🔋🔋',
    de: {
      label: 'Mittel',
      feel: 'Ich bin ansprechbar und kann mich eine Zeit lang auf eine Sache konzentrieren. Alltag geht, aber nicht alles gleichzeitig. Bewegung, ein Gespräch oder eine kleine Aufgabe sind möglich.',
    },
    en: {
      label: 'Medium',
      feel: 'I am responsive and can focus on one thing for a while. Daily life works, but not everything at once. Movement, a conversation or a small task are possible.',
    },
  },
  {
    level: 4,
    icon: '🔋🔋🔋🔋',
    de: {
      label: 'Viel',
      feel: 'Ich fühle mich wach, klar und beweglich — nicht aufgedreht, sondern kräftig. Ich kann planen, anfangen und dranbleiben, auch bei Dingen, die Mut oder Anstrengung kosten.',
    },
    en: {
      label: 'A lot',
      feel: 'I feel awake, clear and mobile — not wired, but strong. I can plan, start and keep going, even with things that take courage or effort.',
    },
  },
];

export function energyInfo(level: EnergyLevel, lang: 'de' | 'en') {
  const e = ENERGY_LEVELS.find((x) => x.level === level);
  return e ? { icon: e.icon, ...(lang === 'en' ? e.en : e.de) } : null;
}
