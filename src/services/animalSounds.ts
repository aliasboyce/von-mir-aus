/**
 * Leise Tierlaute – für die Tier-Begleiter statt der Wesen-Töne.
 * Alles wird live synthetisiert (keine Audiodateien): weiche Einsätze, tiefpassgefiltert, sehr leise, kurz.
 * Nichts davon soll erschrecken – eher ein kleines „Hallo“ je Tierart. Höhen bleiben unter ~2,8 kHz.
 */

type Kind = 'tap' | 'wake' | 'sleep';

interface Note {
  /** start offset in s */
  at: number;
  f0: number;
  f1?: number;
  dur: number;
  gain: number;
  type?: OscillatorType;
  vib?: [number, number]; // Hz, depth in Hz
  lp?: number;
  /** adds a soft breathy noise puff of this relative gain */
  breath?: number;
}

const n = (at: number, f0: number, f1: number | undefined, dur: number, gain: number, extra: Partial<Note> = {}): Note => ({ at, f0, f1, dur, gain, ...extra });

/** one pattern per species (or family); frequencies in Hz */
const VOICES: Record<string, Note[]> = {
  // dogs: a tiny soft "wuff" (two quiet low puffs)
  dog: [n(0, 300, 190, 0.13, 0.05, { type: 'triangle', lp: 900, breath: 0.5 }), n(0.17, 270, 180, 0.11, 0.04, { type: 'triangle', lp: 900, breath: 0.4 })],
  wolf: [n(0, 260, 340, 0.45, 0.035, { vib: [5, 6], lp: 1100 }), n(0.4, 340, 250, 0.5, 0.03, { vib: [5, 8], lp: 1100 })],
  katze: [n(0, 430, 600, 0.16, 0.045, { type: 'triangle', lp: 1800 }), n(0.15, 600, 520, 0.2, 0.04, { type: 'triangle', lp: 1800, vib: [24, 18] })],
  eule: [n(0, 340, 310, 0.28, 0.04, { lp: 900 }), n(0.36, 340, 300, 0.34, 0.04, { lp: 900 })],
  kraehe: [n(0, 320, 260, 0.1, 0.03, { type: 'triangle', lp: 1000, vib: [38, 30] }), n(0.14, 300, 240, 0.12, 0.028, { type: 'triangle', lp: 1000, vib: [38, 30] })],
  esel: [n(0, 520, 330, 0.3, 0.035, { lp: 1200, vib: [7, 10] }), n(0.3, 330, 520, 0.28, 0.032, { lp: 1200, vib: [7, 10] })],
  otter: [n(0, 900, 1250, 0.07, 0.03, { lp: 2400 }), n(0.1, 950, 1300, 0.07, 0.028, { lp: 2400 }), n(0.2, 880, 1180, 0.08, 0.026, { lp: 2400 })],
  erdmaennchen: [n(0, 1050, 1250, 0.05, 0.022, { lp: 2600 }), n(0.08, 1100, 1300, 0.05, 0.022, { lp: 2600 }), n(0.16, 1000, 1200, 0.06, 0.02, { lp: 2600 })],
  schweinchen: [n(0, 170, 140, 0.2, 0.05, { type: 'triangle', lp: 700, breath: 0.7 }), n(0.26, 180, 145, 0.18, 0.04, { type: 'triangle', lp: 700, breath: 0.6 })],
  axolotl: [n(0, 320, 760, 0.09, 0.04, { lp: 1800 }), n(0.16, 280, 640, 0.1, 0.034, { lp: 1800 })],
  baer: [n(0, 120, 100, 0.55, 0.04, { lp: 500, vib: [6, 4] })],
  gans: [n(0, 400, 360, 0.1, 0.03, { type: 'triangle', lp: 1000, vib: [28, 20] }), n(0.15, 380, 340, 0.12, 0.028, { type: 'triangle', lp: 1000, vib: [28, 20] })],
  einhorn: [n(0, 784, undefined, 0.16, 0.03, { lp: 2400 }), n(0.12, 988, undefined, 0.16, 0.028, { lp: 2400 }), n(0.24, 1175, undefined, 0.22, 0.025, { lp: 2600 })],
  papagei: [n(0, 1250, 1650, 0.09, 0.022, { lp: 2600, vib: [26, 40] }), n(0.14, 1500, 1200, 0.1, 0.02, { lp: 2600, vib: [26, 40] })],
  drache: [n(0, 150, 130, 0.5, 0.045, { type: 'triangle', lp: 600, vib: [20, 10], breath: 0.6 })],
  dino: [n(0, 150, 105, 0.5, 0.04, { lp: 500, vib: [6, 5] })],
  eisvogel: [n(0, 2100, 2500, 0.07, 0.014, { lp: 2800 }), n(0.12, 2300, 2000, 0.08, 0.012, { lp: 2800 })],
  piepmatz: [n(0, 1900, 2400, 0.05, 0.016, { lp: 2800 }), n(0.08, 2100, 2500, 0.05, 0.016, { lp: 2800 }), n(0.17, 1800, 2300, 0.07, 0.014, { lp: 2800 })],
};
const FAMILY: Record<string, string> = { hund: 'dog', pudel: 'dog', labrador: 'dog', collie: 'dog', corgi: 'dog', glueckskatze: 'katze' };

