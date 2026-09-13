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
type SoundKind = 'click' | 'select' | 'settle' | 'menu' | 'close' | 'complete' | 'cancelFlow';

let ctx: AudioContext | null = null;
function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  // "Ton geht nach der Orientierung komplett aus"-Auftrag — a shared
  // context can end up 'closed' (not just 'suspended') after enough
  // background/foreground cycles on a phone, and a closed context can
  // never be resumed again — every future sound would silently no-op
  // forever for the rest of the session. Recreating it here whenever
  // that happens means one bad context never breaks sound permanently.
  if (!ctx || ctx.state === 'closed') ctx = new Ctor();
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
  // "Zu hart, soll weicher sein"-Auftrag — chosen in the sound
  // workshop (variant B): lower starting cutoff (600 vs 1600) and
  // lower gain (0.055 vs 0.13) than the previous version.
  filter.frequency.setValueAtTime(600, now);
  filter.frequency.exponentialRampToValueAtTime(200, now + 0.035);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.055, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  source.start(now);
  source.stop(now + 0.06);
}


/** "Anderer Ton fuer die Hauptmenue-Punkte"-Auftrag — gewaehlt: die
 * waermere, tonale Variante (B) statt des Rausch-Klicks, damit sich
 * die untere Hauptnavigation eigenstaendig anfuehlt. */
function scheduleMenu(audioCtx: AudioContext) {
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 180;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.09, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}

/** "Extra Ton fuer Kreuz/Schliessen"-Auftrag — gewaehlt: Variante A,
 * ein weiches, aufsteigendes Wisch-Geraeusch (Rauschen, tiefer als
 * der Klick beginnend), fuer das Schliessen/Abbrechen eines
 * einzelnen Dialogs. */
function scheduleClose(audioCtx: AudioContext) {
  const now = audioCtx.currentTime;
  const source = audioCtx.createBufferSource();
  source.buffer = getNoiseBuffer(audioCtx);
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(300, now);
  filter.frequency.exponentialRampToValueAtTime(900, now + 0.04);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.09, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  source.start(now);
  source.stop(now + 0.06);
}

/** "Beenden"-Auftrag — gewaehlt: Variante C, ein weicher, warmer
 * Zweiklang fuer den Abschluss eines Durchgangs (Zugang beenden,
 * Bruecke speichern usw). */
function scheduleComplete(audioCtx: AudioContext) {
  const now = audioCtx.currentTime;
  [523, 659].forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    const t = now + i * 0.11;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.045, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.55);
  });
}

/** "Zurueck / Abbruch bei bestimmten Funktionen"-Auftrag — gewaehlt:
 * Variante D, ein einzelner, sehr sanfter Ton fuer das Verlassen
 * eines mehrstufigen Ablaufs ohne ihn abzuschliessen (unterscheidet
 * sich bewusst von scheduleClose, das fuer einfache Dialoge ist). */
function scheduleCancelFlow(audioCtx: AudioContext) {
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 587;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.04, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.65);
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
// "D und E abwechselnd"-Auftrag — simple alternating counter so
// consecutive taps don't sound identical (matches the requested
// variation, "wie es eben bei Apps ist").
let giggleToggle = 0;

function scheduleGiggle(audioCtx: AudioContext) {
  const now = audioCtx.currentTime;
  giggleToggle = 1 - giggleToggle;
  if (giggleToggle === 0) {
    // Variante D: sanftes Vibrato, drei Silben
    [520, 620, 700].forEach((f, i) => vibratoTone(audioCtx, now + i * 0.1, f, 0.13, 0.055, 28, 55, 'sine'));
  } else {
    // Variante E: mehr Silben, wackeliger
    [460, 580, 520, 640].forEach((f, i) => vibratoTone(audioCtx, now + i * 0.085, f, 0.11, 0.05, 32, 70, 'sine'));
  }
}

/** Put to sleep — chosen variant A: higher pitch, longer than the
 * original attempt, per direct feedback. */
