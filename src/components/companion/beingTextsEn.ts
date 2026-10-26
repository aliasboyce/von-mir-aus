import { getUiLanguage } from '../../services/uiLanguage';

/** English names and one-line descriptions of the light beings and animal companions (id → [name, trait]) */
export const BEING_EN: Record<string, [string, string]> = {
  froehlich: ['Cheerful', 'Loves to hop and is happy about little things.'],
  gemuetlich: ['Cosy', 'Likes it slow, warm and without hurry.'],
  besinnlich: ['Reflective', 'Likes to look quietly inward.'],
  ehrlich: ['Honest', 'Says it like it is – gently, but clearly.'],
  freundlich: ['Friendly', 'Is simply glad that you are here.'],
  heimlich: ['Secretive', 'Likes to stay a little hidden.'],
  morgendlich: ['Morning', 'Loves to be out early and fresh.'],
  verstaendlich: ['Understanding', 'Listens first before it says anything.'],
  troestlich: ['Comforting', 'Likes to move close when things are hard.'],
  feierlich: ['Festive', 'Thinks every day deserves a moment of shine.'],
  puenktlich: ['Punctual', 'Likes to keep an eye on the time.'],
  gruendlich: ['Thorough', 'Prefers to look at things twice.'],
  herbstlich: ['Autumnal', 'Likes transitions and calm change.'],
  naechtlich: ['Nocturnal', 'Is perfectly relaxed in the dark, too.'],
  verlaesslich: ['Reliable', 'Just stays, no matter what.'],
  dringlich: ['Urgent', 'Notices quickly when something matters.'],
  wolf: ['Wolf', 'Loyal and watchful – stays by your side.'],
  eule: ['Owl', 'Awake and wise – listens quietly first.'],
  kraehe: ['Crow', 'Clever and curious – collects small moments of shine.'],
  esel: ['Donkey', 'Easygoing – takes all the time in the world.'],
  katze: ['Cat', 'Likes it warm and calm – and purrs when you take your time.'],
  hund: ['Dog', 'Is happy every single time it sees you.'],
  otter: ['Otter', 'Playful and tender – likes to hold on to something lovely.'],
  erdmaennchen: ['Meerkat', 'Keeps watch so that you can feel safe.'],
  schweinchen: ['Piglet', 'Cosy and content with small things.'],
  axolotl: ['Axolotl', 'Always smiling – and slowly grows back. Like you.'],
  baer: ['Bear', 'Warm like a hug. Hums very softly.'],
  gans: ['Goose', 'Says clearly how things are – and protects you while doing so.'],
  einhorn: ['Unicorn', 'Sparkles when you need a little sparkle.'],
  papagei: ['Parrot', 'Colourful and chatty – happy about every word from you.'],
  drache: ['Dragon', 'Small, warm and fiery – warms you without burning anything.'],
  dino: ['Dino', 'A little stomper with a big heart – takes up space without being loud.'],
  eisvogel: ['Kingfisher', 'Still until the right moment comes – then it flashes.'],
  pudel: ['Poodle', 'Curly and attentive – looks at you as if it understood every word.'],
  labrador: ['Labrador', 'Loyal eyes, soft ears – simply stays with you.'],
  collie: ['Collie', 'Attentive and smart – listens before it answers.'],
  glueckskatze: ['Lucky cat', 'Three-coloured and curious – lucky cats bring luck.'],
  corgi: ['Corgi', 'Short legs, big heart – waddles over as soon as you are here.'],
  piepmatz: ['Little bird', 'Small, round and always chirping – simply happy that you are here.'],
};

/** turns `name` and `trait` of preset beings into getters that follow the app language */
export function localizeBeings<T extends { id: string; name: string; trait: string }>(list: T[]): T[] {
  list.forEach((b) => {
    const de = { name: b.name, trait: b.trait };
    Object.defineProperty(b, 'name', { get: () => (getUiLanguage() === 'en' ? BEING_EN[b.id]?.[0] ?? de.name : de.name), enumerable: true, configurable: true });
    Object.defineProperty(b, 'trait', { get: () => (getUiLanguage() === 'en' ? BEING_EN[b.id]?.[1] ?? de.trait : de.trait), enumerable: true, configurable: true });
  });
  return list;
}
