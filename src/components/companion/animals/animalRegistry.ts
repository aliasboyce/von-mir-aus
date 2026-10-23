import type { ComponentType } from 'react';
import type { CompanionCategory } from '../companionRegistry';
import type { LichtwesenMovement } from '../lichtwesen';
import type { ArtOpts, ArtProps, Pal } from './kit';
import type { ExtraKind } from './extras';
import { Baer, Hund, Katze, Wolf } from './artsA';
import { Eule, Erdmaennchen, Esel, Kraehe, Otter } from './artsB';
import { Axolotl, Einhorn, Gans, Schweinchen } from './artsC';
import { Drache, Dino, Eisvogel, Papagei } from './artsD';
import { Collie, Glueckskatze, Labrador, Pudel } from './artsE';
import { Corgi, Piepmatz } from './artsF';

export type AnimalId =
  | 'wolf' | 'eule' | 'kraehe' | 'esel' | 'katze' | 'hund' | 'otter' | 'erdmaennchen' | 'schweinchen' | 'axolotl' | 'baer' | 'gans' | 'einhorn'
  | 'papagei' | 'drache' | 'dino' | 'eisvogel' | 'pudel' | 'labrador' | 'collie' | 'glueckskatze' | 'corgi' | 'piepmatz';

/** how an animal moves when it walks / runs – never the floating of the light beings */
export type Idle = 'dog' | 'cat' | 'wolf' | 'owl' | 'bird' | 'donkey' | 'water' | 'calm' | 'pig' | 'sway' | 'goose' | 'dragon' | 'stomp';

export type Gait = 'trot' | 'gallop' | 'slink' | 'waddle' | 'hop' | 'lumber' | 'fly' | 'swim' | 'stomp' | 'scurry' | 'bound';

export interface AnimalVariant {
  id: string;
  name: string;
  /** merged over the species palette */
  pal: Partial<Pal>;
  /** art options this variant comes with (e.g. the harness, a head tilt) */
  opt?: ArtOpts;
}

export interface AnimalConfig {
  id: AnimalId;
  name: string;
  /** colour of the first variant – used for dots / tinting in the UI */
  color: string;
  /** the soft halo behind the animal */
  glow: string;
  trait: string;
  /** reuses the idle movements of the light beings */
  movement: LichtwesenMovement;
  gait: Gait;
  /** how it behaves when it just sits there (grounded, species typical – never the floating of the light beings) */
  idle: Idle;
  /** species specific things to WEAR (besides the general ones) */
  extras: ExtraKind[];
  /** things it can have with it / hold (the animal shows one of them) */
  items: ExtraKind[];
  /** what it has with it when nothing was chosen */
  defaultItem?: ExtraKind;
  /** where the item sits (viewBox coordinates) and whether little paws hold it */
  itemPlace?: [number, number];
  itemHands?: boolean;
  preferredCategories: CompanionCategory[];
  /** dogs can wear a harness */
  harness?: boolean;
  Art: ComponentType<ArtProps>;
  variants: AnimalVariant[];
}

const v = (id: string, name: string, pal: Partial<Pal>, opt?: ArtOpts): AnimalVariant => ({ id, name, pal, opt });