function scheduleSleepSigh(audioCtx: AudioContext) {
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(450, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.8);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.06, now + 0.12);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.9);
}

/** Waking up — a short, questioning "hmm?": low, rising slightly at the end. */
function scheduleWakeHmm(audioCtx: AudioContext) {
  const now = audioCtx.currentTime;
  // "Aufwecken = F"-Auftrag — zwei sanfte, hohe Silben wie ein gerade
  // wach werdendes Vogeljunges/Kueken statt eines fragenden "mrrn".
  vibratoTone(audioCtx, now, 560, 0.14, 0.045, 18, 30);
  vibratoTone(audioCtx, now + 0.2, 640, 0.16, 0.045, 18, 35);
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
      else if (kind === 'menu') scheduleMenu(audioCtx);
      else if (kind === 'close') scheduleClose(audioCtx);
      else if (kind === 'complete') scheduleComplete(audioCtx);
      else if (kind === 'cancelFlow') scheduleCancelFlow(audioCtx);
      else scheduleComplete(audioCtx); // 'settle' — same as 'complete', see below
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

/**
 * TEMPORAER — Vorschau-Varianten fuer die Ton-Auswahl mit dem Nutzer.
 * Nicht fuer den regulaeren Gebrauch verdrahtet; nur von
 * SoundWorkshopPage.tsx aufgerufen. Nach der Entscheidung werden die
 * gewaehlten Varianten in die eigentlichen scheduleXxx-Funktionen
 * oben uebernommen und dieser ganze Block wieder entfernt.
 */
function previewPlay(fn: (ctx: AudioContext) => void) {
  const audioCtx = getContext();
  if (!audioCtx) return;
  const run = () => {
    try {
      fn(audioCtx);
    } catch {
      // preview only
    }
  };
  if (audioCtx.state === 'suspended') audioCtx.resume().then(run).catch(run);
  else run();
}

// --- Kichern (Antippen) ---
export function previewGiggleA(ctx: AudioContext) {
  [330, 392, 440].forEach((f, i) => scheduleBlip(ctx, ctx.currentTime + i * 0.09, f, 0.09, 0.06));
}
export function previewGiggleB(ctx: AudioContext) {
  const now = ctx.currentTime;
  [523, 659, 784, 880].forEach((f, i) => scheduleBlip(ctx, now + i * 0.06, f, 0.07, 0.05));
}
export function previewGiggleC(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(392, now);
  osc.frequency.linearRampToValueAtTime(500, now + 0.08);
  osc.frequency.linearRampToValueAtTime(440, now + 0.16);
  osc.frequency.linearRampToValueAtTime(540, now + 0.24);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.07, now + 0.03);
  gain.gain.linearRampToValueAtTime(0.05, now + 0.16);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.32);
}

// --- Seufzer (Schlafen legen) ---
export function previewSighA(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(450, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.8);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.06, now + 0.12);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.9);
}
export function previewSighB(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(240, now + 1.05);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.055, now + 0.15);
  gain.gain.setValueAtTime(0.055, now + 0.5);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 1.15);
}

// --- Aufwecken ---
export function previewWakeA(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(260, now);
  osc.frequency.linearRampToValueAtTime(340, now + 0.35);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.06, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.55);
}
export function previewWakeB(ctx: AudioContext) {
  const now = ctx.currentTime;
  [280, 330].forEach((f, i) => scheduleBlip(ctx, now + i * 0.16, f, 0.22, 0.06));
}
export function previewWakeC(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(230, now);
  osc.frequency.setValueAtTime(230, now + 0.15);
  osc.frequency.linearRampToValueAtTime(300, now + 0.4);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.06, now + 0.08);
  gain.gain.setValueAtTime(0.05, now + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.6);
}

// --- Klick (weicher) ---
export function previewClickSoft(ctx: AudioContext) {
  const now = ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(900, now);
  filter.frequency.exponentialRampToValueAtTime(250, now + 0.03);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);
  source.stop(now + 0.05);
}
export function previewClickSofter(ctx: AudioContext) {
  const now = ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(600, now);
  filter.frequency.exponentialRampToValueAtTime(200, now + 0.035);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.055, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);
  source.stop(now + 0.06);
}

