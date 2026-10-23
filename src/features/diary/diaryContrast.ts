/** Standard WCAG relative luminance from an sRGB hex color. */
function relativeLuminance(hex: string): number | null {
  const m = hex.replace('#', '');
  if (m.length !== 6) return null;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrastRatio(hexA: string, hexB: string): number | null {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  if (lA === null || lB === null) return null;
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Reads the diary's *actual current* card background — not a hardcoded
 * assumption — so this stays correct whether the person is in light or
 * dark mode, or using a custom accent palette that shifts the surface
 * tone slightly. Returns null if the value can't be read/parsed, in
 * which case the caller should skip the warning rather than block
 * someone on a false positive.
 */
export function currentDiarySurfaceHex(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim();
  // CSS custom properties here are already stored as hex; if that ever
  // changes to rgb()/hsl(), this simply won't match six hex chars and
  // the caller safely skips the check.
  return /^#([0-9a-f]{6})$/i.test(raw) ? raw : null;
}

/** WCAG AA for normal-size body text is a 4.5:1 ratio — the standard
 * threshold, not an arbitrary one picked for this app. */
export function hasInsufficientContrast(textColorHex: string): boolean {
  const bg = currentDiarySurfaceHex();
  if (!bg) return false;
  const ratio = contrastRatio(textColorHex, bg);
  if (ratio === null) return false;
  return ratio < 4.5;
}
