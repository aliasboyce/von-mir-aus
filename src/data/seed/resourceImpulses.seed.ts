import type { Resource } from '../types';
import { suggestImagesFor } from '../../components/shared/imageSuggestionLibrary';

// Point 4 — delegates to the local themed SVG icon library instead of
// picsum.photos (arbitrary photo per seed string, unrelated to what the
// seed word actually meant). These seed keys were already short
// semantic hints (e.g. 'res-buch'), which still work fine as keyword
// input since the matcher does substring matching.
const img = (seed: string) => suggestImagesFor(seed)[0];

/**
 * A curated pool of resource ideas the person hasn't saved themselves —
 * surfaced via "Ressourcen entdecken", mirroring the bridge-impulse
 * pattern exactly (same adopted-tracking mechanism, same "don't show
 * again once adopted" behavior). Deliberately not limited to classic
 * "self-care" ideas — resources in this app can be things to remember
 * for later just as much as things to use right now, so the pool spans
 * objects, media, places, people, animals, activities, memories, and
 * sensory things.
 */
export interface ResourceImpulse extends Omit<Resource, 'id' | 'createdAt' | 'updatedAt'> {
  impulseId: string;
}

export const RESOURCE_IMPULSES: ResourceImpulse[] = [
  {
    impulseId: 'lieblingsbuch',
    title: 'Ein Buch, das du schon mal lesen wolltest',
    description: 'Nicht um es sofort zu lesen — nur um es dir zu merken.',
    category: 'texte',
    image: img('res-buch'),
    tags: ['später'],
    favorite: false,
  },
  {
    impulseId: 'kindheitsgeruch',
    title: 'Ein Geruch aus deiner Kindheit',
    description: 'Etwas, das dich sofort an eine bestimmte Zeit erinnert.',
    category: 'sonstiges',
    image: img('res-geruch'),
    tags: ['Sinne'],
    favorite: false,
  },
  {
    impulseId: 'trostperson',
    title: 'Eine Person, bei der du dich sicher fühlst',
    description: 'Muss niemand sein, den du oft siehst — nur jemand, an den du denken kannst.',
    category: 'menschen',
    image: img('res-person'),
    tags: [],
    favorite: false,
  },
  {
    impulseId: 'lieblingstier',
    title: 'Ein Tier, das dich beruhigt',
    description: 'Ein eigenes Haustier, ein Tier aus der Nachbarschaft, oder einfach eine Tierart, die du magst.',
    category: 'sonstiges',
    image: img('res-tier'),
    tags: [],
    favorite: false,
  },
  {
    impulseId: 'foto-lieblingsort',
    title: 'Ein Foto von einem Ort, der dir guttut',
    description: 'Egal ob echt oder nur ein Bild, das genauso aussieht.',
    category: 'orte',
    image: img('res-ortfoto'),
    tags: [],
    favorite: false,
  },
  {
    impulseId: 'beruhigende-playlist',
    title: 'Eine Playlist für schwierige Momente',
    description: 'Musik, die du dir für genau solche Tage zusammenstellen möchtest.',
    category: 'musik',
    image: img('res-playlist'),
    tags: ['für später'],
    favorite: false,
  },
  {
    impulseId: 'kuscheliges-objekt',
    title: 'Etwas mit einer angenehmen Textur',
    description: 'Eine weiche Decke, ein bestimmter Pullover, ein Kissen.',
    category: 'sonstiges',
    image: img('res-textur'),
    tags: ['Sinne'],
    favorite: false,
  },
  {
    impulseId: 'ausprobieren-spiel',
    title: 'Ein Spiel, das du mal ausprobieren möchtest',
    description: 'Brettspiel, Videospiel, egal — einfach etwas, das Neugier weckt.',
    category: 'sonstiges',
    image: img('res-spiel'),
    tags: ['später ausprobieren'],
    favorite: false,
  },
  {
    impulseId: 'spaziergang-strecke',
    title: 'Eine Strecke, die du gerne gehst',
    description: 'Ein Weg, der dir vertraut ist oder den du entdecken möchtest.',
    category: 'orte',
    image: img('res-strecke'),
    tags: [],
    favorite: false,
  },
  {
    impulseId: 'alte-erinnerung',
    title: 'Eine Erinnerung, die dich zum Lächeln bringt',
    description: 'Ein bestimmter Moment, festgehalten in ein paar Worten.',
    category: 'sonstiges',
    image: img('res-erinnerung'),
    tags: ['Erinnerung'],
    favorite: false,
  },
  {
    impulseId: 'dokumentarfilm',
    title: 'Ein Film oder eine Serie für ruhige Abende',
    description: 'Etwas Vertrautes, bei dem du nicht viel nachdenken musst.',
    category: 'videos',
    image: img('res-film'),
    tags: [],
    favorite: false,
  },
  {
    impulseId: 'wetterfeste-jacke',
    title: 'Ein persönliches Hilfsmittel',
    description: 'Etwas ganz Praktisches, das dir in bestimmten Momenten hilft.',
    category: 'sonstiges',
    image: img('res-hilfsmittel'),
    tags: ['praktisch'],
    favorite: false,
  },
  {
    impulseId: 'kunstwerk',
    title: 'Ein Kunstwerk, das dich berührt',
    description: 'Ein Bild, eine Fotografie, eine Skulptur — was dich anspricht.',
    category: 'sonstiges',
    image: img('res-kunst'),
    tags: [],
    favorite: false,
  },
  {
    impulseId: 'lieblingscafe',
    title: 'Ein Ort, an dem du gerne Zeit verbringst',
    description: 'Ein Café, eine Bibliothek, eine Parkbank — irgendein Ort.',
    category: 'orte',
    image: img('res-cafe'),
    tags: [],
    favorite: false,
  },
  {
    impulseId: 'podcast-folge',
    title: 'Ein Podcast, der dir Gesellschaft leistet',
    description: 'Etwas zum Zuhören, wenn Stille gerade zu viel ist.',
    category: 'videos',
    image: img('res-podcast'),
    tags: [],
    favorite: false,
  },
  {
    impulseId: 'handwerk',
    title: 'Etwas, das du mit den Händen herstellen möchtest',
    description: 'Basteln, Backen, Reparieren — eine Idee, die dich reizt.',
    category: 'uebungen',
    image: img('res-handwerk'),
    tags: ['später ausprobieren'],
    favorite: false,
  },
  {
    impulseId: 'sternenhimmel',
    title: 'Etwas, das dich klein und gleichzeitig ruhig fühlen lässt',
    description: 'Der Sternenhimmel, das Meer, ein weites Feld.',
    category: 'natur',
    image: img('res-sterne'),
    tags: [],
    favorite: false,
  },
  {
    impulseId: 'kindheitsspiel',
    title: 'Ein Spiel oder Ritual aus früheren Zeiten',
    description: 'Etwas, das du als Kind gerne gemacht hast.',
    category: 'sonstiges',
    image: img('res-kindheit'),
    tags: ['Erinnerung'],
    favorite: false,
  },
  {
    impulseId: 'gedicht',
    title: 'Ein Gedicht oder Zitat, das dich trägt',
    description: 'Ein paar Zeilen, die dir in schwierigen Momenten Halt geben.',
    category: 'texte',
    image: img('res-gedicht'),
    tags: [],
    favorite: false,
  },
  {
    impulseId: 'lieblingsrezept',
    title: 'Ein Gericht, das dich an etwas Gutes erinnert',
    description: 'Ein Rezept, das du kennst oder mal ausprobieren möchtest.',
    category: 'sonstiges',
    image: img('res-rezept'),
    tags: [],
    favorite: false,
  },
  {
    impulseId: 'wissenschaftliches-thema',
    title: 'Ein Thema, über das du gerne mehr wissen möchtest',
    description: 'Etwas, das deine Neugier weckt, ganz unabhängig von allem anderen.',
    category: 'wissen',
    image: img('res-wissen'),
    tags: ['später ausprobieren'],
    favorite: false,
  },
  {
    impulseId: 'wohltuende-bewegung',
    title: 'Eine Bewegung, die sich gut anfühlt',
    description: 'Tanzen, Dehnen, Schwimmen — was auch immer für dich passt.',
    category: 'uebungen',
    image: img('res-bewegung'),
    tags: [],
    favorite: false,
  },
  {
    impulseId: 'wichtiges-symbol',
    title: 'Ein kleiner Gegenstand mit Bedeutung',
    description: 'Etwas, das du bei dir tragen oder griffbereit haben möchtest.',
    category: 'sonstiges',
    image: img('res-symbol'),
    tags: ['praktisch'],
    favorite: false,
  },
];