/** every animal's variants are complete palettes (so previews and swatches never depend on a base) */
export const ANIMALS: AnimalConfig[] = [
  {
    id: 'wolf', name: 'Wolf', color: '#8d9bb3', glow: '#dbe3ef', trait: 'Treu und wachsam – bleibt an deiner Seite.', movement: 'tilt-steady', gait: 'trot', idle: 'wolf', extras: ['blattkrone'], items: ['mond'], preferredCategories: ['ermutigung', 'beruhigend'], Art: Wolf,
    variants: [
      v('grau', 'Grauwolf', { body: '#8d9bb3', belly: '#eef1f6', dark: '#5c6a82', accent: '#5c6a82', iris: '#d9a53a' }),
      v('weiss', 'Polarwolf', { body: '#eceef3', belly: '#ffffff', dark: '#b6bfd0', accent: '#b6bfd0', iris: '#d9a53a' }),
      v('schwarz', 'Schwarzer Wolf', { body: '#3d4252', belly: '#868ea2', dark: '#1f2330', accent: '#1f2330', iris: '#e0a93a' }),
    ],
  },
  {
    id: 'eule', name: 'Eule', color: '#b8895f', glow: '#f1dfc9', trait: 'Wach und weise – hört erst ruhig zu.', movement: 'still-deep', gait: 'fly', idle: 'owl', extras: ['doktorhut'], items: ['buch'], preferredCategories: ['erklaerung', 'kontext'], Art: Eule,
    variants: [
      v('kauz', 'Waldkauz', { body: '#b8895f', belly: '#fbf0da', dark: '#8a6340', accent: '#f6a93f', iris: '#e89a3c' }),
      v('schleier', 'Schleiereule', { body: '#dcae6c', belly: '#fff6e6', dark: '#b98649', accent: '#f1b97a', iris: '#2b2230' }),
      v('grau', 'Graue Eule', { body: '#9aa0a8', belly: '#eceef1', dark: '#6f757e', accent: '#f2c14b', iris: '#f2c14b' }),
    ],
  },
  {
    id: 'kraehe', name: 'Krähe', color: '#2f3243', glow: '#cfd4ea', trait: 'Schlau und neugierig – sammelt kleine Glanzmomente.', movement: 'quick-alert', gait: 'fly', idle: 'bird', extras: ['zylinder'], items: ['muenze', 'diamant', 'schluessel', 'ring', 'perle'], defaultItem: 'muenze', itemPlace: [24, 108], preferredCategories: ['tipp', 'humorvoll'], Art: Kraehe,
    variants: [
      v('rabe', 'Rabenkrähe (schwarz)', { body: '#2f3243', belly: '#42465a', dark: '#1d1f2b', accent: '#8087a0', x1: '#fff8ee' }),
      v('nebel', 'Nebelkrähe', { body: '#aaacb6', belly: '#c6c8d0', dark: '#2a2c37', accent: '#666b80', x2: '#2f3243', x1: '#fff8ee' }),
      v('dohle', 'Dohle', { body: '#3b3e4c', belly: '#4f5366', dark: '#262935', accent: '#7b8095', x2: '#2b2d38', x3: '#a3a7b5', iris: '#cfe6f0', x1: '#e6f1f4' }),
    ],
  },
  {
    id: 'esel', name: 'Esel', color: '#b5aaa0', glow: '#ebe5df', trait: 'Gelassen – nimmt sich alle Zeit der Welt.', movement: 'sway-slow', gait: 'trot', idle: 'donkey', extras: ['strohhut'], items: ['karotte', 'apfel'], preferredCategories: ['beruhigend', 'humorvoll'], Art: Esel,
    variants: [
      v('grau', 'Grauesel', { body: '#b5aaa0', belly: '#f7efe4', dark: '#5f5654', accent: '#7b6b66', x1: '#f7b4bf' }),
      v('braun', 'Brauner Esel', { body: '#8b6445', belly: '#e8d4b9', dark: '#4a3527', accent: '#5e4636', x1: '#e9a7a0' }),
      v('weiss', 'Weißer Esel', { body: '#f1ede7', belly: '#ffffff', dark: '#b9afa7', accent: '#b9a9a2', x1: '#f7c3cb' }),
    ],
  },
  {
    id: 'katze', name: 'Katze', color: '#f2a65e', glow: '#fde3c4', trait: 'Mag es warm und ruhig – und schnurrt, wenn du dir Zeit lässt.', movement: 'drift-shy', gait: 'slink', idle: 'cat', extras: ['glocke'], items: ['wollknaeuel', 'fisch'], preferredCategories: ['beruhigend', 'positiv'], Art: Katze,
    variants: [
      v('rot', 'Rot getigert', { body: '#f2a65e', belly: '#fff1de', dark: '#c9732b', accent: '#ffb9c2' }),
      v('grau', 'Grau getigert', { body: '#9ba1ac', belly: '#eaedf2', dark: '#5f6673', accent: '#ffb9c2' }),
      v('schwarz', 'Schwarze Katze', { body: '#37323f', belly: '#4f4859', dark: '#201d27', accent: '#c78ea0', iris: '#e3c24a' }),
    ],
  },
  {
    id: 'hund', name: 'Hund', color: '#e3ab6a', glow: '#f9e3c3', trait: 'Freut sich jedes Mal, dich zu sehen.', movement: 'bounce-joy', gait: 'gallop', idle: 'dog', extras: ['halsband'], items: ['knochen', 'ball'], preferredCategories: ['positiv', 'ermutigung'], harness: true, Art: Hund,
    variants: [
      v('braun', 'Braun-weiß', { body: '#e3ab6a', belly: '#fbe8c8', dark: '#a8703a', accent: '#fff2d6' }),
      v('lohe', 'Schwarz mit Lohe', { body: '#3b3541', belly: '#c88a4e', dark: '#26222b', accent: '#c88a4e' }),
      v('creme', 'Creme', { body: '#f0d19a', belly: '#fff6e2', dark: '#d7a762', accent: '#ffffff' }),
    ],
  },
  {
    id: 'otter', name: 'Otter', color: '#93694a', glow: '#ecd9c6', trait: 'Verspielt und zärtlich – hält gern etwas Schönes fest.', movement: 'pulse-warm', gait: 'swim', idle: 'water', extras: ['taucherbrille', 'blattkrone'], items: ['muschel', 'stein', 'fisch', 'seestern', 'perle'], defaultItem: 'muschel', itemPlace: [50, 98], itemHands: true, preferredCategories: ['positiv', 'humorvoll'], Art: Otter,
    variants: [
      v('braun', 'Flussotter', { body: '#93694a', belly: '#f6e7cf', dark: '#6e4a30' }),
      v('dunkel', 'Dunkler Otter', { body: '#5d4838', belly: '#cdb596', dark: '#3b2c22' }),
      v('creme', 'Seeotter', { body: '#b8997a', belly: '#f6ecda', dark: '#8c6f50' }),
    ],
  },
  {
    id: 'erdmaennchen', name: 'Erdmännchen', color: '#dcbb8d', glow: '#f6ead7', trait: 'Hält Ausschau, damit du dich sicher fühlen kannst.', movement: 'precise-hover', gait: 'scurry', idle: 'calm', extras: ['strohhut'], items: ['fernglas'], preferredCategories: ['kontext', 'funktionshinweis'], Art: Erdmaennchen,
    variants: [
      v('sand', 'Sandfarben', { body: '#dcbb8d', belly: '#f6e5c4', dark: '#5a4636', accent: '#8a6648' }),
      v('hell', 'Hell', { body: '#ecd9b4', belly: '#fbf0d9', dark: '#7a6247', accent: '#b79a74' }),
      v('dunkel', 'Dunkel', { body: '#b38d60', belly: '#e3c89b', dark: '#40301f', accent: '#5c4330' }),
    ],
  },
  {
    id: 'schweinchen', name: 'Schweinchen', color: '#f9b7c3', glow: '#fde1e7', trait: 'Gemütlich und zufrieden mit kleinen Dingen.', movement: 'pulse-warm', gait: 'waddle', idle: 'pig', extras: ['fliege'], items: ['apfel'], preferredCategories: ['positiv', 'beruhigend'], Art: Schweinchen,
    variants: [
      v('rosa', 'Rosa', { body: '#f9b7c3', belly: '#fdd9e0', dark: '#dd8498', accent: '#f79aae', x2: '#ff9fb4' }),
      v('sattel', 'Sattelschwein', { body: '#3d3a45', belly: '#5a5663', dark: '#25222c', accent: '#f2a3b3', x1: '#f6f1ea', x2: '#e98fa4' }),
      v('duroc', 'Duroc (rotbraun)', { body: '#a85a35', belly: '#cc8358', dark: '#7c3c20', accent: '#d98a72', x2: '#d8826c' }),
    ],
  },
  {
    id: 'axolotl', name: 'Axolotl', color: '#fbd0d9', glow: '#fdeaf0', trait: 'Lächelt immer – und wächst langsam wieder nach. Wie du.', movement: 'rise-gentle', gait: 'swim', idle: 'water', extras: ['seerose', 'taucherbrille'], items: ['perle', 'seestern'], preferredCategories: ['ermutigung', 'beruhigend'], Art: Axolotl,
    variants: [
      v('rosa', 'Rosa (Leuzistisch)', { body: '#fbd0d9', belly: '#fde7ed', dark: '#f27d98', accent: '#ffa9bb' }),
      v('wild', 'Wildfarben', { body: '#6e6c50', belly: '#8f8c6c', dark: '#8d3c3c', accent: '#c25c5c', x1: '#d9bd5c' }),
      v('gold', 'Gold', { body: '#f6d66e', belly: '#fbe9ab', dark: '#f1a262', accent: '#ffc98c' }),
    ],
  },
  {
    id: 'baer', name: 'Bär', color: '#a9774f', glow: '#eddcca', trait: 'Warm wie eine Umarmung. Brummt ganz sanft.', movement: 'sway-slow', gait: 'lumber', idle: 'sway', extras: ['blattkrone'], items: ['honigtopf'], preferredCategories: ['beruhigend', 'ermutigung'], Art: Baer,
    variants: [
      v('braun', 'Braunbär', { body: '#a9774f', belly: '#d9b48a', dark: '#cf9f70' }),
      v('schwarz', 'Schwarzbär', { body: '#3b3537', belly: '#5b5154', dark: '#b58a5f' }),
      v('eis', 'Eisbär', { body: '#f5f2eb', belly: '#ffffff', dark: '#e0d8ca' }),
    ],
  },
  {
    id: 'gans', name: 'Gans', color: '#fdfdf8', glow: '#eef1f7', trait: 'Sagt klar, was Sache ist – und beschützt dich dabei.', movement: 'tilt-steady', gait: 'waddle', idle: 'goose', extras: ['schal', 'fliege'], items: ['kleeblatt'], preferredCategories: ['erklaerung', 'funktionshinweis'], Art: Gans,
    variants: [
      v('weiss', 'Weiße Gans', { body: '#fdfdf8', belly: '#ffffff', dark: '#e7e7e0', accent: '#ffa83a', x3: '#eeeee6' }),
      v('grau', 'Graugans', { body: '#a59c90', belly: '#d8d1c6', dark: '#7e766b', accent: '#f2a05a', x2: '#e8a6a0', x3: '#867e73' }),
      v('nil', 'Nilgans', { body: '#c79d6e', belly: '#ead7b8', dark: '#8e6a44', accent: '#f08a9b', x1: '#7a4a2b', x2: '#f08a9b', x3: '#9c7148' }),
    ],
  },
  {
    id: 'einhorn', name: 'Einhorn', color: '#f8f1ff', glow: '#eadcf8', trait: 'Glitzert, wenn du ein bisschen Glitzer brauchst.', movement: 'rise-gentle', gait: 'gallop', idle: 'sway', extras: ['sterne', 'blattkrone'], items: ['mond', 'kleeblatt'], preferredCategories: ['positiv', 'humorvoll'], Art: Einhorn,
    variants: [
      v('schimmel', 'Schimmel', { body: '#f8f1ff', belly: '#ffffff', dark: '#ffcf5c', accent: '#ffd166', nose: '#ffd3e4', x1: undefined }),
      v('rappe', 'Rappe', { body: '#3f3a52', belly: '#5a5470', dark: '#ffcf5c', accent: '#c9a7ff', nose: '#7b6b9e', x1: '#6a5bd0', x2: '#9a7bf0', x3: '#4cc3ff', iris: '#f0c4ff' }),
      v('palomino', 'Palomino', { body: '#f1cf8e', belly: '#fbe9c4', dark: '#d7a345', accent: '#fff0a8', nose: '#f6b9a5', x1: '#fff3d6', x2: '#ffe3a1', x3: '#ffd27a' }),
    ],
  },
  {
    id: 'papagei', name: 'Papagei', color: '#d9333a', glow: '#fbd3d3', trait: 'Bunt und gesprächig – freut sich über jedes Wort von dir.', movement: 'quick-alert', gait: 'fly', idle: 'bird', extras: ['kopfhoerer', 'sonnenbrille'], items: ['note'], preferredCategories: ['humorvoll', 'positiv'], Art: Papagei,
    variants: [
      v('rot', 'Scharlachara (rot)', { body: '#d9333a', belly: '#e75650', dark: '#1c4fa8', accent: '#f7c92d', x1: '#fff8f0' }),
      v('blaugelb', 'Blau-Gelb-Ara', { body: '#2d77d1', belly: '#f6c630', dark: '#1d4f9a', accent: '#3a9ae6', x1: '#fff8f0' }),
      v('gruen', 'Soldatenara (grün)', { body: '#3da45b', belly: '#78c478', dark: '#2b5fb0', accent: '#e24b3b', x1: '#fff8f0' }),
    ],
  },
  {
    id: 'drache', name: 'Drache', color: '#5bbf7a', glow: '#d6f2de', trait: 'Klein, warm und feurig – wärmt dich, ohne etwas zu verbrennen.', movement: 'sway-slow', gait: 'fly', idle: 'dragon', extras: ['blattkrone'], items: ['schatz', 'diamant'], preferredCategories: ['ermutigung', 'humorvoll'], Art: Drache,
    variants: [
      v('gruen', 'Grüner Drache', { body: '#5bbf7a', belly: '#f2e3a1', dark: '#3a8f57', accent: '#9ee08a', x1: '#f7ecd0' }),
      v('rot', 'Roter Drache', { body: '#e2574c', belly: '#ffd48a', dark: '#a8332c', accent: '#f59a4a', x1: '#f7ecd0' }),
      v('blau', 'Blauer Drache', { body: '#5a8fe0', belly: '#e6f0ff', dark: '#3a64b0', accent: '#9cc4ff', x1: '#f7ecd0' }),
    ],
  },
  {
    id: 'dino', name: 'Dino', color: '#7bc47f', glow: '#dcf1dc', trait: 'Kleiner Stampfer mit großem Herz – nimmt sich Raum, ohne laut zu sein.', movement: 'bounce-joy', gait: 'stomp', idle: 'stomp', extras: ['eierschale'], items: ['farn'], preferredCategories: ['positiv', 'ermutigung'], Art: Dino,
    variants: [
      v('gruen', 'Grüner Dino', { body: '#7bc47f', belly: '#e8f3c4', dark: '#4f9a58', accent: '#f08a4b' }),
      v('orange', 'Oranger Dino', { body: '#f4a152', belly: '#fde8c0', dark: '#c8553a', accent: '#c8553a' }),
      v('blau', 'Blaugrauer Dino', { body: '#8aa4c4', belly: '#e6edf6', dark: '#5b7aa6', accent: '#5b7aa6' }),
    ],
  },
  {
    id: 'eisvogel', name: 'Eisvogel', color: '#1fa6b8', glow: '#cdeef2', trait: 'Still, bis der richtige Moment kommt – dann blitzt er auf.', movement: 'precise-hover', gait: 'fly', idle: 'bird', extras: ['taucherbrille'], items: ['fisch'], preferredCategories: ['kontext', 'tipp'], Art: Eisvogel,
    variants: [
      v('tuerkis', 'Gemeiner Eisvogel', { body: '#1fa6b8', belly: '#f28c38', dark: '#0f6f86', accent: '#f28c38', x1: '#2a2a33', x2: '#f28c38', x3: '#fffaf0' }),
      v('guertel', 'Gürtelfischer (blaugrau)', { body: '#5f7ea6', belly: '#f6f7fa', dark: '#3d5878', accent: '#5f7ea6', x1: '#2a2a33', x2: '#5f7ea6', x3: '#ffffff' }),
      v('liest', 'Jägerliest (braun)', { body: '#8b6a4a', belly: '#f3e6d0', dark: '#6a4c31', accent: '#f3e6d0', x1: '#d8c79e', x2: '#e9d9bd', x3: '#fffaf0' }),
    ],
  },
  {
    id: 'pudel', name: 'Pudel', color: '#b5561f', glow: '#f6d9c3', trait: 'Lockig und aufmerksam – schaut dich an, als würde er jedes Wort verstehen.', movement: 'bounce-joy', gait: 'gallop', idle: 'dog', extras: ['halsband'], items: ['knochen', 'ball'], preferredCategories: ['positiv', 'ermutigung'], harness: true, Art: Pudel,
    variants: [
      v('rot', 'Rot', { body: '#b5561f', belly: '#d98a4a', dark: '#8e3f17', accent: '#d68446', nose: '#1d1a1f', iris: '#2b2230' }),
      v('schwarz', 'Schwarz', { body: '#2f2c35', belly: '#4a4652', dark: '#1f1c25', accent: '#45414e', nose: '#0f0e12' }),
      v('apricot', 'Apricot', { body: '#e9b27a', belly: '#f6d3a8', dark: '#cd8e55', accent: '#f6cf9f', nose: '#2a2024' }),
    ],
  },
  {
    id: 'labrador', name: 'Labrador', color: '#5a3426', glow: '#e9d6cb', trait: 'Treuer Blick, weiche Ohren – bleibt einfach bei dir.', movement: 'bounce-joy', gait: 'trot', idle: 'dog', extras: ['halsband'], items: ['knochen', 'ball'], preferredCategories: ['beruhigend', 'positiv'], harness: true, Art: Labrador,
    variants: [
      v('schoko', 'Schoko', { body: '#5a3426', belly: '#6b402e', dark: '#46271b', accent: '#6e4331', nose: '#4a2b24', iris: '#b8a24a' }, { harness: true }),
      v('schwarz', 'Schwarz', { body: '#2f2b30', belly: '#3d383f', dark: '#1f1c21', accent: '#3b363d', nose: '#18161a', iris: '#8a5a2b' }),
      v('gelb', 'Gelb', { body: '#e8c58a', belly: '#f6e2bd', dark: '#d3a766', accent: '#f1d9a6', nose: '#a77a6a', iris: '#8a5a2b' }),
    ],
  },
  {
    id: 'collie', name: 'Collie', color: '#7a3f2b', glow: '#ecd6c9', trait: 'Aufmerksam und klug – hört zu, bevor er antwortet.', movement: 'tilt-steady', gait: 'gallop', idle: 'dog', extras: ['halsband'], items: ['knochen', 'ball'], preferredCategories: ['erklaerung', 'ermutigung'], harness: true, Art: Collie,
    variants: [
      v('rotweiss', 'Rot-weiß', { body: '#7a3f2b', belly: '#fbf7f0', dark: '#5e2f20', accent: '#ffffff', nose: '#3b2a2a', iris: '#b2782a' }),
      v('schwarzbrust', 'Schwarz mit weißer Brust', { body: '#23222b', belly: '#f4f1ea', dark: '#17161c', accent: '#23222b', nose: '#1a1a1e', iris: '#c9732b', x1: '#4a4955', x2: 'small', x3: '#2c2b34' }, { tilt: -9 }),
      v('schwarzweiss', 'Schwarz-weiß', { body: '#25242c', belly: '#fbf8f2', dark: '#17161c', accent: '#ffffff', nose: '#1a1a1e', iris: '#a8762c' }),
    ],
  },
  {
    id: 'glueckskatze', name: 'Glückskatze', color: '#e8923f', glow: '#fbe1c5', trait: 'Dreifarbig und neugierig – Glückskatzen bringen Glück.', movement: 'drift-shy', gait: 'slink', idle: 'cat', extras: ['glocke'], items: ['kleeblatt', 'wollknaeuel'], preferredCategories: ['positiv', 'tipp'], Art: Glueckskatze,
    variants: [
      v('calico', 'Glückskatze (dreifarbig)', { body: '#e8923f', belly: '#fffaf3', dark: '#2a2630', accent: '#f3a9b0', iris: '#a68a52' }),
      v('tuxedo', 'Schwarz-weiß', { body: '#2a2630', belly: '#fffaf3', dark: '#2a2630', accent: '#f3a9b0', iris: '#c9b24a' }),
      v('graueweiss', 'Grau-weiß', { body: '#8d95a3', belly: '#fffaf3', dark: '#5c6370', accent: '#f3a9b0', iris: '#7fb08a' }),
    ],
  },
  {
    id: 'corgi', name: 'Corgi', color: '#e8943c', glow: '#fbe0c2', trait: 'Kurze Beine, großes Herz – watschelt los, sobald du da bist.', movement: 'bounce-joy', gait: 'trot', idle: 'dog', extras: ['halsband'], items: ['knochen', 'ball'], preferredCategories: ['positiv', 'humorvoll'], Art: Corgi,
    variants: [
      v('rotweiss', 'Rot-Weiß', { body: '#e8943c', belly: '#fffaf0', dark: '#cf7a2a', accent: '#fffaf0', nose: '#2b2230', iris: '#6a4326' }),
      v('tricolor', 'Tricolor', { body: '#33303a', belly: '#fffaf0', dark: '#26232c', accent: '#fffaf0', nose: '#1d1a1f', iris: '#7a4a2b', x1: '#d9893f' }),
      v('falb', 'Hellfalb', { body: '#eac48c', belly: '#fffaf0', dark: '#cc9e62', accent: '#fffaf0', nose: '#3a2c2c', iris: '#6a4326' }),
    ],
  },
  {
    id: 'piepmatz', name: 'Piepmatz', color: '#fbe3c8', glow: '#fdeedd', trait: 'Klein, rund und immer am Zwitschern – freut sich einfach, dass du da bist.', movement: 'quick-alert', gait: 'fly', idle: 'bird', extras: [], items: ['koernchen', 'note'], preferredCategories: ['positiv', 'tipp'], Art: Piepmatz,
    variants: [
      v('kueken', 'Flauschküken (orange)', { body: '#fbe3c8', belly: '#fff3e2', dark: '#f39a4c', accent: '#f28a3c', iris: '#3f9aa8', x2: '#f6a45a' }),
      v('spatz', 'Spatz', { body: '#b88e63', belly: '#f0e4d0', dark: '#7a5638', accent: '#d8a85a', iris: '#4a3140', x1: '#f2e8d8', x2: '#a5532f' }),
      v('meise', 'Blaumeise', { body: '#f0dc52', belly: '#fbf2a8', dark: '#4a86d0', accent: '#3b3b44', iris: '#3a2c3a', x1: '#ffffff', x2: '#5b97dc' }),
    ],
  },
];

export const getAnimal = (id: string | undefined): AnimalConfig | undefined => ANIMALS.find((a) => a.id === id);

/** the complete palette of one variant */
export function palOf(animal: AnimalConfig, variantId?: string): Pal {
  const variant = animal.variants.find((x) => x.id === variantId) ?? animal.variants[0];
  const p = variant.pal;
  return {
    body: p.body ?? animal.color,
    belly: p.belly ?? '#ffffff',
    dark: p.dark ?? '#555555',
    accent: p.accent ?? '#ffffff',
    nose: p.nose,
    iris: p.iris,
    x1: p.x1,
    x2: p.x2,
    x3: p.x3,
  };
}

export function variantOf(animal: AnimalConfig, variantId?: string): AnimalVariant {
  return animal.variants.find((x) => x.id === variantId) ?? animal.variants[0];
}
