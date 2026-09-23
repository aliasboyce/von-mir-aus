export type SkyPhase = 'sunrise' | 'day' | 'sunset' | 'night';
export type Season = 'fruehling' | 'sommer' | 'herbst' | 'winter';

/**
 * "Lebendiger machen"-Auftrag — shared time-of-day/season logic,
 * originally built for SkyAmbiance.tsx (home screen) and now reused
 * wherever else the same rhythm applies (the garden). Kept as plain
 * functions rather than a hook since some callers need it inside SVG
 * render logic where hooks don't fit as cleanly.
 */
export function phaseFor(hour: number): SkyPhase {
  if (hour >= 5 && hour < 8) return 'sunrise';
  if (hour >= 8 && hour < 18) return 'day';
  if (hour >= 18 && hour < 21) return 'sunset';
  return 'night';
}

export function seasonFor(month: number): Season {
  // Northern-hemisphere meteorological seasons (month is 0-11)
  if (month >= 2 && month <= 4) return 'fruehling';
  if (month >= 5 && month <= 7) return 'sommer';
  if (month >= 8 && month <= 10) return 'herbst';
  return 'winter';
}

/** 0 (just risen, low on the horizon) to 1 (highest point) to 0 (about to
 * set) — a simple arc, not literal astronomy, just enough to feel like
 * the sun/moon is genuinely somewhere in its day. */
export function archProgress(hour: number, phase: SkyPhase): number {
  if (phase === 'sunrise') return Math.min(1, (hour - 5) / 3) * 0.4;
  if (phase === 'day') return 0.4 + Math.sin(((hour - 8) / 10) * Math.PI) * 0.6;
  if (phase === 'sunset') return Math.max(0, 1 - (hour - 18) / 3) * 0.4;
  const nightHour = hour >= 21 ? hour - 21 : hour + 3; // 0..8 across 21:00-05:00
  return Math.max(0.08, Math.sin((nightHour / 8) * Math.PI) * 0.55);
}

export function currentPhaseAndSeason(): { phase: SkyPhase; season: Season; arch: number } {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  const ph = phaseFor(hour);
  return { phase: ph, season: seasonFor(now.getMonth()), arch: archProgress(hour, ph) };
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
