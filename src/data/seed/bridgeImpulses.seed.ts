import type { Bridge, BridgeCategory, BridgeLevel, StepExtras } from '../types';
import { suggestImagesFor } from '../../components/shared/imageSuggestionLibrary';

const img = (seed: string) => suggestImagesFor(seed)[0];

/**
 * Brücken-Impulse — ready-made BRIDGES, not single exercises.
 *
 * A bridge starts at a value ("Natur", "Freundschaft" …), is built from small
 * steps that get a little bigger each time, and every step names what carries
 * it: a place, an activity, a person, a thing, now and then a skill. Single
 * exercises (breathing, grounding, shaking …) live under Ressourcen → Skills
 * and are only attached to a step here where they really help the step.
 *
 * Adopting an impulse copies it into the person's own bridges with a fresh id;
 * this pool itself is never edited. `impulseId` is stable so "already adopted,
 * don't show again" keeps working even after the person renames their copy.
 * Extras point at the starter resources (stable ids); ids the person has
 * deleted are dropped when adopting (see DiscoverBridgesModal).
 */
export interface BridgeImpulse extends Omit<Bridge, 'id'> {
  impulseId: string;
  /** one sentence: why exactly this value, what this bridge is for */
  whyThis: string;
}

type Step = [title: string, description: string, energy: 1 | 2 | 3 | 4, extras?: StepExtras];

function make(
  impulseId: string,
  title: string,
  values: string[],
  category: BridgeCategory,
  imageSeed: string,
  description: string,
  whyThis: string,
  steps: Step[],
  tip: string,
): BridgeImpulse {
  const levels: BridgeLevel[] = steps.map(([t, d, e, x], i) => ({ level: i + 1, title: t, description: d, energyLevel: e, ...(x ? { extras: x } : {}) }));
  return { impulseId, title, category, connectionTags: values, image: img(imageSeed), description, whyThis, levels, tip, favorite: false, isCustom: false };
}

