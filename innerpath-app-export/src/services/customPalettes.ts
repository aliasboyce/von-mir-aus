import { createRepository, createId } from '../services/storage/repository';

export interface CustomPalette {
  id: string;
  name: string;
  bg: string;
  primary: string;
}

export const customPalettesRepo = createRepository<CustomPalette>('custom-theme-palettes');

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
}

function toHex(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
}

function mix(hex: string, target: [number, number, number], amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [tr, tg, tb] = target;
  return `#${toHex(r + (tr - r) * amount)}${toHex(g + (tg - g) * amount)}${toHex(b + (tb - b) * amount)}`;
}

/**
 * Derives a full, coherent set of design-system CSS variables from just two
 * picked colors (background + primary), using the same "mix toward white /
 * black" approach as the app's other derived-color helpers. Keeps a custom
 * color world visually consistent with the built-in ones without asking
 * the person to pick a dozen individual shades.
 */
export function derivePaletteVars(palette: CustomPalette): Record<string, string> {
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [20, 18, 14];
  return {
    '--color-bg': palette.bg,
    '--color-bg-soft': mix(palette.bg, black, 0.04),
    '--color-surface': mix(palette.bg, white, 0.65),
    '--color-surface-muted': mix(palette.bg, black, 0.03),
    '--color-border': mix(palette.bg, black, 0.12),
    '--color-border-strong': mix(palette.bg, black, 0.2),
    '--color-primary': palette.primary,
    '--color-primary-strong': mix(palette.primary, black, 0.25),
    '--color-primary-soft': mix(palette.primary, white, 0.82),
    '--color-primary-soft-text': mix(palette.primary, black, 0.15),
  };
}

export function createCustomPalette(name: string, bg: string, primary: string): CustomPalette {
  const palette: CustomPalette = { id: createId('palette'), name, bg, primary };
  customPalettesRepo.save(palette);
  return palette;
}

/** Only custom palettes ever live in this store — the 6 built-in ones are
 * hardcoded in theme.ts and never touch localStorage, so there's no risk
 * of a "protected" palette ending up deletable through this function. */
export function deleteCustomPalette(id: string): void {
  customPalettesRepo.remove(id);
}
