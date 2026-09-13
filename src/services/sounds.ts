import type { UserSettings } from '../data/types';

/**
 * "Leichte sanfte Toene / ASMR-Klick"-Auftrag — a pure sine "beep" (the
 * first version) reads as a tone/notification, not a click, and was
 * reported as actively unpleasant. A real mechanical click sound is
 * mostly a short burst of filtered noise (like a soft keyboard or
 * camera-shutter click), not a musical pitch — so the everyday
 * per-button sound is built from filtered white noise through a
 * lowpass filter with a very fast decay, giving a soft "tick" rather
 * than a beep. The two rarer completion tones (finishing a Zugang
 * pass, saving a bridge) keep a very soft sine underneath for a touch
 * of warmth, but quieter and slower than a notification chime.
 */
type SoundKind = 'click' | 'select' | 'settle';

let ctx: AudioContext | null = null;
function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

/**
 * "Klick-Sound ist verzoegert"-Auftrag — resuming a suspended
 * AudioContext is async (audioCtx.resume() returns a promise), so
 * scheduling a sound right after calling resume() means waiting for
 * that promise on every tap where the context happened to be
 * suspended — which on mobile can be most or all taps, since phones
 * aggressively suspend audio contexts between interactions. Calling
 * this once, as early as possible (the very first pointerdown
 * anywhere, before any sound actually needs to play), gets the
 * context running ahead of time so the actual click sound later can
 * skip the resume-and-wait step entirely and schedule synchronously.
 */
export function warmUpAudio() {
  const audioCtx = getContext();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      // best-effort warmup; a real tap's own resume() call is the fallback
    });
  }
}

// A short buffer of white noise, generated once and reused for every
// click — cheaper than building a new buffer per tap, and the buffer
// itself is inaudible until shaped by the filter+envelope below.
let noiseBuffer: AudioBuffer | null = null;
function getNoiseBuffer(audioCtx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const length = Math.floor(audioCtx.sampleRate * 0.05);
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buffer;
  return buffer;
}

function scheduleClick(audioCtx: AudioContext) {
  const now = audioCtx.currentTime;
  const source = audioCtx.createBufferSource();
  source.buffer = getNoiseBuffer(audioCtx);
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  // Sweeping the cutoff down very quickly is what makes filtered noise
  // read as a "click" rather than a hiss — most of the energy is gone
  // within ~20ms. Cutoff lowered further (1600->300 instead of
  // 2200->300) and gain lowered (0.22->0.13) — softer overall per
  // direct feedback.
  filter.frequency.setValueAtTime(1600, now);
  filter.frequency.exponentialRampToValueAtTime(300, now + 0.03);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.13, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  source.start(now);
  source.stop(now + 0.05);
}

function scheduleTone(audioCtx: AudioContext, freq: number, duration: number) {
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

/**
 * "Wesen-Toene beim Antippen/Schlafen/Aufwecken"-Auftrag — three
 * short, warm, vaguely vocal-like blips in the spirit of a Minecraft
 * villager "hmm" (a few short pitched tone bursts, not a melody, not
 * a chime). Built from a handful of very short triangle-wave notes
 * with soft envelopes; triangle instead of sine gives a slightly
 * rounder, "vocal" character without needing any recorded sample.
 */
function scheduleBlip(audioCtx: AudioContext, startAt: number, freq: number, duration: number, gainPeak: number) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, startAt);
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(gainPeak, startAt + duration * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

/** Tapped/tickled — a tiny, quick giggle: three short rising blips. */
function scheduleGiggle(audioCtx: AudioContext) {
  const now = audioCtx.currentTime;
  const notes = [330, 392, 440];
  notes.forEach((freq, i) => scheduleBlip(audioCtx, now + i * 0.09, freq, 0.09, 0.06));
}

/** Put to sleep — a single soft, descending sigh. */
function scheduleSleepSigh(audioCtx: AudioContext) {
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(160, now + 0.5);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.06, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.6);
}

/** Waking up — a short, questioning "hmm?": low, rising slightly at the end. */
function scheduleWakeHmm(audioCtx: AudioContext) {
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(210, now);
  osc.frequency.setValueAtTime(210, now + 0.18);
  osc.frequency.linearRampToValueAtTime(260, now + 0.32);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.07, now + 0.06);
  gain.gain.setValueAtTime(0.07, now + 0.22);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.4);
}

type CompanionSoundKind = 'giggle' | 'sleep' | 'wake';

export function playCompanionSound(kind: CompanionSoundKind, settings: Pick<UserSettings, 'soundsEnabled'>) {
  if (!settings.soundsEnabled) return;
  const audioCtx = getContext();
  if (!audioCtx) return;
  function schedule() {
    if (!audioCtx) return;
    try {
      if (kind === 'giggle') scheduleGiggle(audioCtx);
      else if (kind === 'sleep') scheduleSleepSigh(audioCtx);
      else scheduleWakeHmm(audioCtx);
    } catch {
      // nice-to-have only
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(schedule).catch(schedule);
  } else {
    schedule();
  }
}

export function playSound(kind: SoundKind, settings: Pick<UserSettings, 'soundsEnabled'>) {
  if (!settings.soundsEnabled) return;
  const audioCtx = getContext();
  if (!audioCtx) return;

  function schedule() {
    if (!audioCtx) return;
    try {
      if (kind === 'click') scheduleClick(audioCtx);
      else if (kind === 'select') scheduleTone(audioCtx, 660, 0.18);
      else scheduleTone(audioCtx, 520, 0.3);
    } catch {
      // Sound is a pure nice-to-have — never let it break the actual
      // interaction it's attached to.
    }
  }

  // Browsers suspend a freshly-created (or backgrounded) AudioContext
  // until a user gesture resumes it. resume() is async — scheduling
  // immediately without waiting for it meant the very first tap (and
  // sometimes every tap) was silently dropped on many phones.
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(schedule).catch(schedule);
  } else {
    schedule();
  }
}