export const BRIDGE_IMPULSES: BridgeImpulse[] = [
  make(
    'gruen-zehn-minuten', 'Zehn Minuten Grün', ['Natur'], 'natur_inter', 'natur wald baum',
    'Vom Fenster bis zur Bank im Grünen — jeder Schritt nur ein kleines Stück weiter nach draußen.',
    'Wenn du im Kopf festhängst, bringt Natur Ruhe und Weite. Der Weg dorthin darf winzig anfangen.',
    [
      ['Aus dem Fenster schauen', 'Fenster öffnen, eine Minute nach draußen schauen: Was ist grün? Was bewegt sich?', 1],
      ['Vor die Tür treten', 'Schuhe an, Jacke an, bis zum Hauseingang. Einmal tief die Luft draußen riechen. Dann darfst du wieder rein.', 2],
      ['Zum nächsten Baum oder Grünstreifen gehen', 'Dort stehen bleiben und fünf grüne Dinge zählen.', 2, { skillIds: ['res_skill_54321'], aktivitaetIds: ['res_akt_spazieren'] }],
      ['Auf einer Bank sitzen', 'Thermoskanne mit Tee mitnehmen, 10 Minuten nur dasitzen und schauen.', 3, { aktivitaetIds: ['res_akt_tee'] }],
    ],
    'Du darfst auf jeder Stufe stehen bleiben — schon Schritt 1 ist die Brücke.',
  ),
  make(
    'lebenszeichen-freund', 'Ein Lebenszeichen an jemanden, der mir gut tut', ['Freundschaft', 'soziale Verbindung'], 'menschen_inter', 'freundschaft menschen nachricht',
    'Vom Namen aufschreiben bis zum Gespräch — ohne dass du dich sofort erklären musst.',
    'Verbindung beginnt selten mit einem langen Gespräch, sondern mit einer kleinen Geste, die nichts verlangt.',
    [
      ['Einen Namen aufschreiben', 'Wem gegenüber musst du dich nicht verstellen? Nur den Namen, sonst nichts.', 1],
      ['Einen Entwurf schreiben', 'Eine Nachricht an diese Person schreiben, aber noch nicht abschicken.', 2],
      ['Einen Satz abschicken', 'Zum Beispiel: „Ich hab an dich gedacht.“ Du erwartest keine Antwort.', 2],
      ['Anrufen oder etwas ausmachen', 'Eine kurze Runde telefonieren oder einen Spaziergang vorschlagen.', 3, { aktivitaetIds: ['res_akt_telefonieren'] }],
    ],
    'Ein nicht abgeschickter Entwurf ist trotzdem ein Schritt.',
  ),
  make(
    'koerper-waerme', 'Meinem Körper etwas Warmes geben', ['Erholung', 'Wasser/Nahrung'], 'koerper_intra', 'tee wärme decke',
    'Wärme, etwas Trinken und Gewicht — von der Decke bis zu zehn Minuten Liegen.',
    'Wenn der Körper sich unruhig oder leer anfühlt, ist Fürsorge für ihn der kürzeste Weg zurück zu dir.',
    [
      ['Eine Decke oder Wärmflasche holen', 'Nur holen und neben dich legen.', 1],
      ['Etwas Warmes trinken', 'Wasser aufsetzen, Tasse wählen, riechen, trinken — in Ruhe.', 2, { aktivitaetIds: ['res_akt_tee'] }],
      ['Hinlegen oder zurücklehnen', 'Zehn Minuten unter der Decke, Gewicht spüren, Atem darf bleiben wie er ist.', 2, { skillIds: ['res_skill_gewichtsdecke'] }],
      ['Fragen: Was braucht mein Körper noch?', 'Essen, Bewegung, Schlaf, Licht? Ein einziges Wort reicht.', 3],
    ],
    'Wärme darf sich einfach gut anfühlen. Du musst nichts „damit erreichen“.',
  ),
  make(
    'lied-bewegen', 'Zu einem Lied bewegen', ['Bewegung', 'Lachen'], 'koerper_intra', 'musik tanzen bewegung',
    'Vom Fußwippen zum ganzen Lied — Bewegung wächst mit der Musik mit.',
    'Bewegung bringt Energie zurück, ohne dass du „Sport“ machen musst. Musik nimmt dir die Entscheidung ab.',
    [
      ['Ein Lied wählen und anmachen', 'Eins, das du kennst und magst. Sonst nichts.', 1],
      ['Mitwippen', 'Fuß oder Kopf im Takt — im Sitzen reicht.', 1],
      ['Aufstehen und Arme mitnehmen', 'Schultern lockern, Arme schwingen lassen.', 2, { aktivitaetIds: ['res_akt_musik_tanzen'] }],
      ['Ein ganzes Lied durchtanzen', 'So, wie es gerade geht — niemand sieht zu.', 3],
    ],
    'Wenn es zu viel wird, bleib bei der Stufe davor.',
  ),
  make(
    'etwas-entstehen', 'Etwas entstehen lassen', ['Kreativität'], 'gedanken_werte_intra', 'malen zeichnen kreativ',
    'Von Stift und Papier bis zu einem Blatt, das an der Wand hängt.',
    'Kreativität holt dich aus dem Grübeln: Du machst etwas, statt etwas zu denken.',
    [
      ['Stift und Papier hinlegen', 'Nur hinlegen. Mehr nicht.', 1],
      ['Drei Linien ziehen', 'Egal welche. Es muss nichts darstellen.', 1, { aktivitaetIds: ['res_akt_malen'] }],
      ['Eine Stimmung malen', 'Welche Farbe hat es gerade? Fülle eine Fläche damit.', 2],
      ['Aufhängen oder fotografieren', 'Das Ergebnis sichtbar machen — als Beweis, dass du etwas entstehen lassen kannst.', 3],
    ],
    'Gelungen ist es, wenn du angefangen hast, nicht wenn es schön ist.',
  ),
  make(
    'fester-punkt', 'Ein fester Punkt im Tag', ['Rhythmus'], 'koerper_intra', 'rhythmus tag routine uhr',
    'Aus einer kleinen Handlung einen verlässlichen Anker machen.',
    'Wenn Tage verschwimmen, gibt ein fester Punkt Halt — er muss nur klein und wiederholbar sein.',
    [
      ['Einen Zeitpunkt wählen', 'Zum Beispiel direkt nach dem Aufstehen oder nach dem Mittagessen.', 1],
      ['Eine Mini-Handlung dazu legen', 'Ein Glas Wasser, ein Blick aus dem Fenster, einmal strecken.', 1],
      ['Sichtbar machen', 'Zettel an den Spiegel oder Haken im Kalender.', 2],
      ['Nach drei Tagen hinschauen', 'Was hat es mit dir gemacht? Anpassen darf sein.', 2],
    ],
    'Auslassen ist erlaubt — der Anker bleibt, wo er ist.',
  ),
  make(
    'etwas-gutes-sichtbar', 'Etwas Gutes sichtbar machen', ['Dankbarkeit'], 'gefuehle_intra', 'dankbarkeit herz notiz',
    'Von der kleinen guten Sache bis zum Dank an jemand anderen.',
    'Dankbarkeit richtet den Blick auf das, was schon da ist — ganz ohne Schönreden.',
    [
      ['Eine kleine gute Sache nennen', 'Egal wie klein: der Tee, ein freier Platz in der Bahn.', 1],
      ['Aufschreiben, warum', 'Ein Satz genügt.', 2],
      ['Es sichtbar aufstellen', 'Auf einen Zettel schreiben und dorthin legen, wo du ihn siehst.', 2],
      ['Es jemandem sagen', 'Einer Person danken, die dazu beigetragen hat.', 3],
    ],
    'Es muss nicht alles gut sein. Eine Sache reicht.',
  ),
  make(
    'licht-holen', 'Licht holen', ['Tageslicht'], 'koerper_intra', 'tageslicht sonne fenster',
    'Vom Rollo bis zu einem Spaziergang im Hellen.',
    'Tageslicht stützt Wachsein, Stimmung und Schlaf — selbst an grauen Tagen.',
    [
      ['Rollo hoch, Vorhang auf', 'Nur das.', 1],
      ['Ans Fenster setzen', 'Mit etwas Warmem in der Hand, fünf Minuten.', 1, { aktivitaetIds: ['res_akt_tee'] }],
      ['Kurz vor die Tür', 'Zehn Minuten draußen, ohne Ziel.', 2, { aktivitaetIds: ['res_akt_spazieren'] }],
      ['Eine Runde im Hellen drehen', 'Länger oder weiter, wenn es sich gut anfühlt.', 3],
    ],
    'Auch bei Wolken kommt draußen mehr Licht an als drinnen.',
  ),
  make(
    'schmunzeln', 'Etwas, das mich schmunzeln lässt', ['Humor', 'Lachen'], 'gefuehle_intra', 'humor lachen spaß',
    'Von einer Erinnerung bis zum gemeinsamen Lachen.',
    'Humor schafft Abstand zur Schwere und stärkt zugleich Verbindung.',
    [
      ['An etwas Lustiges denken', 'Eine Szene, ein Spruch, ein Tier.', 1],
      ['Etwas Lustiges suchen', 'Ein Video, ein Bild, ein alter Chat.', 1],
      ['Es aufschreiben oder speichern', 'So hast du es beim nächsten Mal sofort.', 2],
      ['Es mit jemandem teilen', 'Ein Foto oder Video schicken.', 3],
    ],
    'Lachen muss nicht kommen. Schmunzeln zählt.',
  ),
  make(
    'winzige-sache-fuer-wert', 'Eine winzige Sache für etwas, das mir wichtig ist', ['Sinn', 'Verantwortung'], 'gedanken_werte_intra', 'aufräumen aufgabe ordnung',
    'Vom Wert zur kleinsten Handlung, die ihm entspricht.',
    'Sinn entsteht nicht durch große Pläne, sondern durch ein paar kleine Handlungen, die zu dem passen, was dir wichtig ist.',
    [
      ['Den Wert benennen', 'Was ist dir gerade wichtig? Ein Wort, zum Beispiel „Ordnung“.', 1],
      ['Die kleinste Handlung finden', 'Was dauert zwei Minuten und gehört dazu? Etwa einen Gegenstand an seinen Platz räumen.', 1, { aktivitaetIds: ['res_akt_aufraeumen'] }],
      ['Es tun', 'Timer auf zwei Minuten, dann ist Schluss.', 2],
      ['Kurz festhalten', 'Ein Satz: Wie war es?', 2],
    ],
    'Zwei Minuten sind mit voller Absicht so klein gewählt.',
  ),
  make(
    'tiere-nah', 'Einem Tier nah sein', ['Tiere'], 'natur_inter', 'tiere vögel katze hund',
    'Vom Beobachten bis zur Begegnung.',
    'Tiere verlangen nichts von dir und sind trotzdem da — das macht Nähe leicht.',
    [
      ['Aus dem Fenster Vögel beobachten', 'Eine Minute: Wer ist da?', 1],
      ['Ein Tierbild oder Tiervideo ansehen', 'Eins, das dich beruhigt.', 1],
      ['Zu einem Tier gehen', 'Haustier streicheln, Nachbars Katze begrüßen oder Enten am Teich ansehen.', 2],
      ['Etwas für ein Tier tun', 'Futter hinstellen, Wasser auffüllen, spazieren gehen.', 3],
    ],
    'Auch Zimmerpflanzen zählen als lebendige Gesellschaft.',
  ),
  make(
    'naehe-ohne-gespraech', 'Nähe ohne Gespräch', ['emotionale Verbindung', 'Familie'], 'menschen_inter', 'nähe familie zusammen sofa',
    'Zusammen sein, ohne etwas erklären zu müssen.',
    'Nähe heißt nicht reden. Manchmal reicht es, im selben Raum zu sein.',
    [
      ['Im selben Raum sein', 'Du sitzt mit einem Menschen im selben Zimmer, jeder macht sein Ding.', 1],
      ['Etwas Kleines nebeneinander tun', 'Zum Beispiel Tee trinken, eine Serie ansehen oder Wäsche falten.', 2, { aktivitaetIds: ['res_akt_tee'] }],
      ['Einen Satz sagen', '„Ich bin gern hier.“ oder „Heute ist es schwer.“', 3],
    ],
    'Du bestimmst, wie viel du sagst.',
  ),
  make(
    'etwas-nur-meins', 'Etwas, das nur zu mir gehört', ['Identität', 'Integrität'], 'gedanken_werte_intra', 'identität eigen ich persönlich',
    'Von einem Lieblingsgegenstand bis zu einem Satz über dich.',
    'Identität zeigt sich in kleinen Dingen: was du magst, wie du etwas tust.',
    [
      ['Etwas Eigenes in die Hand nehmen', 'Ein Gegenstand, den nur du so hast.', 1],
      ['Drei Wörter dazu aufschreiben', 'Warum ist er dir wichtig?', 2],
      ['Einen Satz über dich schreiben', 'Beginn mit „Ich bin jemand, der …“.', 3],
    ],
    'Du musst nichts „richtig“ beschreiben, nur ehrlich.',
  ),
  make(
    'neugier-frage', 'Eine Frage, die mich interessiert', ['Neugier', 'Lernen'], 'gedanken_werte_intra', 'lernen neugier buch fragen',
    'Von der Frage bis zu einer kleinen Antwort.',
    'Neugier lenkt auf etwas Neues und gibt dem Kopf eine Aufgabe, die Spaß macht.',
    [
      ['Eine Frage aufschreiben', 'Worüber wunderst du dich gerade?', 1],
      ['Fünf Minuten nachlesen', 'Ein Artikel, ein Video, ein Buch.', 2],
      ['Eine Sache merken', 'Ein neuer Satz, den du erzählen könntest.', 2],
      ['Jemandem davon erzählen', 'Oder es dir selbst erzählen.', 3],
    ],
    'Es muss nichts Wichtiges sein, nur interessant.',
  ),
];