// --- Kreuz / Abbrechen (neu) ---
export function previewCloseA(ctx: AudioContext) {
  const now = ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(300, now);
  filter.frequency.exponentialRampToValueAtTime(900, now + 0.04);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.09, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);
  source.stop(now + 0.06);
}
export function previewCloseB(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(420, now);
  osc.frequency.exponentialRampToValueAtTime(280, now + 0.13);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.17);
}

// --- Belohnung / Abschluss (neu) ---
export function previewRewardA(ctx: AudioContext) {
  const now = ctx.currentTime;
  [440, 554, 659].forEach((f, i) => scheduleBlip(ctx, now + i * 0.1, f, 0.28, 0.07));
}
export function previewRewardB(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(523, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.09, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.6);
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(659, now + 0.08);
  gain2.gain.setValueAtTime(0, now + 0.08);
  gain2.gain.linearRampToValueAtTime(0.06, now + 0.12);
  gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.08);
  osc2.stop(now + 0.65);
}

// --- Hauptmenue-Punkte (neu, wärmer/tiefer als normaler Klick) ---
export function previewMenuA(ctx: AudioContext) {
  const now = ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(700, now);
  filter.frequency.exponentialRampToValueAtTime(150, now + 0.05);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.11, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);
  source.stop(now + 0.07);
}
export function previewMenuB(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 180;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.09, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}

export function playPreview(fn: (ctx: AudioContext) => void) {
  previewPlay(fn);
}

// ============================================================
// RUNDE 2 — nach Nutzer-Feedback: "kein mechanisches Piepen,
// soll wie ein Lebewesen klingen (Baby/Baby-Tier)". Der Trick
// dafuer mit reiner Web-Audio-Synthese (keine Aufnahmen): echte
// Stimmen haben Vibrato (staendiges leichtes Zittern der
// Tonhoehe) und einen Hauch Atem-Rauschen darunter — beides fehlte
// in Runde 1 komplett, was den "elektronischen Beep"-Charakter
// erzeugt hat.
// ============================================================

/** Ein Oszillator mit echtem Vibrato (LFO moduliert die Frequenz) —
 * die Grundzutat fuer alles "Stimmhafte" unten. */
function vibratoTone(
  ctx: AudioContext,
  startAt: number,
  baseFreq: number,
  duration: number,
  peakGain: number,
  vibratoHz: number,
  vibratoDepth: number,
  waveform: OscillatorType = 'sine'
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  osc.type = waveform;
  osc.frequency.value = baseFreq;
  lfo.type = 'sine';
  lfo.frequency.value = vibratoHz;
  lfoGain.gain.value = vibratoDepth;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peakGain, startAt + duration * 0.25);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  lfo.start(startAt);
  osc.start(startAt);
  lfo.stop(startAt + duration + 0.05);
  osc.stop(startAt + duration + 0.05);
}

/** Ganz leises Atem-Rauschen darunter mischen — macht eine reine
 * Tonhoehe organischer/koerperlicher statt rein elektronisch. */
function breathLayer(ctx: AudioContext, startAt: number, duration: number, peakGain: number) {
  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer(ctx);
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 900;
  filter.Q.value = 0.6;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peakGain, startAt + duration * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(startAt);
  source.stop(startAt + duration + 0.05);
}

