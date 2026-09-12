import type { Bridge } from '../types';
import { suggestImagesFor } from '../../components/shared/imageSuggestionLibrary';

/**
 * Point 4 — each bridge's image now actually matches its own theme (a
 * nature icon for the nature bridge, a phone icon for the contact
 * bridge) via the local SVG icon library, instead of an arbitrary
 * picsum.photos stock photo that had no real connection to the bridge's
 * content.
 */
const img = (name: string) => suggestImagesFor(name)[0];

export const DEMO_BRIDGES: Bridge[] = [
  {
    id: 'bridge_natur',
    title: '10 Minuten Natur',
    category: 'gedanken_werte_intra',
    image: img('Natur Spaziergang Baum'),
    description: 'Eine kleine Brücke in die Natur. Wähle das Level, das sich gerade richtig für dich anfühlt.',
    levels: [
      { level: 1, title: 'Durch das Fenster schauen', description: 'Sich nur für einen Moment hinsetzen und die Bäume draußen beobachten.' },
      { level: 2, title: 'Kurzer Ausblick', description: 'Vor der Tür stehen und für eine Minute die frische Luft spüren.' },
      { level: 3, title: 'Kurzer Spaziergang', description: 'Eine Runde um den Block gehen und den Boden unter den Füßen spüren.' },
      { level: 4, title: 'Tiefer eintauchen', description: 'Ein längerer Spaziergang in der Natur, um wirklich anzukommen.' },
    ],
    tip: 'Wenn es passt: benenne für dich fünf Dinge, die du gerade siehst. Das muss nicht laut oder besonders sein — es hilft schon, es einfach zu bemerken.',
    favorite: true,
    isCustom: false,
  },
  {
    id: 'bridge_atem',
    title: 'Zum Atem zurückkehren',
    category: 'koerper_intra',
    image: img('Atem atmen Wind'),
    description: 'Der Atem ist immer da — eine Brücke, die dich sanft in den Körper zurückholt.',
    levels: [
      { level: 1, title: 'Einmal bewusst durchatmen', description: 'Ein einzelner Atemzug, ohne Zählen, ohne Technik.' },
      { level: 2, title: 'Ein paar tiefe Atemzüge', description: 'Ein paar Atemzüge tief in die Nase — kein Zählen nötig, nur spüren.' },
      { level: 3, title: 'Ruhiger, gezählter Atem', description: 'Wenn es guttut: 4 Sekunden ein, kurze Pause, 4 Sekunden aus. Jederzeit abbrechbar.' },
      { level: 4, title: 'Längere Atemreise', description: 'Für einige Minuten dem eigenen Atem folgen, ohne ihn zu verändern.' },
    ],
    tip: 'Wenn Zählen sich eng oder kontrollierend anfühlt, lass es weg — einfach nur den Atem zu bemerken reicht vollkommen.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_kontakt',
    title: 'Anrufen & Sprechen',
    category: 'menschen_inter',
    image: img('Anruf Telefon Kontakt'),
    description: 'Ein kleiner Schritt zurück zu anderen Menschen — in deinem eigenen Tempo.',
    levels: [
      { level: 1, title: 'Kurze Nachricht schicken', description: 'Ein einzelnes Wort oder Emoji an jemanden senden, dem du vertraust.' },
      { level: 2, title: 'Eine vertraute Person anrufen', description: 'Ein kurzer Anruf — es muss nicht viel gesagt werden.' },
      { level: 3, title: 'Ein Gespräch beginnen', description: 'Aktiv erzählen, wie es dir gerade geht.' },
      { level: 4, title: 'Zeit gemeinsam verbringen', description: 'Sich verabreden oder gemeinsam Zeit verbringen.' },
    ],
    tip: 'Du musst nicht erklären, warum du dich meldest. „Ich wollte nur hallo sagen“ reicht völlig.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_musik',
    title: 'Musik & Klang',
    category: 'koerper_intra',
    image: img('Musik Lied Playlist'),
    description: 'Klang kann helfen, wieder im Körper anzukommen.',
    levels: [
      { level: 1, title: 'Ein Lied anhören', description: 'Ein vertrautes, ruhiges Lied auflegen.' },
      { level: 2, title: 'Bewusst zuhören', description: 'Für ein Lied nichts anderes tun, nur zuhören.' },
      { level: 3, title: 'Mitsummen oder bewegen', description: 'Leicht mitsummen oder sich sanft dazu bewegen.' },
      { level: 4, title: 'Eine Playlist gestalten', description: 'Eine kleine Playlist für genau solche Momente zusammenstellen.' },
    ],
    tip: 'Vertraute Musik wirkt oft stärker als neue — der Wiedererkennungseffekt allein kann schon beruhigen.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_notiz',
    title: 'Etwas aufschreiben',
    category: 'natur_inter',
    image: img('Schreiben Notiz Tagebuch'),
    description: 'Worte finden, ohne sie sofort teilen zu müssen.',
    levels: [
      { level: 1, title: 'Ein einzelnes Wort notieren', description: 'Ein Wort, das gerade passt — mehr nicht.' },
      { level: 2, title: 'Ein paar Sätze', description: 'Kurz aufschreiben, was gerade da ist.' },
      { level: 3, title: 'Ins Tagebuch schreiben', description: 'Einen Tagebucheintrag beginnen.' },
      { level: 4, title: 'Etwas gestalten', description: 'Schreiben, zeichnen oder anders kreativ ausdrücken, was da ist.' },
    ],
    tip: 'Es darf unfertig, unleserlich oder nur für dich verständlich sein — niemand außer dir muss es je lesen.',
    favorite: false,
    isCustom: false,
  },
];