export function animalVoice(species: string | undefined): Note[] | undefined {
  if (!species) return undefined;
  return VOICES[FAMILY[species] ?? species];
}

let noise: AudioBuffer | null = null;
function noiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noise && noise.sampleRate === ctx.sampleRate) return noise;
  const len = Math.floor(ctx.sampleRate * 0.6);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  noise = buf;
  return buf;
}

function playNote(ctx: AudioContext, out: AudioNode, t0: number, note: Note, pitch: number, time: number, vol: number) {
  const start = t0 + note.at * time;
  const dur = note.dur * time;
  const peak = note.gain * vol;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = Math.min(2900, (note.lp ?? 1500) * Math.max(0.8, pitch));
  osc.type = note.type ?? 'sine';
  osc.frequency.setValueAtTime(note.f0 * pitch, start);
  if (note.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(40, note.f1 * pitch), start + dur * 0.9);
  const atk = Math.max(0.014, dur * 0.28);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peak, start + atk);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  let lfo: OscillatorNode | undefined;
  if (note.vib) {
    lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = note.vib[0];
    lg.gain.value = note.vib[1] * pitch;
    lfo.connect(lg);
    lg.connect(osc.frequency);
    lfo.start(start);
    lfo.stop(start + dur + 0.05);
  }
  osc.connect(lp);
  lp.connect(gain);
  gain.connect(out);
  osc.start(start);
  osc.stop(start + dur + 0.05);
  if (note.breath) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 700;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peak * note.breath * 0.6, start + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(f);
    f.connect(g);
    g.connect(out);
    src.start(start, Math.random() * 0.2);
    src.stop(start + dur + 0.05);
  }
}

/** schedule the quiet voice of a species; returns false when the species has none */
export function scheduleAnimalVoice(ctx: AudioContext, species: string | undefined, kind: Kind): boolean {
  const notes = animalVoice(species);
  if (!notes) return false;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -24;
  limiter.ratio.value = 12;
  limiter.connect(ctx.destination);
  const jitter = 1 + (Math.random() - 0.5) * 0.08; // never twice exactly alike
  const t0 = ctx.currentTime + 0.01;
  if (kind === 'sleep') {
    // a slow, lower, sleepy version of its voice
    notes.forEach((x) => playNote(ctx, limiter, t0, x, 0.82 * jitter, 1.7, 0.7));
  } else if (kind === 'wake') {
    // just its first little sound, soft
    playNote(ctx, limiter, t0, notes[0], 1.04 * jitter, 1.05, 0.8);
  } else {
    notes.forEach((x) => playNote(ctx, limiter, t0, x, jitter, 1, 1));
  }
  return true;
}
