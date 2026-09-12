/**
 * Point 1 of the "Großer Qualitäts- und Erweiterungsprompt" — reverts
 * the previous session's switch to local SVG icons back to real
 * photographic suggestions, per the explicit "keine Symbol-Ersatzlösung
 * — ich möchte die frühere Foto-Auswahl zurück" instruction.
 *
 * The SVG-icon detour happened because the OLD photo source
 * (source.unsplash.com, "Unsplash Source") was officially deprecated
 * and shut down by Unsplash itself. This uses Lorem Picsum
 * (picsum.photos) instead — a separate, independently-run, still-active
 * service (MIT-licensed, no API key, verified reachable) that serves
 * real photographs, not AI-generated or symbolic placeholders.
 *
 * Trade-off, stated plainly rather than hidden: Picsum's seed-based
 * URLs return a real photo *deterministically* for a given seed string,
 * but — like the original picsum-based approach this app used even
 * earlier — it has no keyword/content search, so an individual photo
 * within a theme's seed set isn't guaranteed to depict that exact
 * subject. What's preserved: every suggestion is a genuine photograph,
 * the same resource/bridge reliably shows the same picked photo again
 * later (seeds are derived from the theme + a fixed index, not
 * re-randomized per visit), and the existing keyword-matching structure
 * still favors on-theme suggestions over generic ones.
 */

interface Theme {
  keywords: string[];
  seedBase: string; // used to build picsum.photos/seed/{seedBase}-N/... URLs
  count: number; // how many distinct seeded photos to offer for this theme
}

const THEMES: Theme[] = [
  { keywords: ['buch', 'lesen', 'roman', 'geschichte', 'book', 'read'], seedBase: 'book', count: 8 },
  { keywords: ['musik', 'lied', 'song', 'playlist', 'piano', 'klavier', 'music', 'melodie', 'gitarre', 'guitar'], seedBase: 'music', count: 8 },
  { keywords: ['tee', 'tasse', 'kaffee', 'trinken', 'tea', 'coffee', 'cup'], seedBase: 'coffee', count: 8 },
  { keywords: ['natur', 'wald', 'baum', 'spazier', 'wander', 'draußen', 'garten', 'nature', 'forest', 'walk', 'tree', 'park', 'berg', 'mountain'], seedBase: 'nature', count: 10 },
  { keywords: ['wärme', 'feuer', 'kamin', 'decke', 'kerze', 'warmth', 'fire', 'candle', 'blanket', 'gemütlich', 'cozy'], seedBase: 'candle', count: 8 },
  { keywords: ['anruf', 'telefon', 'kontakt', 'sprechen', 'nachricht', 'call', 'phone', 'message', 'freund', 'friend'], seedBase: 'phone', count: 6 },
  { keywords: ['schreiben', 'notiz', 'tagebuch', 'stift', 'journal', 'writing', 'notebook', 'zeichnen', 'kreativ', 'pen'], seedBase: 'journal', count: 8 },
  { keywords: ['tier', 'hund', 'katze', 'streicheln', 'haustier', 'animal', 'dog', 'cat', 'pet', 'vogel', 'bird'], seedBase: 'animal', count: 10 },
  { keywords: ['atem', 'atmen', 'breath', 'breathing', 'wind', 'luft', 'himmel', 'sky', 'wolke', 'cloud'], seedBase: 'sky', count: 8 },
  { keywords: ['wasser', 'regen', 'meer', 'see', 'baden', 'wave', 'water', 'rain', 'sea', 'schwimmen', 'strand', 'beach', 'fluss', 'river'], seedBase: 'water', count: 10 },
  { keywords: ['bewegung', 'sport', 'laufen', 'tanzen', 'yoga', 'move', 'dance', 'run', 'exercise', 'fahrrad', 'bike'], seedBase: 'movement', count: 8 },
  { keywords: ['essen', 'kochen', 'food', 'apfel', 'obst', 'cooking', 'snack', 'backen', 'baking', 'kuchen', 'cake'], seedBase: 'food', count: 8 },
  { keywords: ['schlafen', 'ruhe', 'nacht', 'sleep', 'rest', 'night', 'mond', 'moon', 'bett', 'bed'], seedBase: 'night', count: 8 },
  { keywords: ['kunst', 'malen', 'farbe', 'art', 'paint', 'creative', 'basteln', 'zeichnung', 'drawing'], seedBase: 'art', count: 8 },
  { keywords: ['sonne', 'licht', 'sun', 'light', 'sonnenaufgang', 'sonnenuntergang', 'sunset'], seedBase: 'sunrise', count: 8 },
  { keywords: ['verbindung', 'liebe', 'herz', 'connection', 'love', 'heart', 'familie', 'family', 'umarmung', 'hug'], seedBase: 'people', count: 8 },
  { keywords: ['spiel', 'game', 'puzzle', 'brettspiel', 'boardgame'], seedBase: 'game', count: 6 },
  { keywords: ['cafe', 'café', 'restaurant'], seedBase: 'cafe', count: 6 },
  { keywords: ['rezept', 'recipe'], seedBase: 'recipe', count: 6 },
  { keywords: ['stadt', 'city', 'straße', 'street', 'architektur', 'architecture'], seedBase: 'city', count: 6 },
  { keywords: ['sport', 'fitness', 'training', 'workout'], seedBase: 'fitness', count: 6 },
  { keywords: ['film', 'kino', 'movie', 'serie', 'series'], seedBase: 'movie', count: 6 },
  { keywords: ['pflanze', 'plant', 'blume', 'flower'], seedBase: 'plant', count: 8 },
  { keywords: ['app', 'handy', 'phone', 'technik', 'tech'], seedBase: 'tech', count: 6 },
  { keywords: ['reise', 'travel', 'urlaub', 'vacation', 'flugzeug', 'airplane'], seedBase: 'travel', count: 8 },
  { keywords: ['winter', 'schnee', 'snow', 'kalt', 'cold'], seedBase: 'winter', count: 6 },
  { keywords: ['herbst', 'autumn', 'fall', 'blätter', 'leaves'], seedBase: 'autumn', count: 6 },
  { keywords: ['sommer', 'summer'], seedBase: 'summer', count: 6 },
  { keywords: ['frühling', 'spring', 'blüte', 'blossom'], seedBase: 'spring', count: 6 },
];

