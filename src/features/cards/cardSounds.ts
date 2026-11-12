import { getPrefs } from './cardStore';

/**
 * Leise, weiche Geräusche nur für das Sammelalbum: Blättern, Karte umdrehen, ein kleines Funkeln bei
 * limitierten Karten. Alles selbst erzeugt (kein Ton-File), sehr leise, und mit einem Schalter abstellbar.
 */
let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!C) return null;
  if (!ctx || ctx.state === 'closed') ctx = new C();
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
  return ctx;
}

let appSoundsOn = true;
/** vom Album gesetzt: die App-weite Ton-Einstellung */
export function setAppSounds(on: boolean) {
  appSoundsOn = on;
}
function allowed(): boolean {
  try {
    return appSoundsOn && getPrefs().sound;
  } catch {
    return false;
  }
}

function noiseSweep(c: AudioContext, from: number, to: number, dur: number, gain: number) {
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 0.9;
  f.frequency.setValueAtTime(from, c.currentTime);
  f.frequency.exponentialRampToValueAtTime(to, c.currentTime + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + dur * 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start();
}

export function playPageTurn() {
  if (!allowed()) return;
  const c = audio();
  if (!c) return;
  noiseSweep(c, 2600, 700, 0.32, 0.06);
}
export function playCardFlip() {
  if (!allowed()) return;
  const c = audio();
  if (!c) return;
  noiseSweep(c, 3200, 1500, 0.14, 0.05);
}
/** Funkeln: vier hohe, weiche Töne hintereinander */
export function playSparkle() {
  if (!allowed()) return;
  const c = audio();
  if (!c) return;
  [1568, 1976, 2349, 2637].forEach((hz, i) => {
    const t0 = c.currentTime + i * 0.07;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = hz;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.028, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + 0.5);
  });
}
