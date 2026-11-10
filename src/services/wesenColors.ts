import { customPalettesRepo, mixHex, type CustomPalette } from './customPalettes';

/**
 * „Wesen-Farben“: Die App-Farben passen sich der Farbe des Wesens an, damit alles zusammen harmoniert
 * (grünes Wesen → grüner Hintergrund und grünes Menü). Fünf Voreinstellungen von hell bis tief dunkel.
 * Es wird nur eine Farbwelt (Palette „Wesen-Farben“) gesetzt – alles andere (andere Paletten, Welten, Hell/Dunkel) bleibt frei wählbar.
 */
export const WESEN_PALETTE_ID = 'wesen-match';

export interface WesenPreset {
  n: 1 | 2 | 3 | 4 | 5;
  dark: boolean;
  de: { name: string; sub: string };
  en: { name: string; sub: string };
}

export const WESEN_PRESETS: WesenPreset[] = [
  { n: 1, dark: false, de: { name: 'Hauch', sub: 'Hell, nur ein Hauch der Wesenfarbe.' }, en: { name: 'Hint', sub: 'Light, just a hint of the being’s colour.' } },
  { n: 2, dark: false, de: { name: 'Sanft', sub: 'Hell mit deutlich getöntem Hintergrund.' }, en: { name: 'Soft', sub: 'Light with a clearly tinted background.' } },
  { n: 3, dark: true, de: { name: 'Dämmerung', sub: 'Dunkel, leicht in der Wesenfarbe getönt.' }, en: { name: 'Dusk', sub: 'Dark, lightly tinted in the being’s colour.' } },
  { n: 4, dark: true, de: { name: 'Waldnacht', sub: 'Dunkel und kräftig getönt, Menü in der Wesenfarbe.' }, en: { name: 'Deep night', sub: 'Dark and strongly tinted, menu in the being’s colour.' } },
  { n: 5, dark: true, de: { name: 'Tief', sub: 'Satter, dunkler Farbton rundum.' }, en: { name: 'Deep', sub: 'Rich, dark colour all around.' } },
];

export function wesenColors(color: string, n: WesenPreset['n']): { bg: string; primary: string; dark: boolean } {
  const base = /^#[0-9a-f]{6}$/i.test(color) ? color : '#7fae8f';
  const white = '#ffffff';
  switch (n) {
    case 1: return { dark: false, bg: mixHex('#fbfaf7', base, 0.1), primary: mixHex(base, '#141210', 0.2) };
    case 2: return { dark: false, bg: mixHex('#ffffff', base, 0.26), primary: mixHex(base, '#141210', 0.32) };
    case 3: return { dark: true, bg: mixHex('#12151a', base, 0.16), primary: mixHex(base, white, 0.22) };
    case 4: return { dark: true, bg: mixHex('#0d1210', base, 0.3), primary: mixHex(base, white, 0.18) };
    case 5: default: return { dark: true, bg: mixHex(base, '#0b0d0c', 0.62), primary: mixHex(base, white, 0.34) };
  }
}

export function wesenPalette(color: string, n: WesenPreset['n']): CustomPalette {
  const c = wesenColors(color, n);
  return { id: WESEN_PALETTE_ID, name: 'Wesen-Farben', bg: c.bg, primary: c.primary, dark: c.dark };
}

export function saveWesenPalette(color: string, n: WesenPreset['n']): CustomPalette {
  const p = wesenPalette(color, n);
  customPalettesRepo.save(p);
  return p;
}
