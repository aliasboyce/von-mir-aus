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
  try {
    // Browsers suspend a freshly-created context until a user gesture
    // resumes it — every call site here already runs from a tap/click,
    // so resuming (a no-op if already running) is always safe.
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = FREQ[kind];
    const now = audioCtx.currentTime;
    const duration = kind === 'settle' ? 0.22 : 0.12;
    // Gentle envelope: fades up quickly, then back down — never a hard
    // on/off edge, which is what makes a synthesized tone feel like a
    // "click" instead of a soft chime.
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.015);
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
