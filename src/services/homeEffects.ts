/**
 * Effekte für die Startseite (und „Nur jetzt“): kleine, ruhige Bewegung oben im Himmel.
 * 'auto' = wie bisher je nach Jahreszeit, 'off' = keine Teilchen. Alles andere ist frei wählbar, unabhängig von Welt und Jahreszeit.
 */
export type HomeEffectId =
  | 'auto' | 'off'
  | 'leaves' | 'blossoms' | 'sparkle' | 'stars' | 'snow' | 'rays' | 'fireflies'
  | 'bubbles' | 'hearts' | 'butterflies' | 'rain' | 'feathers' | 'dust';

export type HomeEffectDensity = 'few' | 'normal' | 'many';

export interface HomeEffectInfo { id: HomeEffectId; emoji: string; de: { name: string; sub: string }; en: { name: string; sub: string } }

export const HOME_EFFECTS: HomeEffectInfo[] = [
  { id: 'auto', emoji: '🗓️', de: { name: 'Passend zur Jahreszeit', sub: 'Wie bisher: Blätter im Herbst, Schnee im Winter, Blüten im Frühling, Blütenstaub im Sommer.' }, en: { name: 'Fits the season', sub: 'As before: leaves in autumn, snow in winter, petals in spring, pollen in summer.' } },
  { id: 'off', emoji: '⏸️', de: { name: 'Keine Bewegung', sub: 'Nur der ruhige Himmel, nichts fällt oder schwebt.' }, en: { name: 'No motion', sub: 'Just the calm sky, nothing falls or floats.' } },
  { id: 'leaves', emoji: '🍂', de: { name: 'Blätter', sub: 'Bunte Blätter, die langsam fallen.' }, en: { name: 'Leaves', sub: 'Colourful leaves slowly falling.' } },
  { id: 'blossoms', emoji: '🌸', de: { name: 'Blüten', sub: 'Zarte Blüten, die herabsegeln.' }, en: { name: 'Blossoms', sub: 'Delicate blossoms drifting down.' } },
  { id: 'sparkle', emoji: '✨', de: { name: 'Funkeln', sub: 'Kleine Lichtfunken, die kurz aufblitzen.' }, en: { name: 'Sparkle', sub: 'Tiny glints of light that flash briefly.' } },
  { id: 'stars', emoji: '⭐', de: { name: 'Sterne', sub: 'Sanfte Sterne, die leise herabrieseln.' }, en: { name: 'Stars', sub: 'Soft stars gently trickling down.' } },
  { id: 'snow', emoji: '❄️', de: { name: 'Schneebälle', sub: 'Weiche, runde Flocken – groß und flauschig.' }, en: { name: 'Snowballs', sub: 'Soft, round flakes – big and fluffy.' } },
  { id: 'rays', emoji: '🌤️', de: { name: 'Sonnenstrahlen', sub: 'Warme Lichtbahnen, die leise atmen.' }, en: { name: 'Sunbeams', sub: 'Warm shafts of light that breathe softly.' } },
  { id: 'fireflies', emoji: '🪲', de: { name: 'Glühwürmchen', sub: 'Leuchtpunkte, die langsam umherwandern.' }, en: { name: 'Fireflies', sub: 'Glowing dots wandering slowly.' } },
  { id: 'bubbles', emoji: '🫧', de: { name: 'Seifenblasen', sub: 'Durchsichtige Blasen, die aufsteigen.' }, en: { name: 'Bubbles', sub: 'Translucent bubbles rising up.' } },
  { id: 'hearts', emoji: '💗', de: { name: 'Herzchen', sub: 'Kleine Herzen, die aufsteigen.' }, en: { name: 'Little hearts', sub: 'Tiny hearts floating upward.' } },
  { id: 'butterflies', emoji: '🦋', de: { name: 'Schmetterlinge', sub: 'Flatternde Falter, ganz ohne Eile.' }, en: { name: 'Butterflies', sub: 'Fluttering butterflies, in no hurry.' } },
  { id: 'rain', emoji: '🌧️', de: { name: 'Leiser Regen', sub: 'Feine Tropfen – gemütlich.' }, en: { name: 'Soft rain', sub: 'Fine drops – cosy.' } },
  { id: 'feathers', emoji: '🪶', de: { name: 'Federn', sub: 'Leichte Federn, die hin und her schaukeln.' }, en: { name: 'Feathers', sub: 'Light feathers swaying down.' } },
  { id: 'dust', emoji: '🌟', de: { name: 'Lichtstaub', sub: 'Winzige Staubkörner, die im Licht schweben.' }, en: { name: 'Light dust', sub: 'Tiny motes floating in the light.' } },
];

export const effectById = (id?: string): HomeEffectInfo | undefined => HOME_EFFECTS.find((e) => e.id === id);
export const DENSITY_FACTOR: Record<HomeEffectDensity, number> = { few: 0.55, normal: 1, many: 1.8 };
