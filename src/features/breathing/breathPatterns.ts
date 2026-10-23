/**
 * Breathing patterns, each as a looping list of phases. `from`/`to` are the lung level (0 = empty, 1 = full)
 * at the start/end of a phase – the one number that all animations (circle, wave, square, the Wesen) follow.
 *
 * What is behind them (researched, kept honest):
 *  - "Seufzer-Atmen" (cyclic sighing): Balban et al. 2023, Cell Reports Medicine – 108 adults, 5 min daily for
 *    28 days; mood rose more than with mindfulness and the breathing rate fell most.
 *  - about 6 breaths/min (individually 4.5–7): breathing, heartbeat and blood-pressure regulation swing together
 *    (heart rate variability); the best-documented slow pattern (Steffen et al. 2017 and the HRV-biofeedback literature).
 *  - box and 4‑7‑8: weaker evidence; what seems to matter more is the slow rate and the long exhale than the holds.
 *  - cautions (trauma-informed): inward breath focus and holds can be too much for some people → always optional,
 *    holds can be left out, eyes stay open, stopping is always possible.
 */
export type PhaseKind = 'in' | 'top' | 'hold' | 'out';
export interface BreathPhase {
  kind: PhaseKind;
  sec: number;
  from: number;
  to: number;
  hint?: string;
  hintEn?: string;
}
export type Evidence = 'good' | 'some' | 'little';
export type BreathVisual = 'circle' | 'wave' | 'box';

export interface BreathPattern {
  id: string;
  emoji: string;
  title: string;
  titleEn: string;
  short: string;
  shortEn: string;
  how: string;
  howEn: string;
  evidence: Evidence;
  evidenceNote: string;
  evidenceNoteEn: string;
  phases: BreathPhase[];
  defaultMinutes: number;
  defaultVisual: BreathVisual;
}

