import type { UserSettings } from '../data/types';

/**
 * "Leichte sanfte Toene"-Auftrag — explicitly NOT loud/startling
 * sounds. Generates a very short, soft sine-wave tone with a gentle
 * fade-in/out envelope (avoids any click/pop from an abrupt start or
 * stop) using the Web Audio API directly, so there's no audio file to
 * source, host, or license, and the bundle size stays unaffected.
 * Off by default (settings.soundsEnabled), matching the stated "app
 * should be as quiet as possible" preference.
 */
type SoundKind = 'select' | 'settle';

// Reused across calls rather than creating a new context every time —
// browsers cap how many AudioContexts can exist at once, and reusing
// one is also simply cheaper.
let ctx: AudioContext | null = null;
function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

const FREQ: Record<SoundKind, number> = {
  select: 660,
  settle: 520,
};

export function playSound(kind: SoundKind, settings: Pick<UserSettings, 'soundsEnabled'>) {
  if (!settings.soundsEnabled) return;
  const audioCtx = getContext();
  if (!audioCtx) return;

  function schedule() {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = FREQ[kind];
      const now = audioCtx.currentTime;
      const duration = kind === 'settle' ? 0.28 : 0.16;
      // Gentle envelope: fades up quickly, then back down — never a hard
      // on/off edge, which is what makes a synthesized tone feel like a
      // "click" instead of a soft chime. Gain raised from an earlier,
      // near-inaudible 0.05 to 0.16 — "leise Toene" still means soft,
      // not "technically plays but nobody can ever actually hear it on
      // a phone speaker".
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      // Sound is a pure nice-to-have — never let it break the actual
      // interaction it's attached to.
    }
  }

  // "Toene gehen gar nicht"-Auftrag — browsers suspend a freshly
  // created (or backgrounded) AudioContext until a user gesture
  // resumes it. resume() returns a promise; scheduling the oscillator
  // immediately afterwards WITHOUT waiting for it to actually resolve
  // meant that on many phones the very first tone (and sometimes every
  // tone, if the context kept getting suspended between taps) was
  // silently dropped — the call succeeded, nothing ever played, which
  // matches exactly "der Schalter ist an, aber es passiert nichts".
  // Scheduling inside resume()'s .then() guarantees the context is
  // actually running first.
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(schedule).catch(schedule);
  } else {
    schedule();
  }
}
