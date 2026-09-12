import type { Resource } from '../types';
import { suggestImagesFor } from '../../components/shared/imageSuggestionLibrary';

const now = new Date().toISOString();
// Point 4 — each seed example now gets an image that's actually about
// its own theme (a book icon for a reading resource, a teacup for
// warmth), not an arbitrary photo from a random seed string.
const img = (name: string) => suggestImagesFor(name)[0];

export const DEMO_RESOURCES: Resource[] = [
  {
    id: 'res_waldspaziergang',
    title: 'Waldspaziergang',
    category: 'natur',
    image: img('Waldspaziergang Natur Baum'),
    description: 'Der Geruch von feuchter Erde und Moos.',
    tags: ['natur', 'erdung'],
    favorite: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_klavier',
    title: 'Sanftes Piano',
    category: 'musik',
    image: img('Sanftes Piano Musik'),
    description: 'Beruhigende Melodien zum Abschalten.',
    tags: ['musik', 'ruhe'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_atemzitat',
    title: 'Atem holen',
    category: 'texte',
    image: img('Atem holen atmen'),
    description: 'Ein kurzer Hinweis, dass es reicht, einfach nur zu sein.',
    tags: ['zitat'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_waermequelle',
    title: 'Wärmequelle',
    category: 'sonstiges',
    image: img('Wärmequelle Tee Decke warm'),
    description: 'Eine warme Tasse Tee oder eine Decke.',
    tags: ['körper', 'wärme'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
];