export const BREATH_PATTERNS: BreathPattern[] = [
  {
    id: 'sigh',
    emoji: '😮‍💨',
    title: 'Seufzer-Atmen',
    titleEn: 'Sigh breathing',
    short: 'Zweimal kurz ein, ein langer Seufzer aus.',
    shortEn: 'Two short breaths in, one long sigh out.',
    how: 'Durch die Nase einatmen, dann gleich ein zweites, kleines „Nachfüllen“. Danach lang und leise durch den Mund ausseufzen.',
    howEn: 'Breathe in through the nose, then straight away a second, small top-up. Then sigh out long and quietly through the mouth.',
    evidence: 'good',
    evidenceNote: 'In einer Studie der Stanford University (2023, 108 Erwachsene, 5 Minuten täglich über 4 Wochen) hob diese Übung die Stimmung stärker als eine Achtsamkeitsübung und senkte die Atemfrequenz am meisten.',
    evidenceNoteEn: 'In a Stanford University study (2023, 108 adults, 5 minutes daily for 4 weeks) this exercise lifted mood more than a mindfulness exercise and lowered the breathing rate most.',
    phases: [
      { kind: 'in', sec: 2, from: 0, to: 0.78, hint: 'durch die Nase', hintEn: 'through the nose' },
      { kind: 'top', sec: 1, from: 0.78, to: 1, hint: 'noch ein kleines Stück', hintEn: 'one small top-up' },
      { kind: 'out', sec: 6, from: 1, to: 0, hint: 'lang durch den Mund', hintEn: 'long through the mouth' },
    ],
    defaultMinutes: 2,
    defaultVisual: 'circle',
  },
  {
    id: 'six',
    emoji: '🌊',
    title: 'Ruhig atmen – 6 pro Minute',
    titleEn: 'Calm breathing – 6 per minute',
    short: 'Gleich lang ein und aus, in einem ruhigen Wellenrhythmus.',
    shortEn: 'Equally long in and out, in a calm wave rhythm.',
    how: 'Fünf Sekunden ein, fünf Sekunden aus – ohne Anstrengung, nicht zu tief. Die Welle trägt dich.',
    howEn: 'Five seconds in, five seconds out – without effort, not too deep. The wave carries you.',
    evidence: 'good',
    evidenceNote: 'Etwa 6 Atemzüge pro Minute (bei Menschen unterschiedlich, 4,5 bis 7) bringen Atmung, Herzschlag und Blutdruckregelung in einen gemeinsamen Rhythmus (Herzratenvariabilität). Das ist das am besten belegte langsame Muster.',
    evidenceNoteEn: 'About 6 breaths per minute (it differs between people, 4.5 to 7) bring breathing, heartbeat and blood-pressure regulation into a shared rhythm (heart rate variability). It is the best-documented slow pattern.',
    phases: [
      { kind: 'in', sec: 5, from: 0, to: 1 },
      { kind: 'out', sec: 5, from: 1, to: 0 },
    ],
    defaultMinutes: 3,
    defaultVisual: 'wave',
  },
  {
    id: 'long-out',
    emoji: '🍃',
    title: 'Länger aus als ein',
    titleEn: 'Longer out than in',
    short: 'Kurz ein, lang aus – der Ausatem darf sich dehnen.',
    shortEn: 'Short in, long out – the exhale may stretch.',
    how: 'Vier Sekunden ein, sechs Sekunden aus. Wenn sechs zu lang ist, nimm weniger.',
    howEn: 'Four seconds in, six seconds out. If six is too long, take fewer.',
    evidence: 'some',
    evidenceNote: 'Ein verlängertes Ausatmen verlangsamt die Atmung insgesamt. Die Atemfrequenz scheint wichtiger zu sein als das genaue Verhältnis.',
    evidenceNoteEn: 'A longer exhale slows breathing overall. The breathing rate seems to matter more than the exact ratio.',
    phases: [
      { kind: 'in', sec: 4, from: 0, to: 1 },
      { kind: 'out', sec: 6, from: 1, to: 0 },
    ],
    defaultMinutes: 2,
    defaultVisual: 'circle',
  },
  {
    id: 'lips',
    emoji: '😗',
    title: 'Lippenbremse',
    titleEn: 'Pursed lips',
    short: 'Durch die Nase ein, durch fast geschlossene Lippen aus.',
    shortEn: 'In through the nose, out through nearly closed lips.',
    how: 'Zwei Sekunden durch die Nase ein, vier Sekunden durch locker gespitzte Lippen aus – wie beim Kerzenflackern, ohne sie auszublasen.',
    howEn: 'Two seconds in through the nose, four seconds out through loosely pursed lips – as if making a candle flicker without blowing it out.',
    evidence: 'some',
    evidenceNote: 'In der Atemtherapie seit langem üblich, weil sie das Ausatmen verlangsamt. Ein guter, kurzer Einstieg, wenn es hektisch ist.',
    evidenceNoteEn: 'Long used in breathing therapy because it slows the exhale. A good, short start when things are hectic.',
    phases: [
      { kind: 'in', sec: 2, from: 0, to: 1, hint: 'durch die Nase', hintEn: 'through the nose' },
      { kind: 'out', sec: 4, from: 1, to: 0, hint: 'durch gespitzte Lippen', hintEn: 'through pursed lips' },
    ],
    defaultMinutes: 1,
    defaultVisual: 'circle',
  },
  {
    id: 'box',
    emoji: '⬜',
    title: 'Quadrat-Atmung',
    titleEn: 'Square breathing',
    short: 'Vier Seiten, vier Sekunden: ein, halten, aus, halten.',
    shortEn: 'Four sides, four seconds: in, hold, out, hold.',
    how: 'Ein Punkt wandert am Quadrat entlang. Die „Halten“-Seiten kannst du jederzeit weglassen – dann bleibt eine ruhige Ein-Aus-Welle.',
    howEn: 'A dot travels around a square. You can leave out the “hold” sides at any time – a calm in-out wave remains.',
    evidence: 'little',
    evidenceNote: 'Gut verträglich, aber weniger gut untersucht. In Vergleichen wirkte ruhiges Atmen mit etwa 6 pro Minute auf die Herzratenvariabilität stärker. Das Halten kann sich für manche zu viel anfühlen.',
    evidenceNoteEn: 'Well tolerated but less well studied. In comparisons calm breathing at about 6 per minute had a stronger effect on heart rate variability. Holding can feel like too much for some.',
    phases: [
      { kind: 'in', sec: 4, from: 0, to: 1 },
      { kind: 'hold', sec: 4, from: 1, to: 1 },
      { kind: 'out', sec: 4, from: 1, to: 0 },
      { kind: 'hold', sec: 4, from: 0, to: 0 },
    ],
    defaultMinutes: 2,
    defaultVisual: 'box',
  },
  {
    id: '478',
    emoji: '🌙',
    title: '4‑7‑8',
    titleEn: '4‑7‑8',
    short: 'Vier ein, sieben halten, acht aus – eher für abends.',
    shortEn: 'Four in, seven hold, eight out – more for the evening.',
    how: 'Das Halten ist hier lang. Du kannst es verkürzen oder ganz weglassen und nur das lange Ausatmen behalten.',
    howEn: 'The hold is long here. You can shorten it or leave it out entirely and keep just the long exhale.',
    evidence: 'little',
    evidenceNote: 'Wenig untersucht; in einem Vergleich war die Wirkung auf die Herzratenvariabilität geringer als bei ruhigem Atmen. Wenn das lange Halten unangenehm ist: weglassen.',
    evidenceNoteEn: 'Little studied; in one comparison the effect on heart rate variability was smaller than with calm breathing. If the long hold is unpleasant: leave it out.',
    phases: [
      { kind: 'in', sec: 4, from: 0, to: 1 },
      { kind: 'hold', sec: 7, from: 1, to: 1 },
      { kind: 'out', sec: 8, from: 1, to: 0 },
    ],
    defaultMinutes: 2,
    defaultVisual: 'circle',
  },
  {
    id: 'hum',
    emoji: '🐝',
    title: 'Summen beim Ausatmen',
    titleEn: 'Humming exhale',
    short: 'Beim Ausatmen leise „mmm“ – die Vibration spüren.',
    shortEn: 'Hum a quiet “mmm” on the exhale – feel the vibration.',
    how: 'Vier Sekunden durch die Nase ein, acht Sekunden leise summen. Du kannst die Hand auf Brust oder Wange legen und das Kribbeln spüren.',
    howEn: 'Four seconds in through the nose, eight seconds of quiet humming. You can rest a hand on chest or cheek and feel the tingling.',
    evidence: 'little',
    evidenceNote: 'Wenig erforscht. Viele Menschen mögen das Spüren der Vibration; es kann ein sanfter Weg sein, im Körper anzukommen. Kein Muss.',
    evidenceNoteEn: 'Little researched. Many people like feeling the vibration; it can be a gentle way to arrive in the body. Not a must.',
    phases: [
      { kind: 'in', sec: 4, from: 0, to: 1, hint: 'durch die Nase', hintEn: 'through the nose' },
      { kind: 'out', sec: 8, from: 1, to: 0, hint: 'leise summen: mmm', hintEn: 'hum quietly: mmm' },
    ],
    defaultMinutes: 2,
    defaultVisual: 'circle',
  },
];