const FALLBACK_SEED_BASE = 'calm';
const FALLBACK_COUNT = 14;

function photoUrl(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/480/360`;
}

function seededUrls(seedBase: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => photoUrl(`${seedBase}-${i + 1}`));
}

const FALLBACK_IMAGES = seededUrls(FALLBACK_SEED_BASE, FALLBACK_COUNT);

/** Suggests real photo URLs for a resource/bridge, based on its name
 * (and optional extra context like a category label). Matched-theme
 * photos are favored over generic fallbacks, topped up with fallbacks
 * so there are always enough options. Shuffled per call so the visible
 * subset and order vary between openings, while individual photo URLs
 * themselves stay stable (same seed → same photo) once one is picked
 * and saved.
 *
 * "Zu wenig Optionen"-Auftrag — raised the cap from 6 to 18 and gave
 * every theme substantially more seeded photos (most themes now offer
 * 6-10 each instead of 2-4), so someone scrolling the carousel
 * actually has a real range to pick from instead of running out after
 * a couple of taps. The carousel itself (ImageSuggestionCarousel)
 * already supports scrolling through many images — this was purely a
 * data-layer limit. */
export function suggestImagesFor(name: string, extra?: string): string[] {
  const haystack = `${name} ${extra ?? ''}`.toLowerCase();
  const matched = THEMES.filter((t) => t.keywords.some((k) => haystack.includes(k)));
  const pool = matched.length > 0 ? matched.flatMap((t) => seededUrls(t.seedBase, t.count)) : [];
  const combined = [...pool, ...FALLBACK_IMAGES];
  const seen = new Set<string>();
  const unique = combined.filter((url) => (seen.has(url) ? false : (seen.add(url), true)));
  const shuffled = [...unique];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const poolSet = new Set(pool);
  shuffled.sort((a, b) => Number(poolSet.has(b)) - Number(poolSet.has(a)));
  return shuffled.slice(0, 18);
}
