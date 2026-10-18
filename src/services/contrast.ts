/**
 * "Bei Farbwelt muss die Schrift immer lesbar sein"-Auftrag — pure colour
 * math used by ThemeEffect: whatever palette (built-in or self-made) and
 * whatever light/dark mode is active, text colours are nudged just far
 * enough away from the backgrounds they sit on to stay readable. Colours
 * that already read well are left exactly as they are.
 */
export type RGB = [number, number, number];

export function parseColor(input: string): RGB | null {
  const s = input.trim().toLowerCase();
  let m = /^#([0-9a-f]{3})$/.exec(s);
  if (m) return [...m[1]].map((c) => parseInt(c + c, 16)) as RGB;
  m = /^#([0-9a-f]{6})/.exec(s);
  if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
  m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(s);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  return null;
}

export function toHex([r, g, b]: RGB): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function luminance([r, g, b]: RGB): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: RGB, b: RGB): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Move `fg` toward black or white (whichever the backgrounds call for)
 * until it reaches `min` contrast on EVERY background. Returns `fg`
 * unchanged when it already does. */
export function ensureContrast(fg: RGB, backgrounds: RGB[], min: number): RGB {
  const worst = (c: RGB) => Math.min(...backgrounds.map((bg) => contrastRatio(c, bg)));
  if (worst(fg) >= min) return fg;
  const avgLum = backgrounds.reduce((s, bg) => s + luminance(bg), 0) / backgrounds.length;
  const target: RGB = avgLum > 0.4 ? [0, 0, 0] : [255, 255, 255];
  for (let i = 1; i <= 40; i++) {
    const c = mix(fg, target, i / 40);
    if (worst(c) >= min) return c.map((v) => Math.round(v)) as RGB;
  }
  return target;
}