export function patternById(id: string): BreathPattern | undefined {
  return BREATH_PATTERNS.find((p) => p.id === id);
}

export function phasesFor(p: BreathPattern, skipHolds: boolean): BreathPhase[] {
  return skipHolds ? p.phases.filter((x) => x.kind !== 'hold') : p.phases;
}

export function hasHolds(p: BreathPattern): boolean {
  return p.phases.some((x) => x.kind === 'hold');
}

export function cycleSeconds(phases: BreathPhase[]): number {
  return phases.reduce((s, x) => s + x.sec, 0);
}

const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, x)));

/** Position inside the looping cycle at time t (seconds, may be negative – the cycle simply continues backwards). */
export function locate(phases: BreathPhase[], t: number): { index: number; progress: number; level: number; secLeft: number; cycleFraction: number } {
  const total = cycleSeconds(phases);
  const tt = ((t % total) + total) % total;
  let acc = 0;
  for (let i = 0; i < phases.length; i++) {
    const ph = phases[i];
    if (tt < acc + ph.sec || i === phases.length - 1) {
      const progress = Math.min(1, (tt - acc) / ph.sec);
      // a hold keeps its level; in/out ease softly at both ends so the motion never jerks
      const level = ph.from + (ph.to - ph.from) * (ph.kind === 'top' ? progress : ease(progress));
      return { index: i, progress, level, secLeft: ph.sec - (tt - acc), cycleFraction: tt / total };
    }
    acc += ph.sec;
  }
  return { index: 0, progress: 0, level: 0, secLeft: 0, cycleFraction: 0 };
}
