/**
 * Vorführung für den Rundgang: ein Fingerzeig (Kreis) wandert über die ECHTE Seite, eine Sprechblase sagt,
 * was man hier tut. Es wird nichts angetippt oder gespeichert – es ist nur gezeigt.
 * `find`: "css:<selector>" oder ein Stück sichtbarer Text eines Knopfs/Titels.
 */
export interface DemoStep {
  find: string;
  act: 'tap' | 'slide' | 'point';
  de: string;
  en: string;
}

const T = (find: string, de: string, en: string): DemoStep => ({ find, act: 'tap', de, en });
const P = (find: string, de: string, en: string): DemoStep => ({ find, act: 'point', de, en });
const S = (find: string, de: string, en: string): DemoStep => ({ find, act: 'slide', de, en });

export const TOUR_DEMOS: Record<string, DemoStep[]> = {
  start: [
    T('Kurz einchecken', 'Hier starte ich mit einem kurzen Check-in: Wie geht es mir gerade? Ein Punkt reicht.', 'I start here with a short check-in: how am I right now? One point is enough.'),
    P('css:[data-testid="nurjetzt-entry"]', 'Wenn alles zu viel ist: „Nur jetzt“ – nichts müssen, nur im Moment bleiben.', 'When it is all too much: "Just now" – nothing to do, just stay in the moment.'),
    P('Krisenmodus', 'Und hier ist der Krisenmodus – immer erreichbar, mit einem Tipp.', 'And here is crisis mode – always reachable, one tap away.'),
  ],
  wetter: [
    S('css:[role="slider"]', 'Hier schiebe ich den Regler und wähle zum Beispiel „bewölkt“ – mein inneres Wetter, ganz ohne Fachwörter.', 'I move the slider and pick, say, "cloudy" – my inner weather, no technical words needed.'),
    P('Weiter', 'Dann geht es weiter: Ich benenne meine innere Anspannung und sehe, wo mein Nervensystem gerade steht.', 'Then I go on: I name my inner tension and see where my nervous system is right now.'),
  ],
  zugang: [
    T('Ich will mich regulieren', 'Wenn ich mich beruhigen oder sortieren will, wähle ich das hier.', 'If I want to calm down or sort myself, I pick this.'),
    T('Ich will etwas tun', 'Oder ich will etwas tun, weiß aber nicht was – dann hilft mir die App beim Finden.', 'Or I want to do something but do not know what – the app helps me find it.'),
    T('Ich weiß es gerade nicht', 'Und „Ich weiß es gerade nicht“ ist auch eine gültige Antwort.', 'And "I do not know right now" is a perfectly valid answer.'),
  ],
  ressource: [
    T('Hilfsmittel/Werkzeug erstellen', 'Hier lege ich mir eigene Hilfsmittel an – Eisbeutel, Lieblingslied, Igelball …', 'Here I add my own tools – an ice pack, a favourite song, a spiky ball …'),
    T('Haptisch', 'Mit den Kategorien finde ich schnell, was zu mir passt: Fühlen, Hören, Riechen …', 'The categories help me find what fits: touch, hearing, smell …'),
    P('Favorit', 'Mit dem Stern merke ich mir, was am besten hilft.', 'With the star I remember what helps most.'),
  ],
  skill: [
    P('css:[data-testid="skills-breath-link"]', 'Hier sind die Atemübungen – mit Kreis, Welle und mehr.', 'Here are the breathing exercises – with circle, wave and more.'),
    T('Stresstoleranz', 'Die Skills sind nach Bereichen sortiert – ich tippe einen an und probiere ihn aus.', 'Skills are sorted by area – I tap one and try it out.'),
    P('Neuer Skill', 'Eigene Skills kann ich jederzeit dazufügen.', 'I can add skills of my own at any time.'),
  ],
  bruecke: [
    T('Neue Brücke', 'Eine Brücke verbindet Dinge, die mir guttun, mit Momenten im Alltag.', 'A bridge connects things that do me good with moments in everyday life.'),
    P('Erholung', 'Die Themen zeigen mir, was ich schon alles habe.', 'The topics show me what I already have.'),
  ],
  netzwerk: [
    T('Neues Element hinzufügen', 'Hier füge ich Menschen, Orte, Tiere oder Dinge hinzu, die mich tragen.', 'Here I add people, places, animals or things that carry me.'),
    P('css:[data-testid^="net-node-"]', 'Jedes Element sitzt im Netz – ich kann es verschieben, wie es sich richtig anfühlt.', 'Each element sits in the web – I can move it so it feels right.'),
    T('Vollbild', 'Im Vollbild sehe ich mein ganzes Netz – und kann eine Momentaufnahme speichern.', 'In full screen I see my whole web – and can save a snapshot.'),
  ],
  plan: [
    P('Schnell Hilfe holen', 'Der Sicherheitsplan: Hier steht, was ich tun kann – bevor es schwer wird.', 'The safety plan: what I can do – before things get hard.'),
    T('Teilen & PDF', 'Ich kann ihn als PDF teilen, zum Beispiel mit meiner Therapeutin.', 'I can share it as PDF, for example with my therapist.'),
  ],
  krise: [
    P('css:[data-testid="crisis-call-112"]', 'Im Krisenmodus ist alles groß und ruhig: Hilfe ist ein Tipp entfernt.', 'In crisis mode everything is large and calm: help is one tap away.'),
    P('Mein Sicherheitsplan', 'Und mein eigener Plan ist gleich dabei.', 'And my own plan is right there.'),
  ],
  rueckblick: [
    T('Tagesrückblick', 'Im Rückblick sehe ich, was war: Check-ins, Routinen, Skills – alles verbunden.', 'In the look-back I see what was: check-ins, routines, skills – all connected.'),
  ],
  medi: [
    T('Neuer Eintrag', 'Hier trage ich ein, was ich genommen habe – dann weiß ich es später noch.', 'Here I note what I took – so I still know later.'),
  ],
  timer: [
    T('Timer starten', 'Ein Timer für Pausen oder Übungen – ganz einfach.', 'A timer for breaks or exercises – simple.'),
  ],
  parkbox: [
    T('css:[data-testid="park-input"]', 'Gedanken, die gerade stören, parke ich hier …', 'Thoughts that disturb right now – I park them here …'),
    T('In die Box legen', '… lege sie in die Box und kümmere mich später darum.', '… put them in the box and deal with them later.'),
  ],
  loslassen: [
    T('Gedanken aufschreiben', 'Aufschreiben, loslassen – der Gedanke muss nicht im Kopf bleiben.', 'Write it down, let it go – the thought does not have to stay in my head.'),
  ],
  gefuehle: [
    P('Angst / Stress', 'Hier lerne ich Gefühle kennen – jedes hat seinen Sinn und seine Farbe.', 'Here I get to know feelings – each has its meaning and colour.'),
  ],
  nerv: [
    T('Verbunden', 'Die Zustände des Nervensystems, einfach erklärt – nichts davon ist „falsch“.', 'The nervous system states, simply explained – none of them is "wrong".'),
  ],
  beduerfnis: [
    T('Verbindung', 'Hinter jedem Gefühl steckt ein Bedürfnis – hier suche ich meins.', 'Behind each feeling is a need – here I look for mine.'),
  ],
  garten: [
    T('css:[data-testid="routine-new"]', 'Routinen baue ich mir aus kleinen Karten selbst zusammen.', 'I build routines myself from small cards.'),
    P('css:[data-testid^="routine-start-"]', 'Und starte sie, wann immer ich mag.', 'And start them whenever I like.'),
  ],
  nurjetzt: [
    P('css:[data-testid="nurjetzt-entry"]', 'Ganz im Moment bleiben – ohne etwas auszufüllen.', 'Staying fully in the moment – without filling in anything.'),
  ],
};

export const hasDemo = (id: string | undefined) => !!id && !!TOUR_DEMOS[id];
/** rough running time of a demo (ms), so a station never ends in the middle of it */
export function demoDuration(id: string | undefined): number {
  const steps = (id && TOUR_DEMOS[id]) || [];
  return steps.reduce((n, s) => n + 2300 + s.de.length * 45, 1400);
}
