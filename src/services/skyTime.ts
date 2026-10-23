export type SkyPhase = 'night' | 'sunriseGlow' | 'sunriseGolden' | 'day' | 'sunsetGolden' | 'sunsetGlow';
export type Season = 'fruehling' | 'sommer' | 'herbst' | 'winter';

/**
 * "Keine Sonnen/Mond-Koerper mehr, nur Licht/Himmel, mit genauem
 * Stundenplan fuer Sonnenaufgang/-untergang"-Auftrag — six phases
 * instead of the original four, each mapping to its own atmosphere-
 * only look (no circular sun/moon shape anywhere):
 *   21:00-06:00  night          — stars, no moon disc
 *   06:00-08:00  sunriseGlow    — warm glow low on the horizon
 *   08:00-11:00  sunriseGolden  — whole sky tinted golden
 *   11:00-17:00  day            — the chosen subtle "D" look, no shape
 *   17:00-19:00  sunsetGolden   — whole sky in evening colour
 *   19:00-21:00  sunsetGlow     — warm glow low on the horizon, deeper/redder
 */
export function phaseFor(hour: number): SkyPhase {
  if (hour >= 6 && hour < 8) return 'sunriseGlow';
  if (hour >= 8 && hour < 11) return 'sunriseGolden';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'sunsetGolden';
  if (hour >= 19 && hour < 21) return 'sunsetGlow';
  return 'night';
}

export function seasonFor(month: number): Season {
  // Northern-hemisphere meteorological seasons (month is 0-11)
  if (month >= 2 && month <= 4) return 'fruehling';
  if (month >= 5 && month <= 7) return 'sommer';
  if (month >= 8 && month <= 10) return 'herbst';
  return 'winter';
}

export function currentPhaseAndSeason(): { phase: SkyPhase; season: Season } {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  return { phase: phaseFor(hour), season: seasonFor(now.getMonth()) };
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
