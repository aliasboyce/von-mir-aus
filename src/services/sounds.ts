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
  // within ~20ms.
  filter.frequency.setValueAtTime(2200, now);
  filter.frequency.exponentialRampToValueAtTime(300, now + 0.03);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.22, now);
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

// Kept alive across the whole breathing exercise (not recreated per
// phase) so the pitch/volume can glide smoothly between phases
// instead of clicking on/off every 4 seconds.
let breathOsc: OscillatorNode | null = null;
let breathGain: GainNode | null = null;

/**
 * "Ein-/Ausatmen soll das Handy mitmachen lassen"-Auftrag — a low,
 * warm hum (not a melody, not a beep) that swells as the person
 * breathes in and eases back as they breathe out, mirroring the
 * growing/shrinking circle already on screen. Low frequencies and a
 * slow, humming quality are the closest a synthesized tone can get to
 * the calming, "vagus nerve" register the person asked for (think a
 * soft, sustained "mmm" rather than a chime) without needing a real
 * recorded nature sample.
 */
export function startBreathTone(phase: 'in' | 'out', durationSec: number, settings: Pick<UserSettings, 'soundsEnabled'>) {
  if (!settings.soundsEnabled) return;
  const audioCtx = getContext();
  if (!audioCtx) return;

  function schedule() {
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      if (!breathOsc || !breathGain) {
        breathOsc = audioCtx.createOscillator();
        breathGain = audioCtx.createGain();
        breathOsc.type = 'sine';
        breathOsc.frequency.value = 110;
        breathGain.gain.value = 0;
        breathOsc.connect(breathGain);
        breathGain.connect(audioCtx.destination);
        breathOsc.start(now);
      }
      // Breathing in: pitch and volume rise gently. Breathing out: both
      // ease back down. Always a soft, low register — never loud enough
      // to feel like a notification.
      const targetGain = phase === 'in' ? 0.05 : 0.02;
      const targetFreq = phase === 'in' ? 132 : 98;
      breathGain.gain.cancelScheduledValues(now);
      breathGain.gain.setValueAtTime(breathGain.gain.value, now);
      breathGain.gain.linearRampToValueAtTime(targetGain, now + durationSec * 0.7);
      breathOsc.frequency.cancelScheduledValues(now);
      breathOsc.frequency.setValueAtTime(breathOsc.frequency.value, now);
      breathOsc.frequency.linearRampToValueAtTime(targetFreq, now + durationSec * 0.9);
    } catch {
      // Sound is a pure nice-to-have — never let it break the actual
      // interaction it's attached to.
    }
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(schedule).catch(schedule);
  } else {
    schedule();
  }
}

/** Call when the breathing exercise closes/unmounts, so the hum doesn't
 * keep humming in the background after the person has moved on. */
export function stopBreathTone() {
  if (breathGain) {
    try {
      const now = breathGain.context.currentTime;
      breathGain.gain.cancelScheduledValues(now);
      breathGain.gain.setValueAtTime(breathGain.gain.value, now);
      breathGain.gain.linearRampToValueAtTime(0.0001, now + 0.3);
    } catch {
      // ignore
    }
  }
  const osc = breathOsc;
  window.setTimeout(() => {
    try {
      osc?.stop();
    } catch {
      // already stopped
    }
  }, 350);
  breathOsc = null;
  breathGain = null;
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
