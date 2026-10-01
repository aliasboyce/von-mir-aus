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

/**
 * "Die 4 klassischen Basis-Module"-Auftrag — eight DBT skills, taken
 * from the person's own attached material, each saved once under the
 * module it actually belongs to. Two sensory-interrupt techniques
 * from the same source (strong smell/taste shock, rubber-band
 * snapping) are deliberately left out — too close to known self-harm
 * substitution patterns to store as standing content, regardless of
 * their legitimate clinical framing here. Added via
 * addMissingDbtSkills() in resourcesRepo.ts, not this array directly,
 * so existing installs gain them without losing anything they already
 * have — see that function's own comment for why.
 */
export const DBT_SKILL_RESOURCES: Resource[] = [
  {
    id: 'res_skill_tipp',
    title: 'TIPP-Skills',
    category: 'stresstoleranz',
    image: img('kaltes Wasser Gesicht Eis'),
    description:
      'Veränderung der Körperchemie, um bei sehr hoher Anspannung schnell herunterzukommen:\n\nTemperature: Das Gesicht kurz in kaltes Wasser tauchen oder ein Kühlpack in den Nacken legen — löst den Tauchreflex aus, der den Puls spürbar senkt.\n\nIntense Exercise: 50 Kniebeugen, sprinten oder Liegestütze bis zur Erschöpfung, um überschüssiges Adrenalin abzubauen.\n\nPaced Breathing: Tief in den Bauch einatmen (z. B. 4 Sekunden) und deutlich länger ausatmen (z. B. 7 Sekunden).\n\nPaired Muscle Relaxation: Muskelgruppen extrem fest anspannen und beim Ausatmen bewusst komplett lockerlassen.',
    tags: ['dbt', 'stresstoleranz', 'notfall'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_radikale_akzeptanz',
    title: 'Radikale Akzeptanz',
    category: 'stresstoleranz',
    image: img('Radikale Akzeptanz Ruhe'),
    description:
      'Eine Situation, die man absolut nicht ändern kann (z. B. einen verpassten Zug oder eine Trennung), im Geist vollkommen annehmen, statt dagegen anzukämpfen.\n\nDer Satz lautet: „Es ist jetzt genau so, wie es ist, auch wenn es mir nicht gefällt.“\n\nDas verhindert, dass aus Schmerz echtes Leiden wird.',
    tags: ['dbt', 'stresstoleranz'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_opposite_action',
    title: 'Entgegengesetztes Handeln (Opposite Action)',
    category: 'emotionsregulation',
    image: img('Opposite Action Handeln'),
    description:
      'Genau das Gegenteil von dem tun, was der emotionale Impuls verlangt.\n\nWenn die Depression/Traurigkeit sagt: „Bleib im Bett und zieh die Decke über den Kopf“ — bewusst aufstehen und unter Menschen gehen.\n\nWenn die Wut sagt: „Schrei die Person an“ — stattdessen leise sprechen und auf Abstand gehen.',
    tags: ['dbt', 'emotionsregulation'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_check_the_facts',
    title: 'Fakten-Check (Check the Facts)',
    category: 'emotionsregulation',
    image: img('Fakten Check Gedanken'),
    description:
      'Überprüfen, ob die Intensität der Emotion zur echten Situation passt.\n\nMan fragt sich: „Reagiere ich gerade auf die Realität oder auf meine Katastrophengedanken im Kopf?“',
    tags: ['dbt', 'emotionsregulation'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_please',
    title: 'PLEASE-Skills',
    category: 'emotionsregulation',
    image: img('PLEASE Skills Selbstfürsorge'),
    description:
      'Die körperliche Basis stabil halten, um weniger anfällig für Gefühlschaos zu sein:\n\nPhysicaL illness — körperliche Beschwerden behandeln (Arztbesuche).\nEat — ausgewogen essen.\nAvoid mood-altering substances — Drogen/Alkohol meiden.\nSleep — ausreichend schlafen.\nExercise — sich täglich bewegen.',
    tags: ['dbt', 'emotionsregulation', 'alltag'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_54321',
    title: 'Die 5-4-3-2-1 Methode',
    category: 'achtsamkeit',
    image: img('5-4-3-2-1 Erdung Sinne'),
    description:
      'Um sich im Raum zu verankern, benennt man laut oder leise:\n\n5 Dinge, die man sieht.\n4 Dinge, die man spüren kann.\n3 Dinge, die man hört.\n2 Dinge, die man riecht.\n1 Sache, die man schmeckt.',
    tags: ['dbt', 'achtsamkeit', 'erdung'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_wahrnehmen_beschreiben',
    title: 'Wahrnehmen und Beschreiben im Alltag',
    category: 'achtsamkeit',
    image: img('Achtsamkeit Kaffee Alltag'),
    description:
      'Eine alltägliche Sache (z. B. Zähneputzen oder Kaffeetrinken) absolut fokussiert tun.\n\nWenn man Kaffee trinkt, spürt man nur die Wärme der Tasse, riecht das Aroma und schmeckt den Geschmack — ohne nebenbei aufs Handy zu schauen oder über morgen nachzudenken.',
    tags: ['dbt', 'achtsamkeit', 'alltag'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_dear_man',
    title: 'DEAR MAN',
    category: 'zwischenmenschlich',
    image: img('DEAR MAN Gespräch'),
    description:
      'Ein Leitfaden für ein strukturiertes Gespräch, wenn man eine Bitte äußern oder „Nein“ sagen möchte:\n\nDescribe — die Situation sachlich beschreiben.\nExpress — eigene Gefühle/Meinung äußern.\nAssert — klar sagen, was man will oder nicht will.\nReinforce — die positiven Folgen für den anderen betonen.\nMindful — beim Thema bleiben (Schallplattenmethode).\nAppear confident — sicher und aufrecht auftreten.\nNegotiate — Kompromisse anbieten.',
    tags: ['dbt', 'zwischenmenschlich', 'kommunikation'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
];