// --- Kichern, Runde 2: kurze stimmhafte "hihi"-Silben mit Vibrato ---
export function previewGiggleD(ctx: AudioContext) {
  const now = ctx.currentTime;
  [520, 620, 700].forEach((f, i) => vibratoTone(ctx, now + i * 0.1, f, 0.13, 0.055, 28, 55, 'sine'));
}
export function previewGiggleE(ctx: AudioContext) {
  const now = ctx.currentTime;
  [460, 580, 520, 640].forEach((f, i) => vibratoTone(ctx, now + i * 0.085, f, 0.11, 0.05, 32, 70, 'sine'));
}
export function previewGiggleF(ctx: AudioContext) {
  // Baby-Tier-artig: etwas hoeher, staerkeres Vibrato, kuerzer, mit
  // einem winzigen Hauch Atem-Textur pro Silbe.
  const now = ctx.currentTime;
  [660, 740, 820].forEach((f, i) => {
    const t = now + i * 0.095;
    vibratoTone(ctx, t, f, 0.1, 0.05, 35, 90, 'sine');
    breathLayer(ctx, t, 0.08, 0.012);
  });
}

// --- Seufzer, Runde 2: organischer mit Vibrato + Atem ---
export function previewSighC(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(480, now);
  osc.frequency.exponentialRampToValueAtTime(230, now + 0.9);
  lfo.type = 'sine';
  lfo.frequency.value = 5.5;
  lfoGain.gain.value = 8;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.06, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
  osc.connect(gain);
  gain.connect(ctx.destination);
  lfo.start(now);
  osc.start(now);
  lfo.stop(now + 1);
  osc.stop(now + 1);
  breathLayer(ctx, now, 1.0, 0.02);
}
export function previewSighD(ctx: AudioContext) {
  // Babyhafter "Coo"-Laut: leicht ansteigend dann sanft abfallend,
  // deutliches aber langsames Vibrato, mehr Atem-Anteil.
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(380, now);
  osc.frequency.linearRampToValueAtTime(430, now + 0.25);
  osc.frequency.exponentialRampToValueAtTime(210, now + 1.1);
  lfo.type = 'sine';
  lfo.frequency.value = 4.5;
  lfoGain.gain.value = 10;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.055, now + 0.2);
  gain.gain.setValueAtTime(0.055, now + 0.5);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);
  osc.connect(gain);
  gain.connect(ctx.destination);
  lfo.start(now);
  osc.start(now);
  lfo.stop(now + 1.2);
  osc.stop(now + 1.2);
  breathLayer(ctx, now, 1.15, 0.025);
}

// --- Aufwecken, Runde 2: verspielte, babyhafte Fragelaute ---
export function previewWakeD(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.linearRampToValueAtTime(420, now + 0.4);
  lfo.type = 'sine';
  lfo.frequency.value = 6;
  lfoGain.gain.value = 10;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.06, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  lfo.start(now);
  osc.start(now);
  lfo.stop(now + 0.55);
  osc.stop(now + 0.55);
  breathLayer(ctx, now, 0.5, 0.018);
}
export function previewWakeE(ctx: AudioContext) {
  // Zwei kurze verschlafene "mrrn?"-Silben
  const now = ctx.currentTime;
  vibratoTone(ctx, now, 320, 0.22, 0.055, 20, 40);
  vibratoTone(ctx, now + 0.26, 400, 0.28, 0.05, 22, 55);
  breathLayer(ctx, now, 0.55, 0.015);
}

// --- Kreuz/Abbrechen, Runde 2: deutlich anders als der Klick (tonal statt Rauschen) ---
export function previewCloseC(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(260, now + 0.16);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.07, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.22);
}
export function previewCloseD(ctx: AudioContext) {
  const now = ctx.currentTime;
  [440, 330].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const t = now + i * 0.07;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  });
}

// --- Belohnung, Runde 2: noch weicher als Runde-1-B ---
export function previewRewardC(ctx: AudioContext) {
  const now = ctx.currentTime;
  [523, 659].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    const t = now + i * 0.11;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.045, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.55);
  });
}
export function previewRewardD(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 587;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.04, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.65);
}

// ============================================================
// RUNDE 3 — zusaetzliche kreative Ideen (Trillern per schnellem
// Vibrato fuer mehr "Niedlichkeit", falls D/E noch nicht 100% passen).
// ============================================================

