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
  /**
   * "Sofort-Hilfe-Uebungen nach Stufen"-Auftrag — six brand-new bridge
   * entries, one per arousal-ladder zone, each holding the specific
   * technique from the person's detailed clinical brief (including the
   * origin/source of each — kept in the tip field, briefly, matching
   * how sourcing already appears elsewhere in this file rather than
   * inventing a new field). Each is linked from its own zone's hint
   * (see arousalBands.ts / ArousalModelExplainer) via bridgeId.
   */
  {
    id: 'bridge_478_atmung',
    title: '4-7-8 Atmung',
    category: 'koerper_intra',
    image: img('Atem atmen Wind'),
    description: 'Eine ruhige, verlängerte Ausatmung, um den Körper aus reiner Unter-Aktivierung sanft aufzuwecken.',
    levels: [
      { level: 1, title: 'Ein Durchgang', description: '4 Sekunden einatmen, 7 Sekunden halten (oder kürzer, falls das Halten unangenehm ist), 8 Sekunden ausatmen.', energyLevel: 1 },
      { level: 2, title: 'Mehrere Runden', description: 'Den Zyklus 3-4 Mal wiederholen, in deinem eigenen Tempo.', energyLevel: 2 },
    ],
    tip: 'Entwickelt von Dr. Andrew Weil, basierend auf der Pranayama-Atemlehre — die verlängerte Ausatmung aktiviert nachweislich den beruhigenden Teil deines Nervensystems (ventraler Vagus). Wenn das Halten der Luft unangenehm ist, lass diesen Teil einfach weg.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_grounding_54321',
    title: 'Kognitives Grounding',
    category: 'koerper_intra',
    image: img('Achtsamkeit Sinne wahrnehmen'),
    description: 'Die 5-4-3-2-1-Methode holt deine Aufmerksamkeit aus dem Kreisen zurück in den gegenwärtigen Moment.',
    levels: [
      { level: 1, title: 'Kurzfassung', description: 'Finde 5 Dinge, die du gerade siehst, und 4, die du körperlich spürst.', energyLevel: 1 },
      { level: 2, title: 'Vollständig', description: '5 Dinge sehen, 4 spüren, 3 hören, 2 riechen, 1 schmecken — der Reihe nach.', energyLevel: 2 },
    ],
    tip: 'Ein Standardverfahren aus der kognitiven Verhaltenstherapie und den Achtsamkeitsprotokollen (MBSR) nach Dr. Jon Kabat-Zinn — lenkt die Aufmerksamkeit gezielt weg vom Grübeln hin zum Hier und Jetzt.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_voo_atem',
    title: 'Orientierung & Voo-Atem',
    category: 'koerper_intra',
    image: img('Raum Orientierung Umschauen'),
    description: 'Den Raum nach sicheren Dingen absuchen und mit einem tönenden Ausatmen emotionale Überflutung dämpfen.',
    levels: [
      { level: 1, title: 'Nur orientieren', description: 'Lass deinen Blick langsam durch den Raum wandern und finde 3 Dinge, die sich neutral oder beruhigend anfühlen.', energyLevel: 1 },
      { level: 2, title: 'Mit Voo-Ton', description: 'Danach tief einatmen und beim Ausatmen ein tiefes, tönendes „Vooo" erklingen lassen — so lange und ruhig wie angenehm.', energyLevel: 2 },
    ],
    tip: 'Entwickelt von Dr. Peter Levine (Somatic Experiencing) — das Scannen aktiviert die Suche nach Sicherheit, die Vibration des Tönens dämpft über den Vagusnerv im Kehlkopfbereich emotionale Überflutung.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_physio_seufzer',
    title: 'Physiologischer Seufzer',
    category: 'koerper_intra',
    image: img('Atem atmen Wind'),
    description: 'Zwei kurze Einatmer durch die Nase, dann lang und seufzend durch den Mund ausatmen — senkt den Puls in Echtzeit.',
    levels: [{ level: 1, title: 'Ein bis drei Durchgänge', description: 'Doppelt kurz durch die Nase einatmen, dann lang und hörbar durch den Mund ausatmen. 1-3 Mal wiederholen.', energyLevel: 1 }],
    tip: 'Bekannt gemacht durch Prof. Andrew Huberman (Stanford) und Dr. David Spiegel, in einer klinischen Studie (Cell Reports Medicine, 2023) bestätigt — die schnellste bekannte Methode, den Puls biochemisch zu senken.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_salamander_blick',
    title: 'Der Salamander-Blick',
    category: 'koerper_intra',
    image: img('Augen Blick Orientierung'),
    description: 'Kopf ruhig halten, Augen weit zur Seite bewegen, bis sich Gähnen oder Schlucken einstellt — löst innere Erstarrung.',
    levels: [{ level: 1, title: 'Einmal probieren', description: 'Kopf geradeaus halten. Nur die Augen ganz nach rechts bewegen und einige Atemzüge dort verweilen, bis sich Gähnen oder Schlucken einstellt. Dann zur anderen Seite.', energyLevel: 1 }],
    tip: 'Entwickelt von Stanley Rosenberg (Vagus-Regulation) — die extreme Augenbewegung ohne Kopfdrehung entkoppelt die für die Freeze-Reaktion verantwortlichen Hirnnerven. Das unwillkürliche Gähnen zeigt: das System löst sich.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_schmetterling_klopf',
    title: 'Schmetterlings-Klopfen',
    category: 'koerper_intra',
    image: img('Umarmung Selbstfürsorge Halt'),
    description: 'Arme vor der Brust kreuzen, abwechselnd sanft links und rechts klopfen — bringt beide Gehirnhälften wieder in Kontakt.',
    levels: [{ level: 1, title: 'Ein paar Minuten', description: 'Arme vor der Brust kreuzen, Hände auf die Oberarme legen. Ganz langsam und sanft abwechselnd links, dann rechts klopfen — so lange es guttut.', energyLevel: 1 }],
    tip: 'Entwickelt von Lucina Artigas, Teil des EMDR-Protokolls nach Dr. Francine Shapiro — die wechselseitige Stimulation hilft, aus Taubheit und Dissoziation sanft in den Körper zurückzufinden.',
    favorite: false,
    isCustom: false,
  },
];
