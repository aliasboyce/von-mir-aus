/**
 * "Was ist neu-Hinweis beim Update"-Auftrag — a short, hand-written
 * list of what changed, shown once to someone who just reloaded after
 * an update (see useWhatsNew.ts). Newest entry first. Keep each
 * entry's `items` to 2-4 short, plain-language bullets — this is a
 * friendly note, not a technical release log. Add a new entry here at
 * the end of a work session that changed something a person would
 * actually notice; skip purely internal/invisible fixes.
 */
export interface ChangelogEntry {
  id: string;
  date: string;
  items: string[];
  itemsEn: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: '2026-lebendige-app-dino-medipackungen',
    date: '2026',
    items: [
      'Neu: Die Startseite und der Garten spiegeln jetzt Tageszeit und Jahreszeit wider — mit Sternenhimmel, Sonnenaufgang/-untergang und jahreszeitlichen Details.',
      'Neu: Ein kleines Lauf-Spiel mit dem Wesen (erreichbar über das Wesen-Menü) — mit Zeit-Bonus fürs Funken-Sammeln.',
      'Neu: Medikamenten-Packungen — trage an, wie viele Tabletten eine Packung hat, die App zählt den Verbrauch automatisch mit und warnt, wenn es knapp wird.',
      'Der Timer bei Übungen zeigt jetzt einen ruhigen, dünnen Fortschrittsring statt einer groben Anzeige.',
      'Die Nervensystem-Beschreibungen sind jetzt offener formuliert ("das kann bedeuten...") statt sehr bestimmt.',
      'Mehrere kleinere Fehler behoben, u. a. beim "Eigenes erstellen" in den Ablenkungs-Kategorien und beim Wesen-Menü auf dem Laptop.',
    ],
    itemsEn: [
      'New: The home screen and garden now reflect time of day and season — with a starry sky, sunrise/sunset, and seasonal details.',
      "New: A small running game with your companion (reachable from the companion menu) — collect sparks for a time bonus.",
      'New: Medication packages — enter how many tablets a package has, the app automatically tracks usage and warns when it\'s running low.',
      'The exercise timer now shows a calm, thin progress ring instead of a bulkier display.',
      'Nervous-system descriptions are now phrased more openly ("this can mean...") instead of very definite.',
      'Several smaller fixes, including "create your own" in the distraction categories and the companion menu on laptop screens.',
    ],
  },
  {
    id: '2026-koerper-detektiv-uebungen',
    date: '2026',
    items: [
      'Neu: Körper-Detektiv (🔍) — falls du dich gerade nicht einschätzen kannst, drei einfache Körper-Fragen finden den passenden Stand für dich.',
      '18 Soforthilfe-Übungen, drei pro Nervensystem-Stufe, direkt aus dem Regler erreichbar.',
      'Neu: Reflexions-Tagebuch — tippe auf einen Punkt im Verlauf, um kurz festzuhalten, was da war.',
      'Neu: Fenster-Fortschritt speichern und als Chronik nachlesen oder exportieren.',
      '"Erklär\'s mir als..." — die Nervensystem-Erklärung jetzt auch einfacher oder fachlicher lesbar.',
      'Ein hartnäckiger Fehler bei der Weiterleitung zu manchen Übungen ist behoben.',
    ],
    itemsEn: [
      'New: Body detective (🔍) — if you can\'t tell where you are right now, three simple body questions find the right spot for you.',
      '18 quick-help exercises, three per nervous-system stage, reachable straight from the slider.',
      'New: reflection journal — tap a point in your history to briefly note what was going on.',
      'New: save your window progress and look back at it as a chronicle, or export it.',
      '"Explain it to me as..." — the nervous system explainer can now also be read simpler or more clinically.',
      'A persistent bug where some exercises failed to open has been fixed.',
    ],
  },
  {
    id: '2026-nervensystem-6-zonen',
    date: '2026',
    items: [
      'Der Nervensystem-Regler ist komplett überarbeitet: sechs feinere Stufen statt drei, mit neuem Regenbogen-Design.',
      'Neu: Klinische Fenster-Kalibrierung — stelle dein eigenes Toleranzfenster ein, samt sanfter Warnung, wenn du deinen persönlichen Bereich verlässt.',
      'Ein neuer, ausführlicher Erklärtext zum Modell (zum Aufklappen) an allen drei Check-in-Stellen.',
    ],
    itemsEn: [
      'The nervous system slider has been completely reworked: six finer stages instead of three, with a new rainbow design.',
      'New: clinical window calibration — set your own window of tolerance, with a gentle warning when you leave your personal range.',
      'A new, detailed explainer about the model (collapsible) at all three check-in spots.',
    ],
  },
  {
    id: '2026-monatsrueckblick',
    date: '2026',
    items: [
      'Neu: Monatsrückblick — im Wochenrückblick zwischen Woche und Monat umschalten.',
      'Diese kurze "Was ist neu"-Anzeige nach einem Update.',
    ],
    itemsEn: [
      'New: monthly review — switch between week and month in the review page.',
      'This short "what\'s new" note after an update.',
    ],
  },
];
