import { customPalettesRepo } from '../../services/customPalettes';
import { wesenColors, type WesenPreset } from '../../services/wesenColors';
import type { HomeEffectId } from '../../services/homeEffects';
import { WORLDS } from './worldData';

/**
 * Welt-Pakete: eine Welt, die passende Bewegung auf der Startseite und eine dazu getönte Farbwelt – als ein Klick.
 * Alles bleibt danach einzeln änderbar (Welt, Farbwelt, Hell/Dunkel, Bewegung); „Zurück“ stellt den vorigen Stand wieder her.
 * Die Farbwelt „Welt-Paket“ wird aus der Farbe der Welt abgeleitet (nicht aus dem Wesen – dafür gibt es „Farben passend zum Wesen“).
 */
export const PACK_PALETTE_ID = 'pack-welt';

export interface WorldPack {
  id: string;
  world: string;
  effect: HomeEffectId;
  preset: WesenPreset['n'];
  de: { name: string; sub: string };
  en: { name: string; sub: string };
}

export const WORLD_PACKS: WorldPack[] = [
  { id: 'waldnacht', world: 'wald', effect: 'fireflies', preset: 4, de: { name: 'Waldnacht', sub: 'Dunkles Grün, Glühwürmchen' }, en: { name: 'Forest night', sub: 'Deep green, fireflies' } },
  { id: 'waldmorgen', world: 'wald', effect: 'rays', preset: 2, de: { name: 'Waldmorgen', sub: 'Helles Grün, Sonnenstrahlen' }, en: { name: 'Forest morning', sub: 'Light green, sunbeams' } },
  { id: 'meerestiefe', world: 'meer', effect: 'bubbles', preset: 3, de: { name: 'Meerestiefe', sub: 'Dunkles Blau, Blasen' }, en: { name: 'Deep sea', sub: 'Dark blue, bubbles' } },
  { id: 'wiesentag', world: 'wiese', effect: 'butterflies', preset: 2, de: { name: 'Wiesentag', sub: 'Frisches Grün, Schmetterlinge' }, en: { name: 'Meadow day', sub: 'Fresh green, butterflies' } },
  { id: 'herbsttag', world: 'herbst', effect: 'leaves', preset: 2, de: { name: 'Herbsttag', sub: 'Warm getönt, fallende Blätter' }, en: { name: 'Autumn day', sub: 'Warmly tinted, falling leaves' } },
  { id: 'winterstille', world: 'winter', effect: 'snow', preset: 3, de: { name: 'Winterstille', sub: 'Dämmriges Blau, Schneebälle' }, en: { name: 'Winter hush', sub: 'Dusky blue, snowballs' } },
  { id: 'sternennacht', world: 'nacht', effect: 'stars', preset: 5, de: { name: 'Sternennacht', sub: 'Tiefes Indigo, Sterne' }, en: { name: 'Starry night', sub: 'Deep indigo, stars' } },
  { id: 'kirschblueten', world: 'kirschbluete', effect: 'blossoms', preset: 1, de: { name: 'Kirschblüten', sub: 'Zartes Rosa, Blüten' }, en: { name: 'Cherry blossoms', sub: 'Soft pink, blossoms' } },
  { id: 'polarnacht', world: 'polarlicht', effect: 'sparkle', preset: 4, de: { name: 'Polarnacht', sub: 'Dunkles Türkis, Funkeln' }, en: { name: 'Polar night', sub: 'Dark teal, sparkle' } },
  { id: 'regenabend', world: 'regen', effect: 'rain', preset: 3, de: { name: 'Regenabend', sub: 'Gemütlich grau-blau, leiser Regen' }, en: { name: 'Rainy evening', sub: 'Cosy grey-blue, soft rain' } },
  { id: 'maerchennacht', world: 'maerchenwald', effect: 'fireflies', preset: 4, de: { name: 'Märchennacht', sub: 'Dunkles Violett, leuchtende Punkte' }, en: { name: 'Fairytale night', sub: 'Deep violet, glowing dots' } },
  { id: 'unterwasserlicht', world: 'unterwasser', effect: 'bubbles', preset: 3, de: { name: 'Unterwasserlicht', sub: 'Tiefes Türkis, Blasen' }, en: { name: 'Underwater light', sub: 'Deep teal, bubbles' } },
  { id: 'himmelstag', world: 'himmel', effect: 'dust', preset: 2, de: { name: 'Himmelstag', sub: 'Helles Blau, Lichtstaub' }, en: { name: 'Sky day', sub: 'Light blue, light dust' } },
  { id: 'lagerfeuerabend', world: 'lagerfeuer', effect: 'sparkle', preset: 4, de: { name: 'Lagerfeuerabend', sub: 'Warmes Dunkel, Funken' }, en: { name: 'Campfire evening', sub: 'Warm dark, sparks' } },
  { id: 'gemuetliche-ecke', world: 'cozy', effect: 'dust', preset: 1, de: { name: 'Gemütliche Ecke', sub: 'Weiches Rosé, Lichtstaub' }, en: { name: 'Cosy corner', sub: 'Soft rosé, light dust' } },
];

export function packColors(pack: WorldPack) {
  const wash = WORLDS.find((w) => w.id === pack.world)?.wash ?? '#7fae8f';
  return wesenColors(wash, pack.preset);
}

/** Speichert die Farbwelt des Pakets und gibt die Einstellungen zurück, die dazu gesetzt werden. */
export function savePackPalette(pack: WorldPack) {
  const c = packColors(pack);
  customPalettesRepo.save({ id: PACK_PALETTE_ID, name: 'Welt-Paket', bg: c.bg, primary: c.primary, dark: c.dark });
  return {
    world: pack.world,
    worldStill: false,
    palette: PACK_PALETTE_ID,
    themeMode: (c.dark ? 'dark' : 'light') as 'dark' | 'light',
    homeEffect: pack.effect as string,
    homeSkyOff: false,
    worldPack: pack.id,
  };
}