/** Kichern mit staerkerem, schnellerem Triller — noch verspielter. */
export function previewGiggleG(ctx: AudioContext) {
  const now = ctx.currentTime;
  [580, 660, 620, 720].forEach((f, i) => vibratoTone(ctx, now + i * 0.075, f, 0.1, 0.05, 45, 100, 'sine'));
}

/** Aufwecken als zwei ganz sanfte, hohe "piep-piep"-Silben — wie ein
 * gerade wach werdendes Kuecken/Vogeljunges statt "mrrn". */
export function previewWakeF(ctx: AudioContext) {
  const now = ctx.currentTime;
  vibratoTone(ctx, now, 560, 0.14, 0.045, 18, 30);
  vibratoTone(ctx, now + 0.2, 640, 0.16, 0.045, 18, 35);
}

// ============================================================
// RUNDE 4 — nach Feedback "klingt noch zu elektronisch, soll wie
// Kleinkind/Mensch klingen, nicht Roboter-artig". Der entscheidende
// Wechsel: echte Stimmen/Atem sind ATEM-DOMINANT mit nur ganz
// leichtem Ton darunter — nicht umgekehrt. Diese Runde fuehrt Atem
// (gefiltertes Rauschen) als HAUPTBESTANDTEIL, der Ton ist nur eine
// ganz leise Faerbung darunter statt der Hauptklang.
// ============================================================

/** Ein warmer Atemzug: geformtes Rauschen (bandpass, wie ein "hhh"),
 * das an- und abschwillt, mit einem KAUM hoerbaren Ton darunter fuer
 * Waerme. Das ist die Grundzutat fuer die "menschlicher"-Kandidaten
 * unten. */
function breathSwell(
  ctx: AudioContext,
  startAt: number,
  duration: number,
  peakGain: number,
  filterFreq: number,
  filterQ = 1.2
) {
  const source = ctx.createBufferSource();
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = filterQ;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peakGain, startAt + duration * 0.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(startAt);
  source.stop(startAt + duration + 0.02);
}

// --- Seufzer/Ein-Ausatmen: Runde 4, atem-dominant ---
export function previewSighE(ctx: AudioContext) {
  // Ein Atemzug: Einatmen (steigendes Rauschen) dann Ausatmen
  // (fallendes, laengeres Rauschen) — wie ein echtes kleines Seufzen.
  const now = ctx.currentTime;
  breathSwell(ctx, now, 0.5, 0.05, 1400, 0.9); // einatmen
  breathSwell(ctx, now + 0.45, 0.9, 0.045, 700, 1.1); // ausatmen, tiefer+laenger
  // ganz leiser Ton darunter fuer Waerme, kaum hoerbar
  vibratoTone(ctx, now, 380, 1.3, 0.018, 4, 6, 'sine');
}
export function previewSighF(ctx: AudioContext) {
  // Nur das Ausatmen, wie ein zufriedenes kleines "hhhh" beim
  // Einschlafen — noch einfacher, noch weicher.
  const now = ctx.currentTime;
  breathSwell(ctx, now, 1.1, 0.055, 650, 1.0);
  vibratoTone(ctx, now, 340, 1.1, 0.02, 3.5, 5, 'sine');
}

// --- Kichern Runde 4: kurze Atemstoesse statt reiner Toene ---
export function previewGiggleH(ctx: AudioContext) {
  const now = ctx.currentTime;
  [0, 0.1, 0.19].forEach((t, i) => {
    breathSwell(ctx, now + t, 0.09, 0.045, 1800 + i * 200, 1.4);
    vibratoTone(ctx, now + t, 480 + i * 60, 0.08, 0.02, 30, 40, 'sine');
  });
}

// --- Aufwecken Runde 4: kleines verschlafenes Einatmen+Raeuspern ---
export function previewWakeG(ctx: AudioContext) {
  const now = ctx.currentTime;
  breathSwell(ctx, now, 0.35, 0.045, 1100, 1.0);
  vibratoTone(ctx, now + 0.1, 340, 0.3, 0.03, 15, 25, 'sine');
}
