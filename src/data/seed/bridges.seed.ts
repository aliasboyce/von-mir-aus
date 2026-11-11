import type { Bridge } from '../types';
import { symbolImage } from '../../components/shared/symbolImage';
import { builtInBridgeColor } from '../../components/shared/itemColors';
import { withSeedBridgeFit } from '../../content/seedBridgeFit';

/**
 * Point 4 — each bridge's image now actually matches its own theme (a
 * nature icon for the nature bridge, a phone icon for the contact
 * bridge) via the local SVG icon library, instead of an arbitrary
 * picsum.photos stock photo that had no real connection to the bridge's
 * content.
 */
const img = (_name: string) => '';

const RAW_DEMO_BRIDGES: Bridge[] = [
  {
    id: 'bridge_natur',
    title: '10 Minuten Natur',
    category: 'natur_inter',
    connectionTags: ['Natur', 'Tageslicht', 'Bewegung'],
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
    id: 'bridge_kontakt',
    title: 'Anrufen & Sprechen',
    category: 'menschen_inter',
    connectionTags: ['soziale Verbindung', 'Freundschaft'],
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
  /**
   * "Soforthilfen sollen nicht mehr als Bruecke, sondern als Skills
   * abgespeichert sein"-Auftrag — the fifteen zone-exercise bridges
   * that used to live here (one set per arousal-ladder zone, linked
   * from each zone's own exercise picker) were converted to skill
   * resources instead — see DBT_SKILL_RESOURCES in resources.seed.ts
   * and AROUSAL_BANDS in arousalBands.ts, which now points to those
   * resource ids. The three remaining bridges below (Salamander-
   * Blick, Schulterkreisen, Isometrischer Hand-Zug) were never part
   * of that zone-exercise set and stay exactly as they were.
   */

];

export const DEMO_BRIDGES: Bridge[] = RAW_DEMO_BRIDGES.map((b) => withSeedBridgeFit({ ...b, image: symbolImage(b.title, builtInBridgeColor(b.category), '🌉') }));
